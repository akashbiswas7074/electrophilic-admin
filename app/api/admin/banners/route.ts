import { connectToDatabase } from "@/lib/database/connect";
import Banner from "@/lib/database/models/banner.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Update banner attributes
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Not authorized"
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { bannerId, updates } = body;
    
    if (!bannerId) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Validate and prepare update object
    const updateData: any = {};
    
    // Handle string fields
    if (updates.linkUrl !== undefined) updateData.linkUrl = updates.linkUrl;
    if (updates.altText !== undefined) updateData.altText = updates.altText;
    
    // Handle date fields - convert strings to Date objects
    if (updates.startDate !== undefined) {
      updateData.startDate = updates.startDate ? new Date(updates.startDate) : null;
    }
    
    if (updates.endDate !== undefined) {
      updateData.endDate = updates.endDate ? new Date(updates.endDate) : null;
    }
    
    // Handle numeric fields
    if (updates.priority !== undefined && !isNaN(Number(updates.priority))) {
      updateData.priority = Number(updates.priority);
    }
    
    // Handle boolean fields
    if (updates.isActive !== undefined) {
      updateData.isActive = Boolean(updates.isActive);
    }

    // Handle platform field if present
    if (updates.platform === "desktop" || updates.platform === "mobile") {
      updateData.platform = updates.platform;
    }

    // Update the banner in the database
    const updatedBanner = await Banner.findOneAndUpdate(
      { public_id: bannerId },
      { $set: updateData },
      { new: true } // Return the updated document
    );

    if (!updatedBanner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Banner updated successfully",
      banner: updatedBanner
    });
  } catch (error: any) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// Get all banners with filtering options
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    const isActive = url.searchParams.get('isActive');

    await connectToDatabase();
    
    // Build query object
    const query: any = { type: "website" };
    
    // Add filters if provided
    if (platform === "desktop" || platform === "mobile") {
      query.platform = platform;
    }
    
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }
    
    // Get banners matching the query
    const banners = await Banner.find(query).sort({ priority: 1, createdAt: -1 }).lean();
    
    return NextResponse.json({
      success: true,
      banners: JSON.parse(JSON.stringify(banners))
    });
  } catch (error: any) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// Delete a banner
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const bannerId = url.searchParams.get('id');
    
    if (!bannerId) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Find the banner first to get its public_id for Cloudinary deletion
    const banner = await Banner.findOne({ public_id: bannerId });
    
    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }
    
    // Delete the banner from MongoDB
    await Banner.deleteOne({ public_id: bannerId });
    
    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}