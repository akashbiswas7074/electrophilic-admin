import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/database/connect";
import CategorySection from '@/lib/database/models/category-section.model';
import { auth } from "@clerk/nextjs";

interface Params {
  params: {
    id: string;
  };
}

// Get a single category section by ID
export async function GET(request: Request, { params }: Params) {
  try {
    await connectToDatabase ();
    
    const section = await CategorySection.findById(params.id)
      .populate('categoryId', 'name')
      .lean();
    
    if (!section) {
      return NextResponse.json(
        { success: false, message: 'Category section not found' },
        { status: 404 }
      );
    }
    
    // Rename for frontend convenience
    return NextResponse.json({
      success: true,
      section: {
        ...section,
        category: section.categoryId,
        categoryId: section.categoryId._id,
      }
    });
  } catch (error) {
    console.error('Error fetching category section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch category section' },
      { status: 500 }
    );
  }
}

// Update a category section
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { userId } = auth();
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDatabase ();
    const data = await request.json();
    
    // Find and update the category section
    const updatedSection = await CategorySection.findByIdAndUpdate(
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
    
    return NextResponse.json({
      success: true,
      message: 'Category section updated successfully',
      section: updatedSection,
    });
  } catch (error) {
    console.error('Error updating category section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update category section' },
      { status: 500 }
    );
  }
}

// Delete a category section
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { userId } = auth();
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDatabase ();
    
    const deletedSection = await CategorySection.findByIdAndDelete(params.id);
    
    if (!deletedSection) {
      return NextResponse.json(
        { success: false, message: 'Category section not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete category section' },
      { status: 500 }
    );
  }
}