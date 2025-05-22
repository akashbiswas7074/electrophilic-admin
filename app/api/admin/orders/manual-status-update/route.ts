import { NextRequest, NextResponse } from 'next/server';
import { manuallyUpdateOrderStatus } from '@/lib/database/actions/admin/orders/orders.actions';
import { connectToDatabase } from '@/lib/database/connect';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { 
      orderId, 
      status, 
      updateAllItems = true,
      trackingUrl, 
      trackingId, 
      customMessage 
    } = body;

    // Validate required fields
    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: orderId or status' },
        { status: 400 }
      );
    }

    // Connect to database 
    await connectToDatabase();

    // Update order status
    const result = await manuallyUpdateOrderStatus(
      orderId, 
      status, 
      updateAllItems
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        order: result.order
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in manual-status-update API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
