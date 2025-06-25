import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Clear all admin-related cookies
    cookies().delete("adminId");
    cookies().delete("adminToken");
    
    // Clear NextAuth session cookie if it exists
    cookies().delete("next-auth.session-token");
    cookies().delete("next-auth.csrf-token");
    cookies().delete("next-auth.callback-url");
    
    return NextResponse.json({
      success: true,
      message: "Admin logged out successfully"
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to logout" },
      { status: 500 }
    );
  }
}
