import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import HeroSection from '@/lib/database/models/hero-section.model';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

// Authentication check
async function checkAuthentication() {
  let isAuthenticated = false;
  
  try {
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      isAuthenticated = true;
    }
  } catch (error) {
    console.log("NextAuth session check failed:", error);
  }
  
  if (!isAuthenticated) {
    const cookieStore = cookies();
    const adminId = cookieStore.get('adminId')?.value;
    if (adminId) {
      isAuthenticated = true;
    }
  }
  
  if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
    isAuthenticated = true;
  }
  
  return isAuthenticated;
}

// GET - Fetch a single hero section by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const { id } = await params; // Await params before accessing properties
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Hero section ID is required" },
        { status: 400 }
      );
    }

    const section = await HeroSection.findById(id);
    
    if (!section) {
      return NextResponse.json(
        { success: false, message: "Hero section not found" },
        { status: 404 }
      );
    }

    // Convert to plain object to avoid serialization issues
    const sectionData = {
      _id: section._id.toString(),
      title: section.title,
      subtitle: section.subtitle,
      longDescription: section.longDescription,
      isActive: section.isActive,
      order: section.order,
      pattern: section.pattern,
      layoutId: section.layoutId,
      contentAlignment: section.contentAlignment,
      backgroundImage: section.backgroundImage,
      mediaUrl: section.mediaUrl,
      mediaType: section.mediaType,
      titleColor: section.titleColor,
      descriptionColor: section.descriptionColor,
      buttonTextColor: section.buttonTextColor,
      buttonBackgroundColor: section.buttonBackgroundColor,
      buttons: section.buttons || [],
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };

    return NextResponse.json({
      success: true,
      section: sectionData
    });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch hero section" },
      { status: 500 }
    );
  }
}

// PUT - Update a hero section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const { id } = await params; // Await params before accessing properties
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Hero section ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields - only order is truly required now
    if (data.order && data.order < 1) {
      return NextResponse.json(
        { success: false, message: "Order must be at least 1" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      title: data.title,
      subtitle: data.subtitle,
      longDescription: data.longDescription || '',
      isActive: Boolean(data.isActive),
      order: Number(data.order) || 1,
      pattern: data.pattern || 'standard',
      layoutId: data.layoutId || '',
      contentAlignment: data.contentAlignment || 'center',
      backgroundImage: data.backgroundImage || '',
      mediaUrl: data.mediaUrl || '',
      mediaType: data.mediaType || 'image',
      titleColor: data.titleColor || '',
      descriptionColor: data.descriptionColor || '',
      buttonTextColor: data.buttonTextColor || '',
      buttonBackgroundColor: data.buttonBackgroundColor || '',
      buttons: Array.isArray(data.buttons) ? data.buttons : [],
      updatedAt: new Date()
    };

    const updatedSection = await HeroSection.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return NextResponse.json(
        { success: false, message: "Hero section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hero section updated successfully",
      section: JSON.parse(JSON.stringify(updatedSection))
    });
  } catch (error) {
    console.error('Error updating hero section:', error);
    return NextResponse.json(
      { success: false, message: "Failed to update hero section" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a hero section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const { id } = await params; // Await params before accessing properties
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Hero section ID is required" },
        { status: 400 }
      );
    }

    const deletedSection = await HeroSection.findByIdAndDelete(id);
    
    if (!deletedSection) {
      return NextResponse.json(
        { success: false, message: "Hero section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hero section deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting hero section:', error);
    return NextResponse.json(
      { success: false, message: "Failed to delete hero section" },
      { status: 500 }
    );
  }
}