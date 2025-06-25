import nodemailer from 'nodemailer';

// Helper function to get company name from environment variables
const getCompanyName = () => process.env.COMPANY_NAME || 'VibeCart';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
  secure: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10) === 465, // true for 465, false for other ports (like 587)
  auth: {
    user: process.env.EMAIL_SERVER_USER, // Using EMAIL_SERVER_USER
    pass: process.env.EMAIL_SERVER_PASSWORD, // Using EMAIL_SERVER_PASSWORD
  },
});

// Email template for order status updates
const getOrderStatusUpdateEmailContent = (data: {
  orderId: string;
  userName: string;
  productName: string;
  status: string;
  statusUpdateMessage: string;
}) => {
  const companyName = getCompanyName();
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #333;">Order Status Update</h1>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p>Hello ${data.userName},</p>
        <p>${data.statusUpdateMessage}</p>
        <p>Order ID: <strong>${data.orderId}</strong></p>
        <p>Product: <strong>${data.productName}</strong></p>
        <p>New Status: <strong>${data.status}</strong></p>
      </div>
      
      <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin: 0;">If you have any questions about your order, please contact our customer service team.</p>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated email, please do not reply directly to this message.</p>
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </div>
  `;
};

// Send an email when order status changes
export async function sendOrderStatusUpdateEmail(
  recipientEmail: string,
  orderData: {
    orderId: string;
    userName: string;
    productName: string;
    status: string;
    statusUpdateMessage: string;
  }
) {
  try {
    const companyName = getCompanyName();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER, // Updated from address
      to: recipientEmail,
      subject: `Order Status Update: ${orderData.status} - ${companyName}`,
      html: getOrderStatusUpdateEmailContent(orderData),
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return { success: false, error };
  }
}

// Function to send a test email (useful for verifying email configuration)
export async function sendTestEmail(recipientEmail: string) {
  try {
    const companyName = getCompanyName();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER, // Updated from address
      to: recipientEmail,
      subject: `Test Email from ${companyName} Admin`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1>Test Email</h1>
          <p>This is a test email from ${companyName} Admin panel.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error, message: 'Failed to send test email' };
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions) {
  try {
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com';
    await transporter.sendMail({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log('Email sent successfully to:', options.to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

interface OrderItemDetail {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailDetails {
  id: string;
  userName?: string;
  items: OrderItemDetail[];
  totalAmount: number;
  customMessage?: string;
  trackingUrl?: string;
  trackingId?: string;
}

export async function sendOrderConfirmationEmail(to: string, orderDetails: OrderConfirmationEmailDetails) {
  const companyName = getCompanyName();
  const subject = `Your ${companyName} Order Confirmation (#${orderDetails.id})`;
  let html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Order Confirmed!</h2>
      <p>Hi ${orderDetails.userName || 'Customer'},</p>
      <p>Thank you for your order #${orderDetails.id}. We're getting your order ready to be shipped. We will notify you when it has been sent.</p>`;

  // Add custom message if provided
  if (orderDetails.customMessage) {
    html += `<p style="font-style: italic; background-color: #f0f0f0; padding: 10px; border-radius: 5px;"><strong>A message from our team:</strong> ${orderDetails.customMessage}</p>`;
  }

  html += `
      <h3>Order Summary:</h3>
      <ul>
        ${orderDetails.items.map((item: any) => `<li>${item.name} (Qty: ${item.quantity}) - $${item.price}</li>`).join('')}
      </ul>
      <p><strong>Total: $${orderDetails.totalAmount}</strong></p>`;

  // Add tracking information if provided
  if (orderDetails.trackingUrl && orderDetails.trackingId) {
    html += `
      <h3>Track Your Shipment:</h3>
      <p>Tracking ID: <strong>${orderDetails.trackingId}</strong></p>
      <p>Track your package here: <a href="${orderDetails.trackingUrl}" target="_blank">${orderDetails.trackingUrl}</a></p>`;
  } else if (orderDetails.trackingUrl) {
    html += `
      <h3>Track Your Shipment:</h3>
      <p>Track your package here: <a href="${orderDetails.trackingUrl}" target="_blank">${orderDetails.trackingUrl}</a></p>`;
  }


  html += `
      <p>You can view your order details here: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order/${orderDetails.id}">View Order</a></p>
      
      <hr/>
      <p>Thanks for shopping with ${companyName}!</p>
    </div>
  `;
  await sendEmail({ to, subject, html });
}

export async function sendGenericEmail(to: string, subject: string, htmlBody: string, textBody?: string) {
  try {
    await sendEmail({
      to,
      subject,
      html: htmlBody,
      text: textBody,
    });
    console.log(`Generic email sent successfully to: ${to} with subject: ${subject}`);
    return { success: true, message: "Email sent successfully." };
  } catch (error: any) {
    console.error(`Error sending generic email to ${to}:`, error);
    return { success: false, message: error.message || "Failed to send email." };
  }
}

interface CouponEmailData {
  userName?: string; // Optional: Name of the user
  couponCode: string;
  message?: string; // Optional: Custom message from admin
  discountDetails?: string; // Optional: e.g., "10% off your next order"
  expiryDate?: string; // Optional: e.g., "Valid until December 31, 2025"
  appUrl?: string;
}

export async function sendCouponEmail(to: string, data: CouponEmailData) {
  const { 
    userName = "Valued Customer", 
    couponCode, 
    message = "Here\'s a special coupon for you!", 
    discountDetails = "Enjoy your discount!",
    expiryDate,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  } = data;
  
  const companyName = getCompanyName();
  const subject = `🎁 A Special Coupon For You From ${companyName}!`;
  
  let htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #333;">You\'ve Received a Coupon!</h1>
      </div>
      <p>Hi ${userName},</p>
      <p>${message}</p>
      <p>Use the coupon code below to get a discount on your next purchase at ${companyName}:</p>
      <div style="text-align: center; margin: 25px 0;">
        <strong style="font-size: 24px; color: #ffffff; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">${couponCode}</strong>
      </div>
      <p>${discountDetails}</p>
  `;

  if (expiryDate) {
    htmlBody += `<p><em>This coupon is valid until: ${expiryDate}</em></p>`;
  }

  htmlBody += `
      <p>Visit our store to redeem your coupon: <a href="${appUrl}" style="color: #007bff;">Shop Now at ${companyName}</a></p>
      <p>Thanks,<br>The ${companyName} Team</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to,
      subject,
      html: htmlBody,
    });
    console.log(`Coupon email sent successfully to: ${to} with code: ${couponCode}`);
    return { success: true, message: "Coupon email sent successfully." };
  } catch (error: any) {
    console.error(`Error sending coupon email to ${to}:`, error);
    return { success: false, message: error.message || "Failed to send coupon email." };
  }
}

interface VendorStatusEmailData {
  vendorName: string;
  vendorEmail: string;
  status: 'approved' | 'rejected';
  message?: string;
  loginUrl?: string;
}

export async function sendVendorStatusEmail(data: VendorStatusEmailData) {
  const { vendorName, vendorEmail, status, message, loginUrl } = data;
  const companyName = getCompanyName();
  
  const isApproved = status === 'approved';
  const subject = `${companyName} Vendor Application ${isApproved ? 'Approved' : 'Rejected'}`;
  
  let htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: ${isApproved ? '#28a745' : '#dc3545'};">
          ${isApproved ? '🎉 Congratulations!' : '❌ Application Update'}
        </h1>
      </div>
      
      <p>Dear ${vendorName},</p>
      
      ${isApproved ? `
        <p>We're excited to inform you that your vendor application with ${companyName} has been <strong style="color: #28a745;">APPROVED</strong>!</p>
        <p>You can now access your vendor dashboard and start managing your products and orders.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${loginUrl || process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/vendor/signin" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Access Vendor Dashboard
          </a>
        </div>
        
        <h3>Next Steps:</h3>
        <ul>
          <li>Login to your vendor dashboard</li>
          <li>Complete your vendor profile</li>
          <li>Add your first products</li>
          <li>Start receiving orders</li>
        </ul>
      ` : `
        <p>Thank you for your interest in becoming a vendor with ${companyName}. Unfortunately, your application has been <strong style="color: #dc3545;">rejected</strong> at this time.</p>
        
        ${message ? `
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Reason:</strong> ${message}
          </div>
        ` : ''}
        
        <p>You're welcome to reapply in the future. Please ensure you meet all our vendor requirements before submitting a new application.</p>
      `}
      
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      
      <p>Best regards,<br>
      The ${companyName} Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: vendorEmail,
      subject,
      html: htmlBody,
    });
    console.log(`Vendor ${status} email sent successfully to: ${vendorEmail}`);
    return { success: true, message: `Vendor ${status} email sent successfully.` };
  } catch (error: any) {
    console.error(`Error sending vendor ${status} email to ${vendorEmail}:`, error);
    return { success: false, message: error.message || `Failed to send vendor ${status} email.` };
  }
}

export async function sendVendorWelcomeEmail(vendorData: {
  name: string;
  email: string;
  loginUrl?: string;
}) {
  const { name, email, loginUrl } = vendorData;
  const companyName = getCompanyName();
  
  const subject = `Welcome to ${companyName} - Vendor Registration Received`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #007bff;">Welcome to ${companyName}!</h1>
      </div>
      
      <p>Dear ${name},</p>
      
      <p>Thank you for your interest in becoming a vendor with ${companyName}. We have received your application and it is currently under review.</p>
      
      <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0c5460;">⏳ Application Status: Pending Review</h3>
        <p style="margin-bottom: 0;">Our team will review your application and notify you of the decision within 2-3 business days.</p>
      </div>
      
      <h3>What happens next?</h3>
      <ul>
        <li>Our team will review your vendor application</li>
        <li>We may contact you if additional information is needed</li>
        <li>You'll receive an email notification once your application is processed</li>
        <li>If approved, you'll get access to the vendor dashboard</li>
      </ul>
      
      <p>If you have any questions about your application, please contact our vendor support team.</p>
      
      <p>Thank you for choosing ${companyName}!</p>
      
      <p>Best regards,<br>
      The ${companyName} Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject,
      html: htmlBody,
    });
    console.log(`Vendor welcome email sent successfully to: ${email}`);
    return { success: true, message: 'Vendor welcome email sent successfully.' };
  } catch (error: any) {
    console.error(`Error sending vendor welcome email to ${email}:`, error);
    return { success: false, message: error.message || 'Failed to send vendor welcome email.' };
  }
}

