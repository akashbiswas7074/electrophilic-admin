import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  // IMPORTANT: Change this to an email address you can access to check for the test email.
  const testEmailRecipient = 'your-test-email@example.com'; 

  try {
    console.log(`Attempting to send test email to: ${testEmailRecipient}`);
    const result = await sendTestEmail(testEmailRecipient);

    if (result.success) {
      console.log('Test email API: Successfully sent test email.');
      return NextResponse.json({ message: result.message || 'Test email sent successfully!' }, { status: 200 });
    } else {
      console.error('Test email API: Failed to send test email.', result.error);
      // Ensure the error being stringified is an actual Error object or has a message property
      const errorMessage = result.error instanceof Error ? result.error.message : String(result.error);
      return NextResponse.json({ message: result.message || 'Failed to send test email.', error: errorMessage }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Test email API: Unexpected error caught.', error);
    return NextResponse.json({ message: 'Failed to send test email due to an unexpected server error.', error: error.message }, { status: 500 });
  }
}
