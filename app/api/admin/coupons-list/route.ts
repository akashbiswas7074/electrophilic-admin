import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect"; // Adjust path
import Coupon from "@/lib/database/models/coupon.model"; // Adjust path

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    // Fetch coupons, selecting fields that exist in the model
    const couponsFromDB = await Coupon.find(
      {
        // Optionally, filter out expired coupons if needed, e.g., by checking endDate
        // endDate: { $gte: new Date().toISOString().split('T')[0] } // Example: only if endDate is today or later
      },
      "coupon discount _id endDate" // Fetch existing fields
    )
    .sort({ coupon: 1 }) // Sort by coupon code (original field name)
    .lean();

    // Map to the structure expected by the frontend if necessary
    const coupons = couponsFromDB.map(c => ({
      _id: c._id,
      code: c.coupon, // Map `coupon` field to `code`
      discountValue: c.discount, // Map `discount` field to `discountValue`
      // The UI uses coupon.description || coupon.discountValue. 
      // Since description doesn't exist, it will use discountValue.
      // We can explicitly provide it or let the UI handle it.
      description: `Discount: ${c.discount}`, // Or provide a default description
      endDate: c.endDate
    }));

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error("Error fetching coupons list:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch coupons list", error: error.message },
      { status: 500 }
    );
  }
}
