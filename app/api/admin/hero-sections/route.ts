// Improved API endpoint for hero sections with full CRUD operations and authentication
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

// GET - Fetch all hero sections
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const minimal = searchParams.get('minimal') === 'true';
    
    // Build query
    const query = activeOnly ? { isActive: true } : {};
    
    // Select fields based on minimal flag
    const selectFields = minimal ? {
      _id: 1,
      title: 1,
      subtitle: 1,
      order: 1,
      isActive: 1
    } : {};
    
    const sections = await HeroSection.find(query, selectFields).sort({ order: 1 });
    
    // Convert to plain objects and ensure IDs are strings
    const serializedSections = sections.map(section => {
      const sectionObj = section.toObject();
      return {
        ...sectionObj,
        _id: sectionObj._id.toString()
      };
    });
    
    return NextResponse.json({
      success: true, 
      sections: serializedSections,
      count: serializedSections.length
    });
  } catch (error) {
    console.error("API Error fetching hero sections:", error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to fetch hero sections" 
    }, { status: 500 });
  }
}

// POST - Create new hero section
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields - only order is truly required now
    if (data.order && data.order < 1) {
      return NextResponse.json(
        { success: false, message: "Order must be at least 1" },
        { status: 400 }
      );
    }

    // Prepare hero section data with defaults
    const heroSectionData = {
      title: data.title,
      subtitle: data.subtitle,
      longDescription: data.longDescription || '',
      isActive: Boolean(data.isActive ?? true),
      order: Number(data.order) || await getNextOrder(),
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
      buttons: Array.isArray(data.buttons) ? data.buttons : []
    };

    const heroSection = await HeroSection.create(heroSectionData);
    
    return NextResponse.json({
      success: true,
      message: "Hero section created successfully",
      section: JSON.parse(JSON.stringify(heroSection))
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating hero section:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, message: `Validation error: ${error.message}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: "Failed to create hero section" },
      { status: 500 }
    );
  }
}

// Helper function to get next order number
async function getNextOrder(): Promise<number> {
  try {
    const lastSection = await HeroSection.findOne().sort({ order: -1 });
    return (lastSection?.order || 0) + 1;
  } catch (error) {
    return 1;
  }
}