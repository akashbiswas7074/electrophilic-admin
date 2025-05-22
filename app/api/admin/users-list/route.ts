
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect"; // Adjust path if necessary
import User from "@/lib/database/models/user.model"; // Adjust path if necessary

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    // Fetch users, selecting only necessary fields for the dropdown
    const users = await User.find({}, "name email _id").sort({ name: 1 }).lean();

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("Error fetching users list:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users list", error: error.message },
      { status: 500 }
    );
  }
}
