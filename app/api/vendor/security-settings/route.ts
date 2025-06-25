import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Vendor from "@/lib/database/models/vendor.model";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== 'vendor') {
      return NextResponse.json({ error: "Access denied. Vendor role required." }, { status: 403 });
    }

    const settings = await req.json();

    await connectToDatabase();

    // Update security settings
    const updatedVendor = await Vendor.findByIdAndUpdate(
      currentUser.id,
      {
        $set: {
          'securitySettings.twoFactorEnabled': settings.twoFactorEnabled,
          'securitySettings.emailNotifications': settings.emailNotifications,
          'securitySettings.smsNotifications': settings.smsNotifications,
          'securitySettings.loginAlerts': settings.loginAlerts,
          'securitySettings.marketingEmails': settings.marketingEmails
        }
      },
      { new: true }
    );

    if (!updatedVendor) {
      return NextResponse.json({ 
        success: false, 
        message: "Vendor not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Security settings updated successfully"
    });

  } catch (error: any) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update security settings" 
      }, 
      { status: 500 }
    );
  }
}