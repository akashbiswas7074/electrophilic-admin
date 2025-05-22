import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Delete cookie with proper configuration
    cookieStore.delete({
      name: 'adminId',
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error logging out" },
      { status: 500 }
    );
  }
}
