import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/database/connect";
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

// Import the model
import CategorySection from '@/lib/database/models/category-section.model';

interface Params {
  params: {
    id: string;
  };
}

// Utility function for authentication check
async function checkAuthentication() {
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
    console.log("Authentication bypassed in development mode");
    isAuthenticated = true;
  }
  
  return isAuthenticated;
}

// Helper function to connect to database with error handling
async function ensureDatabaseConnection() {
  try {
    await connectToDatabase();
    console.log("Database connection established successfully");
    
    // Check if model is properly initialized
    if (!mongoose.models.CategorySection) {
      throw new Error("CategorySection model is not properly initialized");
    }
    
    return true;
  } catch (error) {
    console.error("Database connection or model error:", error);
    return false;
  }
}

// Get a single category section by ID
export async function GET(request: Request, { params }: Params) {
  try {
    // Connect to database
    const dbConnected = await ensureDatabaseConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { success: false, message: 'Database connection or model initialization failed' },
        { status: 500 }
      );
    }
    
    // Find the category section with explicit error handling
    let section;
    try {
      section = await CategorySection.findById(params.id)
        .populate('categoryId', 'name')
        .lean();
      
      if (!section) {
        return NextResponse.json(
          { success: false, message: 'Category section not found' },
          { status: 404 }
        );
      }
    } catch (queryError) {
      console.error("Error querying CategorySection by ID:", queryError);
      return NextResponse.json(
        { success: false, message: 'Error querying category section: ' + queryError.message },
        { status: 500 }
      );
    }
    
    // Handle case where categoryId might not be populated correctly
    let processedSection;
    if (section.categoryId && typeof section.categoryId === 'object' && section.categoryId._id) {
      processedSection = {
        ...section,
        category: section.categoryId,
        categoryId: section.categoryId._id,
      };
    } else {
      processedSection = {
        ...section,
        category: { _id: section.categoryId, name: 'Unknown Category' },
      };
    }
    
    return NextResponse.json({
      success: true,
      section: JSON.parse(JSON.stringify(processedSection))
    });
  } catch (error) {
    console.error('Error fetching category section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch category section: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// Update a category section
export async function PATCH(request: Request, { params }: Params) {
  try {
    const isAuthenticated = await checkAuthentication();
    
    // For production, require authentication
    if (!isAuthenticated && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to database
    const dbConnected = await ensureDatabaseConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { success: false, message: 'Database connection or model initialization failed' },
        { status: 500 }
      );
    }
    
    const data = await request.json();
    
    // Find and update the category section with explicit error handling
    let updatedSection;
    try {
      updatedSection = await CategorySection.findByIdAndUpdate(
        params.id,
        {
          title: data.title,
          categoryId: data.categoryId,
          displayOrder: data.displayOrder,
          productLimit: data.productLimit,
          isActive: data.isActive,
        },
        { new: true } // Return the updated document
      ).populate('categoryId', 'name');
      
      if (!updatedSection) {
        return NextResponse.json(
          { success: false, message: 'Category section not found' },
          { status: 404 }
        );
      }
    } catch (updateError) {
      console.error("Error updating CategorySection:", updateError);
      return NextResponse.json(
        { success: false, message: 'Error updating category section: ' + updateError.message },
        { status: 500 }
      );
    }
    
    // Handle case where categoryId might not be populated correctly
    let processedSection;
    if (updatedSection.categoryId && typeof updatedSection.categoryId === 'object') {
      processedSection = {
        ...updatedSection.toObject(),
        category: updatedSection.categoryId,
        categoryId: updatedSection.categoryId._id,
      };
    } else {
      processedSection = {
        ...updatedSection.toObject(),
        category: { _id: updatedSection.categoryId, name: 'Unknown Category' },
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category section updated successfully',
      section: JSON.parse(JSON.stringify(processedSection)),
    });
  } catch (error) {
    console.error('Error updating category section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update category section: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// Delete a category section
export async function DELETE(request: Request, { params }: Params) {
  try {
    const isAuthenticated = await checkAuthentication();
    
    // For production, require authentication
    if (!isAuthenticated && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to database
    const dbConnected = await ensureDatabaseConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { success: false, message: 'Database connection or model initialization failed' },
        { status: 500 }
      );
    }
    
    // Delete the category section with explicit error handling
    let deletedSection;
    try {
      deletedSection = await CategorySection.findByIdAndDelete(params.id);
      
      if (!deletedSection) {
        return NextResponse.json(
          { success: false, message: 'Category section not found' },
          { status: 404 }
        );
      }
    } catch (deleteError) {
      console.error("Error deleting CategorySection:", deleteError);
      return NextResponse.json(
        { success: false, message: 'Error deleting category section: ' + deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete category section: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}