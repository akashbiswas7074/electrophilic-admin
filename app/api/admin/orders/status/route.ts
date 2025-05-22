import { NextRequest, NextResponse } from 'next/server';
import { updateProductOrderStatus, updateOverallOrderStatus } from '@/lib/database/actions/admin/orders/orders.actions';
import { connectToDatabase } from '@/lib/database/connect';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { orderId, productId, status, customMessage, trackingUrl, trackingId } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: orderId or status' },
        { status: 400 }
      );
    }

    let result;

    // If productId is 'overall', update the overall order status
    if (productId === 'overall') {
      result = await updateOverallOrderStatus(
        orderId,
        status,
        true, // Send email notification
        customMessage
      );
    } else {
      // Otherwise update individual product status
      result = await updateProductOrderStatus(
        orderId,
        productId,
        status,
        trackingUrl,
        trackingId,
        customMessage
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'Status updated successfully',
        order: result.order
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to update status' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in order status update API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}