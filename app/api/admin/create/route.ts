import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/database/connect";
import Admin from "@/lib/database/models/admin.model";

export async function POST(req: Request) {
  try {
    if (!req.body) {
      return NextResponse.json(
        { success: false, message: "No data provided" },
        { status: 400 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check for existing admin
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const newAdmin = await Admin.create({
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Admin created successfully",
        admin: { email: newAdmin.email, id: newAdmin._id }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}
