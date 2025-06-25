"use server";
import { cookies } from "next/headers";

export const adminLogout = async () => {
  try {
    const cookieStore = await cookies();
    
    // Delete all admin authentication tokens
    cookieStore.delete("adminId");
    cookieStore.delete("admin_token");
    
    // Also clear NextAuth session cookies
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    
    return {
      success: true,
      message: "Successfully logged out!"
    };
  } catch (error: any) {
    console.error("Admin logout error:", error);
    return {
      success: false,
      message: "Error during logout"
    };
  }
};