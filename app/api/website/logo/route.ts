import { NextRequest, NextResponse } from 'next/server';
import { getActiveWebsiteLogo } from '@/lib/database/actions/website.logo.actions';

export async function GET(req: NextRequest) {
  try {
    const result = await getActiveWebsiteLogo();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching active logo:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch active logo',
    }, { status: 500 });
  }
}