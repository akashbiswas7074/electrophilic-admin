import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ 
        message: "Order ID is required", 
        success: false 
      }, { status: 400 });
    }
    
    await connectToDatabase();
    const result = await Order.findByIdAndUpdate(orderId, { isNew: false });
    
    if (!result) {
      return NextResponse.json({ 
        message: "Order not found", 
        success: false 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      message: "Order successfully changed to old order",
      success: true
    });
    
  } catch (error: any) {
    console.error("Error marking order as old:", error);
    return NextResponse.json({ 
      message: error.message || "Failed to update order", 
      success: false 
    }, { status: 500 });
  }
}