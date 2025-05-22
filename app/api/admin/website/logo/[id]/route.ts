import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteLogo from "@/lib/database/models/website.logo.model";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDatabase();

    // Find the logo
    const logo = await WebsiteLogo.findById(id);

    if (!logo) {
      return NextResponse.json(
        { success: false, message: "Logo not found" },
        { status: 404 }
      );
    }

    // Check if it's the active logo
    if (logo.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Cannot delete the active logo. Please set another logo as active first." 
        },
        { status: 400 }
      );
    }

    // Delete the logo
    await WebsiteLogo.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Logo deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting logo:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete logo",
      },
      { status: 500 }
    );
  }
}