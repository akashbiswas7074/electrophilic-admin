import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import Category from '@/lib/database/models/category.model';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

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
    // Remove this in production if strict auth is required
    if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
      console.log("Authentication bypassed in development mode");
      isAuthenticated = true;
    }
    
    // Connect to database regardless of authentication to simplify development workflow
    await connectToDatabase();
    
    // Get all categories sorted by name
    const categories = await Category.find()
      .sort({ name: 1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      categories: JSON.parse(JSON.stringify(categories)),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}