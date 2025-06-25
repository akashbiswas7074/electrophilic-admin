import { connectToDatabase } from "@/lib/database/connect";
import { NextRequest, NextResponse } from "next/server";
import { deleteProductReview } from "@/lib/database/actions/admin/products/products.actions";
import { cookies } from "next/headers";
import Admin from "@/lib/database/models/admin.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    let isAuthenticated = false;
    
    // Method 1: Check using NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.log("NextAuth session check failed:", error);
    }
    
    // Method 2: Check for adminId cookie
    if (!isAuthenticated) {
      const cookieStore = cookies();
      const adminId = cookieStore.get('adminId')?.value;
      
      if (adminId) {
        const admin = await Admin.findById(adminId);
        if (admin) {
          isAuthenticated = true;
        }
      }
    }
    
    // Require authentication in production
    if (!isAuthenticated && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 401 });
    }

    const { reviewId } = await req.json();

    if (!reviewId) {
      return NextResponse.json({ 
        success: false, 
        message: "Review ID is required" 
      }, { status: 400 });
    }

    // Call the server action to delete the review
    const result = await deleteProductReview(reviewId);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        message: result.message || "Failed to delete review" 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully"
    });

  } catch (error: any) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to delete review" 
    }, { status: 500 });
  }
}