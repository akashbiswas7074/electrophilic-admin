import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ChangeVerifyTagForVendor, getSingleVendor } from '@/lib/database/actions/admin/vendor.actions';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/database/connect';
import Vendor from '@/lib/database/models/vendor.model';
import { sendVendorStatusEmail } from '@/lib/email';

// Utility function for authentication check
async function checkAuthentication() {
  let isAuthenticated = false;
  
  // Method 1: Check using NextAuth session
  try {
    const session = await getServerSession(authOptions);
    if (session && session.user?.role === 'admin') {
      isAuthenticated = true;
    }
  } catch (error) {
    console.log("NextAuth session check failed:", error);
  }
  
  // Method 2: Check for adminId cookie
  if (!isAuthenticated) {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('adminId')?.value;
    
    if (adminId) {
      isAuthenticated = true;
    }
  }
  
  // In development, we'll allow access even if not authenticated
  if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
    console.log("Authentication bypassed in development mode for vendor status");
    isAuthenticated = true;
  }
  
  return isAuthenticated;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { vendorId, status, message } = await request.json();

    // Validate required fields
    if (!vendorId || typeof status !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Vendor ID and status are required.' },
        { status: 400 }
      );
    }

    // Get vendor details before updating
    const vendorResponse = await getSingleVendor(vendorId);
    
    if (!vendorResponse?.success || !vendorResponse.vendor) {
      return NextResponse.json(
        { success: false, message: 'Vendor not found.' },
        { status: 404 }
      );
    }

    const vendor = vendorResponse.vendor;

    // Update vendor status
    const updateResult = await ChangeVerifyTagForVendor(vendorId, status);
    
    if (updateResult?.success === false) {
      return NextResponse.json(
        { success: false, message: updateResult.message || 'Failed to update vendor status.' },
        { status: 500 }
      );
    }

    // Send email notification to vendor
    try {
      const emailData = {
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        status: status ? 'approved' : 'rejected',
        message: message || undefined,
        loginUrl: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
      };

      await sendVendorStatusEmail(emailData);
      
      console.log(`Vendor status email sent to ${vendor.email}`);
    } catch (emailError) {
      console.error('Error sending vendor status email:', emailError);
      // Continue with success response even if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Vendor ${status ? 'approved' : 'rejected'} successfully and notified via email.`,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        verified: status
      }
    });

  } catch (error) {
    console.error('Error updating vendor status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: 'Vendor ID is required.' },
        { status: 400 }
      );
    }

    // Get vendor details
    const vendorResponse = await getSingleVendor(vendorId);
    
    if (!vendorResponse?.success || !vendorResponse.vendor) {
      return NextResponse.json(
        { success: false, message: 'Vendor not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendorResponse.vendor._id,
        name: vendorResponse.vendor.name,
        email: vendorResponse.vendor.email,
        verified: vendorResponse.vendor.verified,
        phoneNumber: vendorResponse.vendor.phoneNumber,
        zipCode: vendorResponse.vendor.zipCode,
        createdAt: vendorResponse.vendor.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching vendor status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}