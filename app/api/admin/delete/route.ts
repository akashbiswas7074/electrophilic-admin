import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Admin from "@/lib/database/models/admin.model";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    // Authenticate the request - only admins should be able to delete other admins
    let isAuthenticated = false;
    
    // Method 1: Check using NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.log("NextAuth session check failed:", error);
    }
    
    // Method 2: Check for adminId cookie
    if (!isAuthenticated) {
      const cookieStore = cookies();
      const adminId = cookieStore.get('adminId')?.value;
      
      if (adminId) {
        isAuthenticated = true;
      }
    }
    
    if (!isAuthenticated && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Admin ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Count total admins before deletion
    const totalAdmins = await Admin.countDocuments();
    
    // Don't allow deletion of the last admin
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { success: false, message: "Cannot delete the last admin account" },
        { status: 400 }
      );
    }
    
    // Get admin making the request
    const cookieStore = cookies();
    const currentAdminId = cookieStore.get('adminId')?.value;
    
    // Don't allow admins to delete their own account while logged in
    if (currentAdminId === id) {
      return NextResponse.json(
        { success: false, message: "Cannot delete your own account while logged in" },
        { status: 400 }
      );
    }

    const deletedAdmin = await Admin.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });

  } catch (error: any) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete admin" },
      { status: 500 }
    );
  }
}
