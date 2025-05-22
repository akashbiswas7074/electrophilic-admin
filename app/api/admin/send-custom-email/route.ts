
import { NextRequest, NextResponse } from "next/server";
import { sendGenericEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, htmlBody, textBody } = await req.json();

    if (!to || !subject || !htmlBody) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: to, subject, and htmlBody are required." },
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

    const result = await sendGenericEmail(to, subject, htmlBody, textBody);

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in send-custom-email API route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
