import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get recommendation statistics
    const totalProducts = await Product.countDocuments();
    
    // Simulate recommendation stats (in a real implementation, you'd track these)
    const stats = {
      totalRecommendations: totalProducts * 4, // Assume 4 recommendations per product on average
      categoryBasedCount: Math.floor(totalProducts * 1.5),
      brandBasedCount: Math.floor(totalProducts * 1.2),
      trendingCount: Math.floor(totalProducts * 1.3),
      averageRecommendationsPerProduct: 4.2,
      topPerformingTypes: [
        { type: 'hybrid', count: Math.floor(totalProducts * 1.8), successRate: 85.3 },
        { type: 'category', count: Math.floor(totalProducts * 1.5), successRate: 78.9 },
        { type: 'trending', count: Math.floor(totalProducts * 1.3), successRate: 72.1 },
        { type: 'brand', count: Math.floor(totalProducts * 1.2), successRate: 69.5 },
        { type: 'similar', count: Math.floor(totalProducts * 0.9), successRate: 65.8 },
      ]
    };

    return NextResponse.json({
      success: true,
      ...stats
    });

  } catch (error: any) {
    console.error("Error fetching recommendation stats:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to fetch recommendation stats"
    }, { status: 500 });
  }
}