import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/database/connect";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";
import { verifyJwtToken } from "./auth-helpers";

// Import User, Admin, and Vendor models
import User from "@/lib/database/models/user.model";
import Admin from "@/lib/database/models/admin.model";
import Vendor from "@/lib/database/models/vendor.model";

// Define extended User type for NextAuth
interface ExtendedUser {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  verified: boolean;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "admin",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectToDatabase();

          // Find admin by email
          const admin = await Admin.findOne({ email: credentials.email }).select("+password");

          // If no admin found
          if (!admin) {
            return null;
          }

          // Check password
          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password);

          if (!isPasswordValid) {
            return null;
          }

          // Return admin object
          return {
            id: admin._id.toString(),
            name: admin.name || admin.email,
            email: admin.email,
            role: 'admin',
            verified: true,
          };
        } catch (error) {
          console.error("Admin auth error:", error);
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: "vendor",
      name: "Vendor Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectToDatabase();

          // Find vendor by email
          const vendor = await Vendor.findOne({ email: credentials.email }).select("+password");

          if (!vendor) {
            return null;
          }

          // Check password
          const isPasswordValid = await vendor.comparePassword(credentials.password);

          if (!isPasswordValid) {
            return null;
          }

          // Check if vendor is verified by admin
          if (!vendor.verified) {
            throw new Error("VendorNotApproved");
          }

          // Return vendor object
          return {
            id: vendor._id.toString(),
            name: vendor.name,
            email: vendor.email,
            role: vendor.role || 'vendor',
            verified: vendor.verified || false,
          };
        } catch (error: any) {
          console.error("Vendor auth error:", error);
          if (error.message === "VendorNotApproved") {
            throw error;
          }
          return null;
        }
      }
    }),
    // Add a token-based credential provider for admin tokens
    CredentialsProvider({
      id: "admin-token",
      name: "Admin Token",
      credentials: {
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.token) {
          return null;
        }

        try {
          const payload = await verifyJwtToken(credentials.token);
          
          if (!payload || payload.role !== 'admin') {
            return null;
          }
          
          // Return a user object based on the token payload
          return {
            id: payload.id,
            email: payload.email,
            name: payload.email.split('@')[0],
            role: 'admin',
            verified: true
          };
        } catch (error) {
          console.error("Admin token auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        
        if (user.role === 'vendor') {
          token.verified = user.verified || false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        
        if (token.role === 'vendor') {
          (session.user as any).verified = token.verified as boolean;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Custom redirect logic
      if (url.startsWith(baseUrl)) {
        // Handle internal URLs
        if (url.includes('/admin/')) {
          return `${baseUrl}/admin/dashboard`;
        }
        if (url.includes('/vendor/')) {
          return `${baseUrl}/vendor/dashboard`;
        }
        return url;
      } else if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Retrieves the current user session from the server
 * @returns The current user session or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    
    // If we have a NextAuth session, return it
    if (session?.user) {
      return session.user;
    }
    
    // Otherwise, check for cookies
    const cookieStore = await cookies();
    const adminId = cookieStore.get('adminId')?.value;
    const adminToken = cookieStore.get('adminToken')?.value;
    
    if (adminToken) {
      const payload = await verifyJwtToken(adminToken);
      if (payload && payload.role === 'admin') {
        return {
          id: payload.id,
          email: payload.email,
          role: 'admin'
        };
      }
    }
    
    if (adminId) {
      // We have an adminId cookie but no valid token, try to find admin in DB
      try {
        await connectToDatabase();
        const admin = await Admin.findById(adminId);
        
        if (admin) {
          return {
            id: admin._id.toString(),
            email: admin.email,
            role: 'admin'
          };
        }
      } catch (error) {
        console.error("Error fetching admin by id:", error);
      }
    }
    
    // Check for vendor authentication
    const vendorToken = cookieStore.get('vendor_token')?.value;
    if (vendorToken) {
      try {
        const decoded = require('jsonwebtoken').verify(
          vendorToken, 
          process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
        );
        
        // Fetch vendor data from database to get complete profile
        await connectToDatabase();
        const vendor = await Vendor.findById(decoded.id);
        
        if (vendor) {
          return {
            id: vendor._id.toString(),
            email: vendor.email,
            name: vendor.name,
            role: 'vendor',
            verified: vendor.verified
          };
        } else {
          console.error("Vendor not found in database for token ID:", decoded.id);
          return null;
        }
      } catch (error) {
        console.error("Vendor token verification error:", error);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Check if current user is vendor
 */
export async function isVendor() {
  const user = await getCurrentUser();
  return user?.role === 'vendor';
}

/**
 * Check if current user is verified vendor
 */
export async function isVerifiedVendor() {
  const user = await getCurrentUser();
  return user?.role === 'vendor' && user?.verified === true;
}