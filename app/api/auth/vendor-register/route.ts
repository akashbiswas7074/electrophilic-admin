import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Vendor from '@/lib/database/models/vendor.model';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { name, email, password, description, address, phoneNumber, zipCode } = await req.json();

    // Basic validation
    if (!name || !email || !password || !address || !phoneNumber || !zipCode) {
      return NextResponse.json({ 
        message: 'All fields are required' 
      }, { status: 400 });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return NextResponse.json({ 
        message: 'Vendor with this email already exists' 
      }, { status: 409 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ 
        message: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new vendor (verified: false by default, pending admin approval)
    const newVendor = new Vendor({
      name,
      email,
      password: hashedPassword,
      description,
      address,
      phoneNumber: Number(phoneNumber),
      zipCode: Number(zipCode),
      role: 'vendor',
      verified: false, // Requires admin approval
    });

    await newVendor.save();

    return NextResponse.json({
      success: true,
      message: 'Vendor registration successful! Please wait for admin approval before you can login.',
      vendor: {
        id: newVendor._id.toString(),
        name: newVendor.name,
        email: newVendor.email,
        verified: newVendor.verified,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Vendor registration error:', error);
    return NextResponse.json({ 
      message: 'Registration failed. Please try again.' 
    }, { status: 500 });
  }
}