"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "./database/connect";
import Vendor from "./database/models/vendor.model";
import Admin from "./database/models/admin.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

// Types for role-based user context
export type UserContext = {
  role: 'admin' | 'vendor' | 'guest';
  userId?: string;
  name?: string;
  email?: string;
  verified?: boolean;
  isAuthenticated: boolean;
};

/**
 * Get the current user's context based on authentication tokens
 * Checks both NextAuth session and vendor_token cookie
 */
export async function getCurrentUserContext(): Promise<UserContext> {
  // Default unauthenticated context
  const defaultContext: UserContext = {
    role: 'guest',
    isAuthenticated: false
  };

  try {
    // First check NextAuth session (used by both admin and vendor)
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      return {
        role: session.user.role as 'admin' | 'vendor',
        userId: session.user.id,
        name: session.user.name || undefined,
        email: session.user.email || undefined,
        verified: session.user.verified,
        isAuthenticated: true
      };
    }
    
    // If no NextAuth session, check for vendor token cookie
    const cookieStore = await cookies();
    const vendorToken = cookieStore.get("vendor_token");
    
    if (!vendorToken?.value) {
      return defaultContext;
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(vendorToken.value, process.env.JWT_SECRET as string) as { id: string };
      
      if (!decoded || !decoded.id) {
        return defaultContext;
      }

      // Connect to database and fetch vendor
      await connectToDatabase();
      const vendor = await Vendor.findById(decoded.id);
      
      if (!vendor) {
        return defaultContext;
      }

      return {
        role: 'vendor',
        userId: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        verified: vendor.verified,
        isAuthenticated: true
      };
    } catch (error) {
      console.error("Error verifying vendor token:", error);
      return defaultContext;
    }
  } catch (error) {
    console.error("Error in getCurrentUserContext:", error);
    return defaultContext;
  }
}

/**
 * Filter products to only show those belonging to the current vendor
 * if the user is a vendor, or all products if the user is an admin
 */
export async function getProductsForCurrentUser(products: any[]) {
  const userContext = await getCurrentUserContext();
  
  if (!userContext.isAuthenticated) {
    return [];
  }
  
  if (userContext.role === 'admin') {
    // Admin sees all products
    return products;
  }
  
  if (userContext.role === 'vendor' && userContext.userId) {
    // Vendor only sees their own products
    return products.filter(product => 
      product.vendorId && 
      (product.vendorId.toString() === userContext.userId || 
       (typeof product.vendorId === 'object' && product.vendorId._id && 
        product.vendorId._id.toString() === userContext.userId))
    );
  }
  
  return [];
}

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userContext = await getCurrentUserContext();
  return userContext.role === 'admin' && userContext.isAuthenticated;
}

/**
 * Check if the current user is a vendor
 */
export async function isCurrentUserVendor(): Promise<boolean> {
  const userContext = await getCurrentUserContext();
  return userContext.role === 'vendor' && userContext.isAuthenticated;
}

/**
 * Check if the current user is a verified vendor
 */
export async function isCurrentUserVerifiedVendor(): Promise<boolean> {
  const userContext = await getCurrentUserContext();
  return userContext.role === 'vendor' && userContext.isAuthenticated && !!userContext.verified;
}