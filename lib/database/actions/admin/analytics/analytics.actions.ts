"use server";

import Order from "@/lib/database/models/order.model";
import { generateLast12MonthsData } from "./analytics.generator";
import Product from "@/lib/database/models/product.model";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";

// get users analytics for admin - only admin can access
export const getUseranalytics = async () => {
  try {
    const users = await generateLast12MonthsData(User);
    return { users };
  } catch (error: any) {
    console.log(error);
  }
};
// get Order analytics for admin
export const getOrderAnalytics = async () => {
  try {
    const monthlyOrderData = await generateLast12MonthsData(Order);
    
    // Calculate overall summary metrics from the monthly data
    const totalOrders = monthlyOrderData.reduce((sum, month) => sum + month.count, 0);
    const totalRevenue = monthlyOrderData.reduce((sum, month) => sum + (month.revenue || 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // Assuming products_sold is the sum of quantities from all orders,
    // which is not directly available from generateLast12MonthsData(Order)
    // This would require a separate aggregation or a more detailed Order model if not already present.
    // For now, let's use totalOrders as a proxy if a direct 'products_sold' count isn't in MonthlyAnalyticsData.
    // If 'count' in MonthlyAnalyticsData for Orders represents number of products sold, adjust accordingly.
    // Here, 'count' is number of orders.
    const productsSold = totalOrders; // Placeholder: This might need adjustment based on actual data structure

    return {
      orders: monthlyOrderData, // This is the last12Months data for charts
      revenue: totalRevenue, // This is total revenue over the last 12 months
      products_sold: productsSold, // Placeholder for total products sold
      average_order_value: averageOrderValue,
      total_orders: totalOrders, // Total orders over the last 12 months
      total_revenue: totalRevenue, // Repeated for clarity, same as 'revenue'
    };
  } catch (error: any) {
    console.error('Error fetching order analytics:', error);
    // Return a default structure in case of error to prevent crashes downstream
    return {
      orders: [],
      revenue: 0,
      products_sold: 0,
      average_order_value: 0,
      total_orders: 0,
      total_revenue: 0,
      error: "Failed to fetch order analytics"
    };
  }
};

// get Product analytics for admin
export const getProductAnalytics = async () => {
  try {
    const products = await generateLast12MonthsData(Product);
    return { products };
  } catch (error: any) {
    console.log(error);
  }
};

// get product size analytics for admin
export const sizeAnalytics = async () => {
  try {
    await connectToDatabase();
    const products = await Product.find({}).lean();  // Use lean() for plain JS objects
    if (!products || products.length === 0) {
      return [];
    }

    const individualSizeAnalytics = products.reduce((acc: any, product: any) => {
      product.subProducts?.forEach((subProduct: any) => {
        subProduct.sizes?.forEach((size: any) => {
          if (acc[size.size]) {
            acc[size.size] += size.sold || 0;
          } else {
            acc[size.size] = size.sold || 0;
          }
        });
      });
      return acc;
    }, {});

    const sizeData = Object.entries(individualSizeAnalytics).map(([size, value]) => ({
      name: size,
      value: Number(value)
    }));

    return sizeData;
  } catch (error: any) {
    console.error('Size analytics error:', error);
    return [];
  }
};

// get top selling products for admin
export const getTopSellingProducts = async () => {
  try {
    await connectToDatabase();
    const products = await Product.find({})
      .sort({ "subProducts.sold": -1 })
      .limit(5)
      .lean();

    const pieChartData = products.map((product) => ({
      name: product.name || 'Unknown',
      value: Number(product.subProducts?.[0]?.sold || 0)
    }));

    return pieChartData;
  } catch (error: any) {
    console.error('Top selling products error:', error);
    return [];
  }
};
