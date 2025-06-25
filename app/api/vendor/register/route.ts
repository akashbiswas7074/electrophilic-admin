import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Vendor from "@/lib/database/models/vendor.model";
import bcrypt from "bcryptjs";
import { sendVendorWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, description, address, phoneNumber, zipCode } = await req.json();

    // Validation
    if (!name || !email || !password || !address || !phoneNumber || !zipCode) {
      return NextResponse.json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    await connectToDatabase();

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return NextResponse.json({
        success: false,
        message: "A vendor with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create vendor (unverified by default)
    const vendor = await new Vendor({
      name,
      email,
      password: hashedPassword,
      description,
      address,
      phoneNumber,
      zipCode,
      role: "vendor",
      verified: false, // Admin approval required
    }).save();

    // Send welcome email to vendor
    try {
      await sendVendorWelcomeEmail({
        name: vendor.name,
        email: vendor.email,
        loginUrl: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Vendor account created successfully. You will receive an email confirmation shortly. Please wait for admin approval before logging in.",
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        verified: vendor.verified,
      },
    });
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    return NextResponse.json({
      success: false,
      message: "An error occurred during registration.",
    });
  }
}