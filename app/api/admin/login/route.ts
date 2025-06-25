import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/database/connect";
import Admin from "@/lib/database/models/admin.model";
import { cookies } from 'next/headers';
import { signJwtToken } from "@/lib/auth-helpers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as jose from "jose";
import { encode } from "next-auth/jwt";

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
    
    // Store the admin ID in a cookie
    cookieStore.set({
      name: 'adminId',
      value: admin._id.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
      path: '/'
    });
    
    // Also generate a JWT token for auth verification
    const token = await signJwtToken({ 
      id: admin._id.toString(),
      email: admin.email,
      role: 'admin'
    });
    
    // Set the admin token cookie
    cookieStore.set({
      name: 'adminToken', 
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
      path: '/'
    });

    // Create session token manually without relying on SignJWT
    // This sets regular cookies for auth instead of trying to create NextAuth tokens
    cookieStore.set({
      name: 'next-auth.csrf-token',
      value: `${Math.random().toString(36).substring(2, 15)}%${Math.random().toString(36).substring(2, 15)}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
      path: '/'
    });
    
    // Set a session token that indicates the user is logged in
    cookieStore.set({
      name: 'next-auth.callback-url',
      value: '/admin/dashboard',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
      path: '/'
    });
    
    return NextResponse.json({
      success: true,
      message: "Login successful",
      admin: { id: admin._id, email: admin.email },
      token
    });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
