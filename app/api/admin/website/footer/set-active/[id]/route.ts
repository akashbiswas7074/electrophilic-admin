import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteFooter from "@/lib/database/models/website.footer.model";

export async function PUT(
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

    // Set as active - the pre-save hook will handle deactivating other footers
    footer.isActive = true;
    await footer.save();

    return NextResponse.json({
      success: true,
      message: "Footer configuration set as active successfully",
      footer,
    });
  } catch (error: any) {
    console.error("Error setting footer as active:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to set footer as active",
      },
      { status: 500 }
    );
  }
}