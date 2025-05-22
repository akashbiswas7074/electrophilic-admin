import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email'; // Adjust path if necessary

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email address is required' }, { status: 400 });
    }

    const result = await sendTestEmail(email);

    if (result.success) {
      return NextResponse.json({ message: 'Test email sent successfully to ' + email }, { status: 200 });
    } else {
      console.error('Failed to send test email from API:', result.error);
      return NextResponse.json({ message: result.message || 'Failed to send test email', error: result.error?.toString() }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in test-email API route:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    // Optionally, you can use a GET request with a query parameter for quick testing via browser
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Please provide an email query parameter (e.g., /api/admin/test-email?email=your_email@example.com)' }, { status: 400 });
    }
    
    try {
        const result = await sendTestEmail(email);
        if (result.success) {
          return NextResponse.json({ message: 'Test email sent successfully to ' + email }, { status: 200 });
        } else {
          console.error('Failed to send test email from API (GET):', result.error);
          return NextResponse.json({ message: result.message || 'Failed to send test email', error: result.error?.toString() }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error in test-email API route (GET):', error);
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}
