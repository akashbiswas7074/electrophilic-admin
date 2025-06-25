import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Vendor from "@/lib/database/models/vendor.model";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== 'vendor') {
      return NextResponse.json({ error: "Access denied. Vendor role required." }, { status: 403 });
    }

    await connectToDatabase();

    const vendor = await Vendor.findById(currentUser.id).lean();
    
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      vendor: vendor
    });

  } catch (error: any) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch vendor profile",
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== 'vendor') {
      return NextResponse.json({ error: "Access denied. Vendor role required." }, { status: 403 });
    }

    const body = await req.json();
    
    await connectToDatabase();

    // Update vendor profile
    const updatedVendor = await Vendor.findByIdAndUpdate(
      currentUser.id,
      {
        $set: {
          name: body.name,
          businessName: body.businessName,
          email: body.email,
          phoneNumber: body.phoneNumber,
          address: body.address,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
          country: body.country,
          description: body.description,
          website: body.website,
          taxId: body.taxId,
          bankDetails: body.bankDetails
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      vendor: updatedVendor
    });

  } catch (error: any) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update vendor profile",
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}