import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteLogo from "@/lib/database/models/website.logo.model";

export async function PUT(
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

    // Set as active - the pre-save hook will handle deactivating other logos
    logo.isActive = true;
    await logo.save();

    return NextResponse.json({
      success: true,
      message: "Logo set as active successfully",
      logo,
    });
  } catch (error: any) {
    console.error("Error setting logo as active:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to set logo as active",
      },
      { status: 500 }
    );
  }
}