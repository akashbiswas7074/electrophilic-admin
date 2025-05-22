import { connectToDatabase } from "@/lib/database/connect";
import NavbarLink from "@/lib/database/models/navbar-link.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// GET handler to fetch all navbar links
export async function GET() {
  try {
    // Verify user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Get all navbar links sorted by order
    const navbarLinks = await NavbarLink.find().sort({ order: 1 }).lean();
    
    return NextResponse.json({
      success: true,
      navbarLinks: JSON.parse(JSON.stringify(navbarLinks))
    });
  } catch (error: any) {
    console.error("Error fetching navbar links:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch navbar links" },
      { status: 500 }
    );
  }
}

// POST handler to create a new navbar link
export async function POST(req: Request) {
  try {
    // Verify user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { label, href, order, isActive } = body;
    
    // Validate required fields
    if (!label || !href) {
      return NextResponse.json(
        { success: false, message: "Label and href are required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Create new navbar link
    const newNavbarLink = await NavbarLink.create({
      label,
      href,
      order: order || 0,
      isActive: isActive === undefined ? true : isActive
    });
    
    return NextResponse.json({
      success: true,
      navbarLink: JSON.parse(JSON.stringify(newNavbarLink))
    });
  } catch (error: any) {
    console.error("Error creating navbar link:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create navbar link" },
      { status: 500 }
    );
  }
}

// PUT handler to update an existing navbar link
export async function PUT(req: Request) {
  try {
    // Verify user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { id, updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find and update the navbar link
    const updatedNavbarLink = await NavbarLink.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
    
    if (!updatedNavbarLink) {
      return NextResponse.json(
        { success: false, message: "Navbar link not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      navbarLink: JSON.parse(JSON.stringify(updatedNavbarLink))
    });
  } catch (error: any) {
    console.error("Error updating navbar link:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update navbar link" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a navbar link
export async function DELETE(req: Request) {
  try {
    // Verify user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find and delete the navbar link
    const deletedNavbarLink = await NavbarLink.findByIdAndDelete(id);
    
    if (!deletedNavbarLink) {
      return NextResponse.json(
        { success: false, message: "Navbar link not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Navbar link deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting navbar link:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete navbar link" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/navbar-links
 * Fetches all navbar links for admin dashboard
 */
export async function adminGET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Fetch all navbar links, sorted by order
    const navbarLinks = await NavbarLink.find().sort({ order: 1 }).lean();
    
    return NextResponse.json({
      success: true,
      navbarLinks: JSON.parse(JSON.stringify(navbarLinks))
    });
  } catch (error: any) {
    console.error("Error fetching navbar links:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch navbar links",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/navbar-links
 * Creates a new navbar link
 */
export async function adminPOST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Create a new navbar link
    const newLink = await NavbarLink.create(data);
    
    return NextResponse.json({
      success: true,
      navbarLink: JSON.parse(JSON.stringify(newLink))
    });
  } catch (error: any) {
    console.error("Error creating navbar link:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to create navbar link",
        error: error.message 
      },
      { status: 500 }
    );
  }
}