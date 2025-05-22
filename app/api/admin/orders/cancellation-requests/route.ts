import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import Admin from "@/lib/database/models/admin.model";
import User from "@/lib/database/models/user.model";
import Product from "@/lib/database/models/product.model";
import { cookies } from "next/headers";
import { updateProductOrderStatus } from "@/lib/database/actions/admin/orders/orders.actions";

/**
 * API endpoint to get cancellation requests
 * Query params:
 * - since: Optional ISO date string to filter requests since a specific time
 * - limit: Optional limit on number of requests to return
 */
export async function GET(req: NextRequest) {  
  try {    
    // Verify admin authentication using cookie-based auth
    const cookieStore = await cookies();
    const adminId = cookieStore.get('adminId')?.value;
    
    // If no adminId cookie, unauthorized
    if (!adminId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    // Verify that admin exists in database
    await connectToDatabase();
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Parse query parameters
    const url = new URL(req.url);
    const sinceParam = url.searchParams.get('since');
    const limitParam = url.searchParams.get('limit');
    
    // Build query for finding orders with cancellation requests
    // Use $elemMatch to properly query for subdocuments that match both conditions
    let query: any = {};
    
    // If 'since' parameter is provided, filter by cancelRequestedAt
    if (sinceParam) {
      try {
        const sinceDate = new Date(sinceParam);
        query.products = {
          $elemMatch: {
            cancelRequested: true,
            cancelRequestedAt: { $gte: sinceDate }
          }
        };
      } catch (error) {
        console.error("Invalid since date format:", error);
        // Continue with default query if date parsing fails
        query.products = {
          $elemMatch: {
            cancelRequested: true
          }
        };
      }
    } else {
      // Default query if no since parameter
      query.products = {
        $elemMatch: {
          cancelRequested: true
        }
      };
    }

    // Find orders with cancellation requests
    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ "products.cancelRequestedAt": -1 }) // Sort by newest first
      .limit(limitParam ? parseInt(limitParam) : 50); // Default limit to 50
        // Extract cancellation request info from orders
    const cancellationRequests = [];
    
    for (const order of orders) {      
      // Make sure we're only processing products with cancelRequested flag
      // Also filter out products with a cancelReason starting with "Rejected:"
      const cancelledProducts = order.products.filter((product: any) => {
        return product && 
               product.cancelRequested === true &&
               (!product.cancelReason || !product.cancelReason.startsWith("Rejected:"));
      });
      
      for (const product of cancelledProducts) {
        try {
          cancellationRequests.push({
            _id: product._id.toString(),
            orderId: order._id.toString(),
            orderNumber: order.orderId || order.orderNumber || order._id.toString().substring(0, 8),
            productId: product._id.toString(),
            productName: product.name || "Product",
            reason: product.cancelReason || "No reason provided",
            requestedAt: product.cancelRequestedAt || new Date(),
            status: product.status || "Not Processed",
            user: {
              name: order.user?.name || "Customer",
              email: order.user?.email || "No email provided"
            }
          });
        } catch (err) {
          console.error("Error processing cancellation request for product:", err);
          // Continue with the next product
        }
      }
    }

    return NextResponse.json({
      success: true,
      requests: cancellationRequests
    });

  } catch (error: any) {
    console.error("Error fetching cancellation requests:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to fetch cancellation requests"
    }, { status: 500 });
  }
}

/**
 * API endpoint to update cancellation request status
 * Required body:
 * - orderId: Order ID
 * - productId: Product ID within the order
 * - status: New status (e.g., "Cancelled", "Cancellation Rejected")
 * - message: Optional message for the notification email
 */
export async function PATCH(req: NextRequest) {
  try {
    // Verify admin authentication using cookie-based auth
    const cookieStore = await cookies();
    const adminId = cookieStore.get('adminId')?.value;
    
    // If no adminId cookie, unauthorized
    if (!adminId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    // Verify that admin exists in database
    await connectToDatabase();
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }    // Parse request body
    const body = await req.json();
    const { orderId, productId, status, message } = body;
    
    console.log('PATCH request received with body:', JSON.stringify(body));
    
    // Validate required parameters
    if (!orderId || !productId || !status) {
      return NextResponse.json({
        success: false, 
        message: "Missing required parameters: orderId, productId, and status are required"
      }, { status: 400 });
    }
      // If the cancellation is approved, we need to clear the cancellation fields
    // This means the cancellation request fields should be removed from the database
    if (status === "Cancelled") {
      // First, find the order and update the specific product to clear cancellation fields
      await connectToDatabase();
      const order = await Order.findById(orderId);
      
      if (!order) {
        return NextResponse.json({ 
          success: false, 
          message: "Order not found" 
        }, { status: 404 });
      }
      
      // Find the specific product in the order
      const productIndex = order.products.findIndex(
        (p: any) => p._id.toString() === productId
      );
      
      if (productIndex === -1) {
        return NextResponse.json({ 
          success: false, 
          message: "Product not found in order" 
        }, { status: 404 });
      }      // Clear cancellation request fields
      order.products[productIndex].cancelRequested = false;
      order.products[productIndex].cancelReason = "none";
      order.products[productIndex].cancelRequestedAt = undefined;
        // Also update the corresponding item in orderItems array if it exists
      if (order.orderItems && Array.isArray(order.orderItems)) {
        const orderItemIndex = order.orderItems.findIndex(
          (item: any) => item._id.toString() === productId
        );
        
        if (orderItemIndex !== -1) {
          order.orderItems[orderItemIndex].cancelRequested = false;
          order.orderItems[orderItemIndex].cancelReason = "none";
          order.orderItems[orderItemIndex].cancelRequestedAt = undefined;
          
          // Mark the orderItems array as modified
          order.markModified('orderItems');
        }
      }
      
      // Mark the products array as modified
      order.markModified('products');
      
      // Save the order
      await order.save();
      
      console.log(`Cancellation approved: Cleared cancellation fields for order ${orderId}, product ${productId}. Set cancelRequested=false, cancelReason="none"`);
    }
      // Update product status in the order
    const result = await updateProductOrderStatus(
      orderId,
      productId,
      status,
      undefined, // trackingUrl (not needed for cancellations)
      undefined, // trackingId (not needed for cancellations)
      message || `Your cancellation request has been ${status.toLowerCase()}` // Pass message as customMessage
    );    // Provide a more descriptive response message based on the action taken
    let responseMessage = `Order item ${status.toLowerCase()} successfully`;
    if (status === "Cancelled") {
      responseMessage = "Cancellation request approved. The cancelRequested flag is set to false and cancelReason is set to 'none'";
    } else if (status === "Cancellation Rejected") {
      responseMessage = "Cancellation request rejected";
    }
    
    if (result && result.success) {
      return NextResponse.json({
        success: true,
        message: responseMessage,
        order: result.order
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result?.message || 'Failed to update cancellation status'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error processing cancellation request:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to process cancellation request"
    }, { status: 500 });
  }
}
