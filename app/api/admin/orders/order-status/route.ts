import { NextResponse } from "next/server";
import {connectToDatabase} from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Order ID and status are required" 
        }, 
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Order not found" 
        }, 
        { status: 404 }
      );
    }    // Update all products' statuses in this order (products array)
    if (order.products && Array.isArray(order.products)) {
      order.products = order.products.map((product: any) => {
        return {
          ...product,
          status
        };
      });
    }
    
    // Update all orderItems' statuses (orderItems array)
    if (order.orderItems && Array.isArray(order.orderItems)) {
      order.orderItems = order.orderItems.map((item: any) => {
        return {
          ...item,
          status
        };
      });
    }

    // Set both status fields on the order
    order.orderStatus = status; // Dedicated order status field
    order.status = status;      // Main status field
    
    // Update timestamps
    order.updatedAt = new Date();
    
    // Save the order
    await order.save();

    // Revalidate paths to update pages that display this data
    revalidatePath('/admin/dashboard/orders');
    revalidatePath(`/order/${orderId}`);
    
    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status} successfully`,
      order
    });

  } catch (error: any) {
    console.error("Error updating order status:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update order status"
      },
      { status: 500 }
    );
  }
}
