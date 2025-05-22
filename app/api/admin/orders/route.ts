import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import Product from "@/lib/database/models/product.model";
import User from "@/lib/database/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'all';
    const isPaid = url.searchParams.get('isPaid') || '-';
    const paymentMethod = url.searchParams.get('paymentMethod') || '-';
    
    await connectToDatabase();
    
    const now = new Date();
    let fromDate: Date;
    const toDate = new Date();
    
    // Calculate date range based on the range parameter
    switch(range) {
      case 'today':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'today_and_yesterday':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case '2d':
        fromDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '15d':
        fromDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '2m':
        fromDate = new Date(new Date().setMonth(new Date().getMonth() - 2));
        break;
      case '5m':
        fromDate = new Date(new Date().setMonth(new Date().getMonth() - 5));
        break;
      case '10m':
        fromDate = new Date(new Date().setMonth(new Date().getMonth() - 10));
        break;
      case '12m':
        fromDate = new Date(new Date().setMonth(new Date().getMonth() - 12));
        break;
      case 'all':
      default:
        fromDate = new Date(0); // Beginning of time
        break;
    }
    
    // Create query object for MongoDB
    const query: any = {
      createdAt: { $gte: fromDate, $lte: toDate },
    };
    
    // Add paid status filter
    if (isPaid === 'paid') {
      query.isPaid = true;
    } else if (isPaid === 'unPaid') {
      query.isPaid = false;
    }
    
    // Add payment method filter
    if (paymentMethod !== '-') {
      query.paymentMethod = paymentMethod;
    }
    
    // Get orders with populated relations - only use fields that exist in schema
    const orders = await Order.find(query)
      .populate({
        path: "user",
        model: User,
        select: "name email image",
      })
      .populate({
        path: "products.product",
        model: Product,
        select: "slug brand sku name images price",
      })
      // Removed the problematic orderItems.product populate that's causing the error
      .sort({ createdAt: -1 })
      .lean();

    // Process orders for compatibility
    const processedOrders = orders.map((order) => {
      const orderObj = JSON.parse(JSON.stringify(order));
      
      // If order has orderItems but no products, create products array
      if (orderObj.orderItems?.length > 0 && (!orderObj.products || orderObj.products.length === 0)) {
        orderObj.products = orderObj.orderItems.map((item: any) => ({
          ...item,
          status: item.status || "Not Processed",
        }));
      }
      // If order has products but no orderItems, create orderItems array
      else if (orderObj.products?.length > 0 && (!orderObj.orderItems || orderObj.orderItems.length === 0)) {
        orderObj.orderItems = orderObj.products;
      }
      
      return orderObj;
    });
    
    console.log(`API: Fetched ${processedOrders.length} orders for range: ${range}`);
    return NextResponse.json(processedOrders);
    
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}