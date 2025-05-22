"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import Product from "@/lib/database/models/product.model";
import User from "@/lib/database/models/user.model";

// get dashboard data for admin

export const getDashboardData = async () => {
  try {
    await connectToDatabase();

    const orders = await Order.find({})
      .populate({ path: "user", model: User })
      .populate({
        path: "orderItems.product", // Assuming 'product' is the ref field in each orderItem
        model: Product,
        select: "name sku brand images slug price", // Fields needed for admin order items view
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const products = await Product.find().lean();
    return {
      orders: JSON.parse(JSON.stringify(orders)),
      products: JSON.parse(JSON.stringify(products)),
    };
  } catch (error: any) {
    console.log(error);
  }
};

// PRODUCTS:
// fetch low stock products for admin
export const getLowStockProducts = async () => {
  try {
    await connectToDatabase();

    const lowStockProducts = await Product.find(
      {
        "subProducts.sizes.qty": { $lte: 5 },
      },
      {
        name: 1,
        "subProducts.sizes.qty": 1,
        "subProducts.size.size": 1,
        "subProducts._id": 1,
      }
    );
    return {
      lowStockProducts: JSON.parse(JSON.stringify(lowStockProducts)),
    };
  } catch (error: any) {
    console.log(error);
  }
};

// fetch out of stock products for admin
export const getOutOfStockProducts = async () => {
  try {
    await connectToDatabase();

    const outOfStockProducts = await Product.find(
      {
        "subProducts.sizes.qty": { $eq: 0 },
      },
      {
        name: 1,
        "subProducts.sizes.qty": 1,
        "subProducts.size.size": 1,
        "subProducts._id": 1,
      }
    );
    return {
      outOfStockProducts: JSON.parse(JSON.stringify(outOfStockProducts)),
    };
  } catch (error: any) {
    console.log(error);
  }
};

// ORDERS:
// calculate today orders, total orders, last week orders, and finally last month orders
export const calculateTotalOrders = async () => {
  try {
    const getDayRange = (date: any) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    };
    await connectToDatabase();

    const orders = await Order.find({});
    const now = new Date();
    const { start: startOfDay, end: endOfDay } = getDayRange(now);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let totalSales = 0;
    let todaySales = 0;
    let lastWeekSales = 0;
    let lastMonthSales = 0;
    orders.forEach((order) => {
      totalSales = totalSales + order.total;
      if (order.createdAt >= startOfDay && order.createdAt <= endOfDay) {
        todaySales = todaySales + order.total;
      }
      if (order.createdAt >= startOfWeek) {
        lastWeekSales = lastWeekSales + order.total;
      }
      if (order.createdAt >= startOfMonth) {
        lastMonthSales = lastMonthSales + order.total;
      }
    });
    const growthPercentage = (todaySales / (totalSales - todaySales)) * 100;
    return {
      todaySales,
      totalSales,
      lastMonthSales,
      lastWeekSales,
      growthPercentage: growthPercentage.toFixed(2),
    };
  } catch (error: any) {
    console.log(error);
  }
};

// calculates new orders, pending orders, completed orders, canceled orders
export const orderSummary = async () => {
  try {
    await connectToDatabase();

    // count new order documents
    const newOrders = await Order.countDocuments({
      isNew: true,
    });
    const pendingOrders = await Order.countDocuments({
      "products.status": "Not Processed",
    });
    const completedOrders = await Order.countDocuments({
      "products.status": "Completed",
    });
    const cancelledOrders = await Order.countDocuments({
      "products.status": "Cancelled",
    });
    return {
      newOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    };
  } catch (error: any) {
    console.log(error);
  }
};
