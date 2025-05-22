import { NextResponse } from 'next/server';
import {connectToDatabase }from '@/lib/database/connect';
import CategorySection from '@/lib/database/models/category-section.model';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all category sections ordered by displayOrder
    const sections = await CategorySection.find()
      .populate('categoryId', 'name') // Populate the category with its name
      .sort({ displayOrder: 1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      sections: sections.map(section => ({
        ...section,
        category: section.categoryId, // Rename for frontend convenience
        categoryId: section.categoryId._id, // Keep categoryId as string ID
      })),
    });
  } catch (error) {
    console.error('Error fetching category sections:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch category sections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication using cookies
    const cookieStore = cookies();
    const adminId = cookieStore.get('adminId')?.value;
    
    // Check if user is authenticated
    if (!adminId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    const data = await request.json();
    
    // Create new category section
    const section = await CategorySection.create({
      title: data.title,
      categoryId: data.categoryId,
      displayOrder: data.displayOrder,
      productLimit: data.productLimit,
      isActive: data.isActive
    });
    
    return NextResponse.json({
      success: true,
      message: 'Category section created successfully',
      section
    });
  } catch (error) {
    console.error('Error creating category section:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create category section' },
      { status: 500 }
    );
  }
}