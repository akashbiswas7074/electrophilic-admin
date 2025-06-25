import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Get the current user's role and information
 * This handles both NextAuth sessions and the custom vendor token
 */
export async function getCurrentUserRole() {
  // Try to get user from NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      isAuthenticated: true,
      role: session.user.role || 'user',
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      isAdmin: session.user.role === 'admin',
      isVendor: session.user.role === 'vendor'
    };
  }

  // Try to get vendor from cookie token
  const cookieStore = await cookies();
  const vendor_token = cookieStore.get("vendor_token");
  
  if (vendor_token?.value) {
    try {
      const decoded = jwt.verify(vendor_token.value, process.env.JWT_SECRET as string);
      if (decoded && typeof decoded === 'object' && 'id' in decoded) {
        return {
          isAuthenticated: true,
          role: 'vendor',
          id: decoded.id,
          isAdmin: false,
          isVendor: true
        };
      }
    } catch (error) {
      // Invalid token, fall through to check admin
    }
  }

  // Check admin cookie as a fallback
  const adminId = cookieStore.get("adminId");
  if (adminId?.value) {
    return {
      isAuthenticated: true,
      role: 'admin',
      id: adminId.value,
      isAdmin: true,
      isVendor: false
    };
  }

  // No authenticated user found
  return {
    isAuthenticated: false,
    role: 'guest',
    isAdmin: false,
    isVendor: false
  };
}

/**
 * Filter products to only show products from the vendor if the user is a vendor
 */
export async function filterProductsByUserRole(products: any[]) {
  const user = await getCurrentUserRole();
  
  // If admin, show all products
  if (user.isAdmin) {
    return products;
  }
  
  // If vendor, filter products to only show those from this vendor
  if (user.isVendor) {
    return products.filter(product => 
      product.vendorId && product.vendorId.toString() === user.id.toString()
    );
  }
  
  // For other users, show all products (this shouldn't happen in admin panel)
  return products;
}

/**
 * Check if the current user has permission to edit a specific product
 */
export async function canEditProduct(productId: string, vendorId?: string) {
  const user = await getCurrentUserRole();
  
  // Admins can edit any product
  if (user.isAdmin) {
    return true;
  }
  
  // Vendors can only edit their own products
  if (user.isVendor && vendorId) {
    return user.id.toString() === vendorId.toString();
  }
  
  return false;
}