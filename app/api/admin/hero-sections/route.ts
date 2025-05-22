// Simple API endpoint to safely fetch hero sections
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import HeroSection from '@/lib/database/models/hero-section.model';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Note: For fetching hero sections, we'll allow public access for now
    // This allows the website sections dialog to work while we're fixing other issues
    // Later, you can add authentication check back if needed
    
    // Connect to the database
    await connectToDatabase();
    
    // Fetch hero sections with minimal data
    const sections = await HeroSection.find({}, {
      _id: 1,
      title: 1,
      subtitle: 1,
      order: 1,
      isActive: 1
    }).sort({ order: 1 });
    
    // Convert MongoDB documents to plain objects and ensure IDs are strings
    const simplifiedSections = sections.map(section => ({
      _id: section._id.toString(),
      title: section.title || "",
      subtitle: section.subtitle || "",
      order: section.order || 0,
      isActive: section.isActive || false
    }));
    
    return NextResponse.json({
      success: true, 
      sections: simplifiedSections 
    });
  } catch (error) {
    console.error("API Error fetching hero sections:", 
      error instanceof Error ? error.message : "Unknown error");
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to fetch hero sections" 
    }, { status: 500 });
  }
}