import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteLogo from "@/lib/database/models/website.logo.model";

// GET endpoint to fetch all logos
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find all logos with active one first
    const logos = await WebsiteLogo.find().sort({ isActive: -1, updatedAt: -1 });
    
    // Default fallback logo
    const defaultLogo = {
      name: "VIBECart",
      logoUrl: "/images/logo.png",
      altText: "VIBECart Logo",
      isActive: true
    };
    
    return NextResponse.json({ 
      success: true, 
      logos,
      activeLogo: logos.find(logo => logo.isActive) || defaultLogo,
      defaultLogo
    });
    
  } catch (error: any) {
    console.error("Error fetching website logos:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to fetch website logos" 
      },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new logo
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await connectToDatabase();

    // Validate required fields
    if (!data.name || !data.logoUrl || !data.altText) {
      return NextResponse.json(
        { success: false, message: "Name, logoUrl, and altText are required" },
        { status: 400 }
      );
    }

    // Create new logo
    const newLogo = new WebsiteLogo({
      name: data.name,
      logoUrl: data.logoUrl,
      altText: data.altText,
      mobileLogoUrl: data.mobileLogoUrl || "",
      isActive: data.isActive || false,
    });

    await newLogo.save();

    return NextResponse.json({
      success: true,
      message: "Logo created successfully",
      logo: newLogo,
    });
  } catch (error: any) {
    console.error("Error creating website logo:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create website logo",
      },
      { status: 500 }
    );
  }
}