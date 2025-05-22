import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Admin from "@/lib/database/models/admin.model";

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Admin ID is required"
      }, { status: 400 });
    }

    await connectToDatabase();
    
    const result = await Admin.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: "Admin not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to delete admin"
    }, { status: 500 });
  }
}
