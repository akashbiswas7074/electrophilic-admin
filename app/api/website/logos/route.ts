import { NextRequest, NextResponse } from 'next/server';
import { getAllWebsiteLogos } from '@/lib/database/actions/website.logo.actions';

export async function GET(req: NextRequest) {
  try {
    const result = await getAllWebsiteLogos();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching logos:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch logos',
    }, { status: 500 });
  }
}