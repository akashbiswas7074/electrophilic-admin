import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import Product from "@/lib/database/models/product.model";
import User from "@/lib/database/models/user.model";
import { getCurrentUser } from "@/lib/auth";

interface RecentOrder {
  _id: string;
  orderId: string;
  user: any;
  total: number;
  status: string;
  createdAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    // Get current user session
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a vendor
    if (currentUser.role !== 'vendor') {
      return NextResponse.json({ error: "Access denied. Vendor role required." }, { status: 403 });
    }

    await connectToDatabase();

    const vendorId = currentUser.id;

    // Fetch vendor's products
    const vendorProducts = await Product.find({
      $or: [
        { vendorId: vendorId },
        { vendor: vendorId }
      ]
    }).lean();

    const productIds = vendorProducts.map(product => product._id?.toString()).filter((id): id is string => Boolean(id));

    // Fetch vendor's orders (orders containing vendor's products)
    const vendorOrders = await Order.find({
      $or: [
        { "products.product": { $in: productIds } },
        { "orderItems.product": { $in: productIds } },
        { "products.vendorId": vendorId },
        { "orderItems.vendorId": vendorId }
      ]
    })
    .populate('user', 'name email')
    .populate('products.product', 'name images price')
    .populate('orderItems.product', 'name images price')
    .sort({ createdAt: -1 })
    .lean();

    // Calculate metrics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total sales calculation
    let totalSales = 0;
    let thisMonthSales = 0;
    let lastMonthSales = 0;
    let productsSold = 0;
    let ordersCompleted = 0;
    const pendingOrders: any[] = [];
    const recentOrders: RecentOrder[] = [];

    vendorOrders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      let orderTotal = 0;
      let hasVendorProduct = false;
      
      // Check products array
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach((item: any) => {
          if (productIds.some((pid: string) => pid === item.product?._id?.toString()) || 
              item.vendorId?.toString() === vendorId) {
            hasVendorProduct = true;
            orderTotal += (item.qty || 1) * (item.price || 0);
            productsSold += (item.qty || 1);
          }
        });
      }
      
      // Check orderItems array
      if (order.orderItems && Array.isArray(order.orderItems)) {
        order.orderItems.forEach((item: any) => {
          if (productIds.some((pid: string) => pid === item.product?._id?.toString()) || 
              item.vendorId?.toString() === vendorId) {
            hasVendorProduct = true;
            orderTotal += (item.qty || item.quantity || 1) * (item.price || 0);
            productsSold += (item.qty || item.quantity || 1);
          }
        });
      }

      if (hasVendorProduct) {
        totalSales += orderTotal;
        
        if (orderDate >= startOfMonth) {
          thisMonthSales += orderTotal;
        }
        
        if (orderDate >= lastMonth && orderDate <= endOfLastMonth) {
          lastMonthSales += orderTotal;
        }

        // Check order status
        const orderStatus = order.status || 'pending';
        if (['delivered', 'completed'].includes(orderStatus.toLowerCase())) {
          ordersCompleted++;
        }
        
        if (['pending', 'confirmed', 'processing'].includes(orderStatus.toLowerCase())) {
          pendingOrders.push(order);
        }

        // Add to recent orders (last 10)
        if (recentOrders.length < 10) {
          recentOrders.push({
            _id: order._id?.toString() || '',
            orderId: order.orderId || order._id?.toString()?.slice(-8) || '',
            user: order.user,
            total: orderTotal,
            status: order.status,
            createdAt: order.createdAt
          });
        }
      }
    });

    // Calculate growth percentage
    const salesGrowthNum = lastMonthSales > 0 
      ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100)
      : thisMonthSales > 0 ? 100 : 0;

    // Active products count
    const activeProducts = vendorProducts.filter((product: any) => 
      product.subProducts?.some((subProduct: any) => 
        subProduct.sizes?.some((size: any) => size.qty > 0)
      ) || product.stock > 0
    ).length;

    // Calculate average rating
    let totalRating = 0;
    let totalReviews = 0;
    vendorProducts.forEach((product: any) => {
      if (product.rating && product.numReviews) {
        totalRating += product.rating * product.numReviews;
        totalReviews += product.numReviews;
      }
    });
    const averageRatingNum = totalReviews > 0 ? (totalRating / totalReviews) : 0;

    // Customer satisfaction (mock calculation based on completed orders vs total orders)
    const customerSatisfaction = vendorOrders.length > 0 
      ? Math.round((ordersCompleted / vendorOrders.length) * 100)
      : 0;

    const dashboardData = {
      totalSales: Math.round(totalSales),
      salesGrowth: Number(salesGrowthNum.toFixed(1)),
      activeProducts,
      totalProducts: vendorProducts.length,
      pendingOrders: pendingOrders.length,
      averageRating: Number(averageRatingNum.toFixed(1)),
      totalReviews,
      thisMonthSales: Math.round(thisMonthSales),
      productsSold,
      ordersCompleted,
      customerSatisfaction,
      recentOrders: recentOrders.slice(0, 5)
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error: any) {
    console.error('Error fetching vendor dashboard data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch dashboard data",
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}