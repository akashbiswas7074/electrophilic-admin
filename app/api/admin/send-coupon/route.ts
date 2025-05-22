
import { NextRequest, NextResponse } from "next/server";
import { sendCouponEmail } from "@/lib/email"; // Assuming sendCouponEmail is in this path

export async function POST(req: NextRequest) {
  try {
    const { 
      to, 
      couponCode, 
      userName, 
      message, 
      discountDetails, 
      expiryDate 
    } = await req.json();

    if (!to || !couponCode) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: 'to' (recipient email) and 'couponCode' are required." },
        { status: 400 }
      );
    }

    // Validate email format for 'to' field
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format for recipient." },
        { status: 400 }
      );
    }

    const result = await sendCouponEmail(to, {
      couponCode,
      userName, // Optional
      message, // Optional
      discountDetails, // Optional
      expiryDate, // Optional
      // appUrl can be defaulted in sendCouponEmail or passed if needed
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in send-coupon-email API route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
