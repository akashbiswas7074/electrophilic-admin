import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Vendor from "@/lib/database/models/vendor.model";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== 'vendor') {
      return NextResponse.json({ error: "Access denied. Vendor role required." }, { status: 403 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        success: false, 
        message: "Current password and new password are required" 
      }, { status: 400 });
    }

    await connectToDatabase();

    const vendor = await Vendor.findById(currentUser.id);
    
    if (!vendor) {
      return NextResponse.json({ 
        success: false, 
        message: "Vendor not found" 
      }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, vendor.password);
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        success: false, 
        message: "Current password is incorrect" 
      }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await Vendor.findByIdAndUpdate(currentUser.id, {
      password: hashedNewPassword
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update password" 
      }, 
      { status: 500 }
    );
  }
}