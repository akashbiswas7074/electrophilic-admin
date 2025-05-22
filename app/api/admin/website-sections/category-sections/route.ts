import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Import the model with a dynamic import to ensure it's loaded after connection
import CategorySection from '@/lib/database/models/category-section.model';

export async function GET() {
  try {
    // Try multiple authentication methods for admin dashboard
    let isAuthenticated = false;
    
    // Method 1: Check using NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.log("NextAuth session check failed:", error);
    }
    
    // Method 2: Check for adminId cookie
    if (!isAuthenticated) {
      const cookieStore = cookies();
      const adminId = cookieStore.get('adminId')?.value;
      
      if (adminId) {
        isAuthenticated = true;
      }
    }
    
    // In development, we'll allow access even if not authenticated
    if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
      console.log("Authentication bypassed in development mode for category sections");
      isAuthenticated = true;
    }
    
    // Connect to the database with explicit error handling
    try {
      await connectToDatabase();
      console.log("Database connection established successfully");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Ensure the CategorySection model is properly initialized
    if (!mongoose.models.CategorySection) {
      console.error("CategorySection model is not properly initialized");
      return NextResponse.json(
        { success: false, message: 'Model initialization failed' },
        { status: 500 }
      );
    }
    
    // Get all category sections ordered by displayOrder with explicit try/catch
    let sections;
    try {
      sections = await CategorySection.find()
        .populate('categoryId', 'name') // Populate the category with its name
        .sort({ displayOrder: 1 })
        .lean();
      
      console.log(`Successfully retrieved ${sections.length} category sections`);
    } catch (queryError) {
      console.error("Error querying CategorySection:", queryError);
      return NextResponse.json(
        { success: false, message: 'Error querying category sections: ' + queryError.message },
        { status: 500 }
      );
    }
    
    // Handle the case where categoryId might not be populated correctly
    const processedSections = sections.map(section => {
      // Check if categoryId is properly populated (is an object with _id)
      const categoryIsPopulated = section.categoryId && 
        typeof section.categoryId === 'object' &&
        section.categoryId._id;
      
      if (categoryIsPopulated) {
        return {
          ...section,
          category: section.categoryId,
          categoryId: section.categoryId._id
        };
      } else {
        // If category isn't properly populated, keep the structure but don't transform
        return {
          ...section,
          category: { _id: section.categoryId, name: 'Unknown Category' }
        };
      }
    });
    
    return NextResponse.json({
      success: true,
      sections: JSON.parse(JSON.stringify(processedSections)),
    });
  } catch (error) {
    console.error('Error fetching category sections:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch category sections: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Try multiple authentication methods for admin dashboard
    let isAuthenticated = false;
    
    // Method 1: Check using NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.log("NextAuth session check failed:", error);
    }
    
    // Method 2: Check for adminId cookie
    if (!isAuthenticated) {
      const cookieStore = cookies();
      const adminId = cookieStore.get('adminId')?.value;
      
      if (adminId) {
        isAuthenticated = true;
      }
    }
    
    // In development, we'll allow access even if not authenticated
    if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
      console.log("Authentication bypassed in development mode for category sections creation");
      isAuthenticated = true;
    }
    
    // For production, require authentication
    if (!isAuthenticated && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to the database with explicit error handling
    try {
      await connectToDatabase();
      console.log("Database connection established successfully");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Ensure the CategorySection model is properly initialized
    if (!mongoose.models.CategorySection) {
      console.error("CategorySection model is not properly initialized");
      return NextResponse.json(
        { success: false, message: 'Model initialization failed' },
        { status: 500 }
      );
    }
    
    const data = await request.json();
    
    // Create new category section with explicit try/catch
    let section;
    try {
      section = await CategorySection.create({
        title: data.title,
        categoryId: data.categoryId,
        displayOrder: data.displayOrder,
        productLimit: data.productLimit,
        isActive: data.isActive
      });
      
      console.log("Category section created successfully:", section._id);
    } catch (createError) {
      console.error("Error creating category section:", createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create category section: ' + createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category section created successfully',
      section: JSON.parse(JSON.stringify(section))
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create category section: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}