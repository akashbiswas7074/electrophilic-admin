import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Admin from "@/lib/database/models/admin.model";

export async function GET() {
  try {
    await connectToDatabase();
    const admins = await Admin.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      admins
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to fetch admins"
    }, { status: 500 });
  }
}
