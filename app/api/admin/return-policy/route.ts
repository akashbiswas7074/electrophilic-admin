import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import ReturnPolicy from "@/lib/database/models/return-policy.model";
import { getServerSession } from "next-auth";

// GET - Fetch return policy
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');
    
    if (all === 'true') {
      // Fetch all policies for admin management
      const policies = await ReturnPolicy.find({})
        .sort({ updatedAt: -1 })
        .lean();
      
      return NextResponse.json({
        success: true,
        policies: policies
      });
    } else {
      // Fetch active policy
      const policy = await ReturnPolicy.findOne({ isActive: true }).lean();
      
      return NextResponse.json({
        success: true,
        policy: policy
      });
    }
  } catch (error: any) {
    console.error("Error fetching return policy:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to fetch return policy"
    }, { status: 500 });
  }
}

// POST - Create or update return policy
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get session for authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      title,
      subtitle,
      heroIcon,
      sections,
      metaTitle,
      metaDescription,
      customCSS
    } = body;
    
    // Validate required fields
    if (!title) {
      return NextResponse.json({
        success: false,
        message: "Title is required"
      }, { status: 400 });
    }
    
    // Sort sections by order
    const sortedSections = sections.sort((a: any, b: any) => a.order - b.order);
    
    // Find existing active policy or create new one
    let policy = await ReturnPolicy.findOne({ isActive: true });
    
    if (policy) {
      // Update existing policy
      policy.title = title;
      policy.subtitle = subtitle;
      policy.heroIcon = heroIcon;
      policy.sections = sortedSections;
      policy.metaTitle = metaTitle;
      policy.metaDescription = metaDescription;
      policy.customCSS = customCSS;
      policy.lastUpdatedBy = session.user.email || "Admin";
      
      await policy.save();
    } else {
      // Create new policy
      policy = new ReturnPolicy({
        title,
        subtitle,
        heroIcon,
        sections: sortedSections,
        metaTitle,
        metaDescription,
        customCSS,
        lastUpdatedBy: session.user.email || "Admin",
        isActive: true,
      });
      
      await policy.save();
    }
    
    return NextResponse.json({
      success: true,
      message: "Return policy saved successfully",
      policy: policy
    });
  } catch (error: any) {
    console.error("Error saving return policy:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to save return policy"
    }, { status: 500 });
  }
}

// PUT - Activate a specific policy
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get session for authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { policyId } = body;
    
    if (!policyId) {
      return NextResponse.json({
        success: false,
        message: "Policy ID is required"
      }, { status: 400 });
    }
    
    // Deactivate all policies
    await ReturnPolicy.updateMany({}, { isActive: false });
    
    // Activate the specified policy
    const policy = await ReturnPolicy.findByIdAndUpdate(
      policyId,
      { isActive: true },
      { new: true }
    );
    
    if (!policy) {
      return NextResponse.json({
        success: false,
        message: "Policy not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Policy activated successfully",
      policy: policy
    });
  } catch (error: any) {
    console.error("Error activating policy:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to activate policy"
    }, { status: 500 });
  }
}

// DELETE - Delete a policy
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get session for authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('id');
    
    if (!policyId) {
      return NextResponse.json({
        success: false,
        message: "Policy ID is required"
      }, { status: 400 });
    }
    
    const policy = await ReturnPolicy.findById(policyId);
    
    if (!policy) {
      return NextResponse.json({
        success: false,
        message: "Policy not found"
      }, { status: 404 });
    }
    
    // Don't allow deletion of active policy if it's the only one
    if (policy.isActive) {
      const totalPolicies = await ReturnPolicy.countDocuments();
      if (totalPolicies === 1) {
        return NextResponse.json({
          success: false,
          message: "Cannot delete the only active return policy"
        }, { status: 400 });
      }
    }
    
    await ReturnPolicy.findByIdAndDelete(policyId);
    
    return NextResponse.json({
      success: true,
      message: "Policy deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting policy:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to delete policy"
    }, { status: 500 });
  }
}