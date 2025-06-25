"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import Product from "@/lib/database/models/product.model";
import User from "@/lib/database/models/user.model";
import Review from "@/lib/database/models/review.model";

// Get vendor-specific dashboard data
export const getVendorDashboardData = async (vendorId: string) => {
  try {
    await connectToDatabase();
    
    // Find products by this vendor
    const vendorProducts = await Product.find({ vendor: vendorId }).lean();
    const productIds = vendorProducts.map(product => product._id);
    
    // Get vendor orders based on product IDs
    const orders = await Order.find({
      "orderItems.product": { $in: productIds }
    })
    .populate({ path: "user", model: User })
    .populate({
      path: "orderItems.product",
      model: Product,
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Format the orders for the dashboard
    const formattedOrders = orders.map((order) => {
      const customerName = order.user?.name || "Guest User";
      
      // Calculate total for products from this vendor only
      const total = order.orderItems.reduce((sum, item) => {
        // Only count if this item's product belongs to this vendor
        if (item.product && item.product.vendor && item.product.vendor.toString() === vendorId) {
          return sum + (item.price * item.quantity);
        }
        return sum;
      }, 0);

      return {
        id: order._id.toString(),
        customerName,
        total,
        status: order.status,
        date: order.createdAt.toISOString(),
      };
    });
    
    // Get reviews for vendor products
    const reviews = await Review.find({
      product: { $in: productIds }
    }).lean();

    return {
      products: vendorProducts,
      orders: formattedOrders,
      reviews
    };
  } catch (error) {
    console.error("Error fetching vendor dashboard data:", error);
    throw new Error("Failed to fetch vendor dashboard data");
  }
};

// Calculate order-related statistics for a vendor
export const calculateVendorOrderStats = async (vendorId: string) => {
  try {
    await connectToDatabase();
    
    // Find products by this vendor
    const vendorProducts = await Product.find({ vendor: vendorId }).lean();
    const productIds = vendorProducts.map(product => product._id);
    
    // Get all orders containing this vendor's products
    const allOrders = await Order.find({
      "orderItems.product": { $in: productIds }
    }).lean();

    // Get reviews for vendor products
    const reviews = await Review.find({
      product: { $in: productIds }
    }).lean();

    // Calculate dates for time-based metrics
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Calculate total sales (from all time)
    let totalSales = 0;
    let todaySales = 0;
    let lastWeekSales = 0;
    let thisMonthSales = 0;
    let lastMonthSales = 0;
    let productsSold = 0;
    let ordersCompleted = 0;
    let pendingOrders = 0;

    // Process each order
    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      let orderTotal = 0;
      let orderProductCount = 0;

      // Only count items from this vendor
      order.orderItems.forEach(item => {
        if (item.product && productIds.includes(item.product.toString())) {
          orderTotal += (item.price * item.quantity);
          orderProductCount += item.quantity;
        }
      });

      // Add to total sales
      totalSales += orderTotal;
      
      // Add to time-based metrics
      if (orderDate >= startOfToday) {
        todaySales += orderTotal;
      }
      
      if (orderDate >= lastWeekStart) {
        lastWeekSales += orderTotal;
      }
      
      if (orderDate >= startOfThisMonth) {
        thisMonthSales += orderTotal;
      }
      
      if (orderDate >= startOfLastMonth && orderDate <= endOfLastMonth) {
        lastMonthSales += orderTotal;
      }
      
      // Count products sold
      productsSold += orderProductCount;
      
      // Count orders by status
      if (order.status === 'completed') {
        ordersCompleted++;
      } else if (order.status === 'pending') {
        pendingOrders++;
      }
    });

    // Calculate average rating and total reviews
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRatings / reviews.length) : 0;
    const totalReviews = reviews.length;

    // Calculate customer satisfaction (percentage of 4+ star reviews)
    const highRatings = reviews.filter(review => review.rating >= 4).length;
    const customerSatisfaction = reviews.length > 0 ? (highRatings / reviews.length) * 100 : 0;

    // Calculate sales growth (this month vs last month)
    const salesGrowth = lastMonthSales > 0 
      ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100 
      : (thisMonthSales > 0 ? 100 : 0);

    return {
      totalSales,
      todaySales,
      lastWeekSales,
      thisMonthSales,
      lastMonthSales,
      productsSold,
      ordersCompleted,
      pendingOrders,
      averageRating,
      totalReviews,
      customerSatisfaction,
      salesGrowth
    };
  } catch (error) {
    console.error("Error calculating vendor order stats:", error);
    throw new Error("Failed to calculate vendor order statistics");
  }
};

// Get product-related statistics for a vendor
export const getVendorProductStats = async (vendorId: string) => {
  try {
    await connectToDatabase();
    
    // Find all products by this vendor
    const vendorProducts = await Product.find({ vendor: vendorId }).lean();
    
    // Calculate total products
    const totalProducts = vendorProducts.length;
    
    // Calculate active products (not out of stock)
    const activeProducts = vendorProducts.filter(product => product.stock > 0).length;
    
    // Get most popular products (could be based on sales, views, etc.)
    const popularProducts = vendorProducts
      .sort((a, b) => (b.purchases || 0) - (a.purchases || 0))
      .slice(0, 5);
    
    return {
      totalProducts,
      activeProducts,
      popularProducts
    };
  } catch (error) {
    console.error("Error fetching vendor product stats:", error);
    throw new Error("Failed to fetch vendor product statistics");
  }
};