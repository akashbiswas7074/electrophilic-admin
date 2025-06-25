import { NextRequest, NextResponse } from "next/server";

// In-memory settings store (in production, use database or Redis)
let recommendationSettings = {
  defaultLimit: 8,
  cacheTimeout: 1800,
  enableAnalytics: true,
  minSimilarityScore: 0.3,
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      settings: recommendationSettings
    });
  } catch (error: any) {
    console.error("Error fetching recommendation settings:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to fetch recommendation settings"
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate settings
    const validSettings = {
      defaultLimit: Math.max(1, Math.min(20, parseInt(body.defaultLimit) || 8)),
      cacheTimeout: Math.max(300, Math.min(7200, parseInt(body.cacheTimeout) || 1800)),
      enableAnalytics: Boolean(body.enableAnalytics),
      minSimilarityScore: Math.max(0, Math.min(1, parseFloat(body.minSimilarityScore) || 0.3)),
    };

    recommendationSettings = { ...recommendationSettings, ...validSettings };
    
    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: recommendationSettings
    });

  } catch (error: any) {
    console.error("Error updating recommendation settings:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to update recommendation settings"
    }, { status: 500 });
  }
}