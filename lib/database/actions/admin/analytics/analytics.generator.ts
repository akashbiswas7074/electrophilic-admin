"use server";
import { Model, Document } from "mongoose";
import { connectToDatabase } from "@/lib/database/connect";

interface AggregationResult {
  _id: {
    year: number;
    month: number; // 1-12 (from MongoDB $month)
  };
  count: number;
  totalRevenue?: number; // Specific to Order model
}

export interface MonthlyAnalyticsData {
  month: string; // e.g., "Jan", "Feb"
  year: number;
  count: number; // Generic count for User/Product, or 'orders' for Order model
  revenue?: number; // Specific to Order model
}

export async function generateLast12MonthsData<T extends Document>(
  model: Model<T>
): Promise<MonthlyAnalyticsData[]> {
  await connectToDatabase();
  const analyticsData: MonthlyAnalyticsData[] = [];
  const currentDate = new Date();

  // Determine the start date for aggregation: 12 months ago from the current month, at the beginning of that month.
  // For example, if today is May 16, 2025, it will start from June 1, 2024.
  const startDateAgg = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 11,
    1
  );
  startDateAgg.setHours(0, 0, 0, 0); // Set to the beginning of the day

  const aggregationPipeline: any[] = [
    {
      $match: {
        createdAt: {
          $gte: startDateAgg, // From the start of the 12th month ago
          $lte: currentDate,  // Up to the current date and time
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }, // MongoDB $month returns 1-12
        },
        count: { $sum: 1 },
        // Conditionally add revenue sum if the model is 'Order'
        ...(model.modelName === "Order" ? { totalRevenue: { $sum: "$total" } } : {}),
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }, // Sort chronologically
    },
  ];

  const results: AggregationResult[] = await model.aggregate(aggregationPipeline);
  
  // Create a map for quick lookup of results by "year-month"
  const resultsMap = new Map<string, AggregationResult>();
  results.forEach(res => {
    resultsMap.set(`${res._id.year}-${res._id.month}`, res);
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Populate the analyticsData array for the last 12 months, ensuring all months are present
  for (let i = 0; i < 12; i++) {
    // Iterate from 11 months ago up to the current month to ensure chronological order
    const targetMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - i), 1);
    const year = targetMonthDate.getFullYear();
    const monthIndex = targetMonthDate.getMonth(); // 0-11 for JavaScript Date
    const monthKey = `${year}-${monthIndex + 1}`; // Key for resultsMap (1-12 for month)

    const result = resultsMap.get(monthKey);

    if (result) {
      analyticsData.push({
        month: monthNames[monthIndex],
        year: year,
        count: result.count,
        ...(model.modelName === "Order" && { revenue: result.totalRevenue || 0 }),
      });
    } else {
      // If no data for this month, push a zero-filled entry
      analyticsData.push({
        month: monthNames[monthIndex],
        year: year,
        count: 0,
        ...(model.modelName === "Order" && { revenue: 0 }),
      });
    }
  }
  return analyticsData;
}
