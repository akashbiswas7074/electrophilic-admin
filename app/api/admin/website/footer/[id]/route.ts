import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteFooter from "@/lib/database/models/website.footer.model";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDatabase();

    // Find the footer
    const footer = await WebsiteFooter.findById(id);

    if (!footer) {
      return NextResponse.json(
        { success: false, message: "Footer configuration not found" },
        { status: 404 }
      );
    }

    // Check if it's the active footer
    if (footer.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Cannot delete the active footer configuration. Please set another footer as active first." 
        },
        { status: 400 }
      );
    }

    // Delete the footer
    await WebsiteFooter.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Footer configuration deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting footer configuration:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete footer configuration",
      },
      { status: 500 }
    );
  }
}