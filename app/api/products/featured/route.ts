import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get featured products
    const featuredProducts = await Product.find({ featured: true })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalFeatured = await Product.countDocuments({ featured: true });

    return NextResponse.json({
      success: true,
      products: featuredProducts,
      pagination: {
        total: totalFeatured,
        page,
        limit,
        totalPages: Math.ceil(totalFeatured / limit)
      }
    });
  } catch (error: any) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch featured products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { productId, featured } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    // Update product featured status
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { featured: featured },
      { new: true }
    ).populate('category', 'name slug')
     .populate('subCategory', 'name slug');

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Product ${featured ? 'added to' : 'removed from'} featured`,
      product: updatedProduct
    });
  } catch (error: any) {
    console.error("Error updating featured status:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update featured status" },
      { status: 500 }
    );
  }
}