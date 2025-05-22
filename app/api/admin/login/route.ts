import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/database/connect";
import Admin from "@/lib/database/models/admin.model";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    await connectToDatabase();

    const admin = await Admin.findOne({ email });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Set cookie with proper configuration
    const cookieStore = cookies();
    cookieStore.set({
      name: 'adminId',
      value: admin._id.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
      admin: { id: admin._id, email: admin.email }
    });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
