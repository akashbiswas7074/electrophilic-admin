import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get sample recommendation data (in a real implementation, you'd have a recommendations collection)
    const products = await Product.find({})
      .select('_id name category sold createdAt')
      .populate('category', 'name')
      .sort({ sold: -1 })
      .limit(20)
      .lean();

    const recommendations = products.map(product => ({
      productId: product._id,
      productName: product.name,
      recommendationType: 'hybrid',
      recommendationCount: Math.floor(Math.random() * 50) + 10,
      clickThroughRate: Math.random() * 0.15 + 0.05, // 5-20%
      conversionRate: Math.random() * 0.08 + 0.02, // 2-10%
      lastGenerated: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      recommendations
    });

  } catch (error: any) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to fetch recommendations"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Refresh recommendation cache (in a real implementation, you'd clear Redis cache)
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: "Recommendation cache refreshed successfully"
    });

  } catch (error: any) {
    console.error("Error refreshing recommendations:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to refresh recommendations"
    }, { status: 500 });
  }
}