import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import NavbarLink from "@/lib/database/models/navbar.links.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get all navbar links
export async function GET() {
  try {
    await connectToDatabase();
    
    const navbarLinks = await NavbarLink.find().sort({ order: 1 });
    
    return NextResponse.json(navbarLinks, { status: 200 });
  } catch (error) {
    console.error("Error fetching navbar links:", error);
    return NextResponse.json(
      { message: "Error fetching navbar links" },
      { status: 500 }
    );
  }
}

// Create a new navbar link
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const data = await req.json();
    const newNavbarLink = await NavbarLink.create(data);
    
    return NextResponse.json(newNavbarLink, { status: 201 });
  } catch (error) {
    console.error("Error creating navbar link:", error);
    return NextResponse.json(
      { message: "Error creating navbar link" },
      { status: 500 }
    );
  }
}