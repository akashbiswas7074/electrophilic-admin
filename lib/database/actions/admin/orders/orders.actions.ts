"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import Product from "@/lib/database/models/product.model";
import User from "@/lib/database/models/user.model";
import { sendOrderStatusUpdateEmail, sendOrderConfirmationEmail } from "@/lib/email"; // Removed non-existent email functions
import { mapWebsiteStatusToAdmin, mapAdminStatusToWebsite } from "@/lib/order-status-utils"; // Added mapAdminStatusToWebsite
import mongoose from "mongoose";

type DateRange =
  | "today"
  | "yesterday"
  | "2d"
  | "7d"
  | "15d"
  | "30d"
  | "2m"
  | "5m"
  | "10m"
  | "12m"
  | "all"
  | "today_and_yesterday";
type PaymentStatus = "paid" | "unPaid" | "-";
type PaymentMethod = "cash" | "RazorPay" | "-";

// get all orders for admin
export const getAllOrders = async (
  range: DateRange,
  isPaid: PaymentStatus,
  paymentMethod: PaymentMethod
) => {
  try {
    await connectToDatabase();
    const now = new Date();
    const dateRanges: { [key in DateRange]: Date } = {
      today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      yesterday: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      "2d": new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      "7d": new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      "15d": new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      "30d": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      "2m": new Date(new Date().setMonth(new Date().getMonth() - 2)),
      "5m": new Date(new Date().setMonth(new Date().getMonth() - 5)),
      "10m": new Date(new Date().setMonth(new Date().getMonth() - 10)),
      "12m": new Date(new Date().setMonth(new Date().getMonth() - 12)),
      all: new Date(0),
      today_and_yesterday: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
      ),
    };
    let fromDate: Date;
    let toDate: Date = now;
    if (range === "today_and_yesterday") {
      fromDate = dateRanges["yesterday"];
    } else if (range === "all") {
      fromDate = dateRanges["all"];
      toDate = new Date();
    } else {
      fromDate = dateRanges[range] || new Date(0);
    }
    const isPaidValue = (): boolean | undefined => {
      if (isPaid === "paid") {
        return true;
      } else if (isPaid === "unPaid") {
        return false;
      }
      return undefined;
    };
    const paymentMethodValue = (): string | undefined => {
      if (paymentMethod === "cash") {
        return "cash";
      } else if (paymentMethod === "RazorPay") {
        return "RazorPay";
      }
      return undefined;
    };
    // construct the query object dynamically

    const query: any = {
      createdAt: { $gte: fromDate, $lte: toDate },
    };
    const paidStatus = isPaidValue();
    if (paidStatus !== undefined) {
      query.isPaid = paidStatus;
    }
    const paymentMethodStatus = paymentMethodValue();
    if (paymentMethodStatus !== undefined) {
      query.paymentMethod = paymentMethodStatus;
    }
    const orders = await Order.find(query)
      .populate({
        path: "user",
        model: User,
        select: "name email image",
      })
      .populate({
        path: "products.product",
        model: Product,
        select: "slug brand sku name images price",
      })
      .populate({
        path: "orderItems.product",
        model: Product,
        select: "slug brand sku name images price",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Simplify the order processing to avoid TypeScript issues
    const processedOrders = orders.map((order) => {
      const orderObj = JSON.parse(JSON.stringify(order));

      // If order has orderItems but no products, create products array
      if (
        orderObj.orderItems?.length > 0 &&
        (!orderObj.products || orderObj.products.length === 0)
      ) {
        orderObj.products = orderObj.orderItems.map((item: any) => ({
          ...item,
          status: item.status || "Not Processed",
        }));
      }
      // If order has products but no orderItems, create orderItems array
      else if (
        orderObj.products?.length > 0 &&
        (!orderObj.orderItems || orderObj.orderItems.length === 0)
      ) {
        orderObj.orderItems = orderObj.products;
      }

      return orderObj;
    });

    console.log(`Fetched ${processedOrders.length} orders for range: ${range}`);
    return processedOrders;
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// update product order status
export const updateProductOrderStatus = async (
  orderId: string,
  productId: string,
  status: string,
  trackingUrl?: string, // New parameter
  trackingId?: string, // New parameter
  customMessage?: string, // New parameter for email
  suppressEmailNotification: boolean = false // New parameter with default
) => {
  try {
    console.log('[updateProductOrderStatus] Received - OrderID:', orderId, 'ProductID:', productId, 'Status:', status, 'TrackingURL:', trackingUrl, 'TrackingID:', trackingId, 'SuppressEmail:', suppressEmailNotification);
    await connectToDatabase();
    
    const order = await Order.findById(orderId).populate({
      path: "user",
      model: User,
      select: "name email"
    }).populate({ // Populate products/orderItems to have details for the email
      path: "products.product",
      model: Product,
      select: "name images" // Add any other fields needed for the email
    }).populate({
      path: "orderItems.product",
      model: Product,
      select: "name images" // Add any other fields needed for the email
    });
    
    if (!order) {
      return {
        message: "Order not found with this Id!",
        success: false,
      };
    }
    
    let itemToUpdate;
    let itemPath; 

    if (order.products && order.products.length > 0) {
      itemToUpdate = order.products.find(
        (p: any) => p._id.toString() === productId
      );
      if (itemToUpdate) itemPath = "products";
    }

    if (!itemToUpdate && order.orderItems && order.orderItems.length > 0) {
      itemToUpdate = order.orderItems.find(
        (p: any) => p._id.toString() === productId
      );
      if (itemToUpdate) itemPath = "orderItems";
    }
    
    if (!itemToUpdate || !itemPath) {
      console.error('[updateProductOrderStatus] Product not found in order. OrderID:', orderId, 'ProductID:', productId);
      return { message: "Product not found in order", success: false };
    }
    
    console.log('[updateProductOrderStatus] Item to update (before):', JSON.stringify(itemToUpdate));
    console.log('[updateProductOrderStatus] itemToUpdate constructor name:', itemToUpdate?.constructor?.name);
    const oldStatus = itemToUpdate.status;
    // itemToUpdate.status = status; // Will be set using $set if it's a mongoose doc

    if (itemToUpdate && typeof itemToUpdate.$set === 'function') {
      itemToUpdate.$set('status', status);
    } else {
      itemToUpdate.status = status; // Fallback for plain objects, though less likely here
    }

    if (status.toString() === "Confirmed") {
      console.log('[updateProductOrderStatus] Status is "Confirmed". Applying tracking info.');
      
      // Use $set for Mongoose documents/subdocuments
      if (itemToUpdate && typeof itemToUpdate.$set === 'function') {
        if (typeof trackingUrl !== 'undefined') {
          itemToUpdate.$set('trackingUrl', trackingUrl);
          console.log('[updateProductOrderStatus] Applied trackingUrl via $set:', trackingUrl);
        }
        if (typeof trackingId !== 'undefined') {
          itemToUpdate.$set('trackingId', trackingId);
          console.log('[updateProductOrderStatus] Applied trackingId via $set:', trackingId);
        }
      } else { // Fallback for plain objects - though itemToUpdate should be a Mongoose subdoc
        if (typeof trackingUrl !== 'undefined') {
          itemToUpdate.trackingUrl = trackingUrl;
          console.log('[updateProductOrderStatus] Applied trackingUrl directly:', trackingUrl);
        }
        if (typeof trackingId !== 'undefined') {
          itemToUpdate.trackingId = trackingId;
          console.log('[updateProductOrderStatus] Applied trackingId directly:', trackingId);
        }
      }
      
      console.log('[updateProductOrderStatus] Directly after assignment, itemToUpdate.trackingUrl:', itemToUpdate.trackingUrl);
      console.log('[updateProductOrderStatus] Directly after assignment, itemToUpdate.trackingId:', itemToUpdate.trackingId);

      // Explicitly mark the path as modified
      if (itemPath) { // itemPath is 'products' or 'orderItems'
        order.markModified(itemPath);
        console.log(`[updateProductOrderStatus] Marked path '${itemPath}' as modified.`);
      }
      // customMessage is not stored in the order item based on the prompt, only used for email.
    } else {
      console.log('[updateProductOrderStatus] Status is NOT "Confirmed". Current status:', status, '. Skipping tracking info update.');
    }

    console.log('[updateProductOrderStatus] Item to update (after attempting to set tracking):', JSON.stringify(itemToUpdate));

    if (status.toString() === "Completed") {
      itemToUpdate.productCompletedAt = new Date();
    }

    if (status.toString() === "Completed" && oldStatus !== "Completed") {
      try {
        const mainProduct = await Product.findById(itemToUpdate.product);
        if (mainProduct) {
          const subProduct = mainProduct.subProducts[0]; // Assuming one subProduct for simplicity
          const sizeInfo = subProduct.sizes.find(
            (s: any) => s.size === itemToUpdate.size
          );
          
          if (sizeInfo) {
            if (
              typeof sizeInfo.qty !== "number" ||
              typeof sizeInfo.sold !== "number"
            ) {
              // Initialize if not number
              sizeInfo.qty = Number(sizeInfo.qty) || 0;
              sizeInfo.sold = Number(sizeInfo.sold) || 0;
            }
            if (typeof itemToUpdate.qty !== "number") {
              itemToUpdate.qty = Number(itemToUpdate.qty) || 0;
            }
            
            sizeInfo.qty -= itemToUpdate.qty;
            subProduct.sold = (Number(subProduct.sold) || 0) + itemToUpdate.qty; // Increment by item qty
            sizeInfo.sold = (Number(sizeInfo.sold) || 0) + itemToUpdate.qty; // Increment by item qty
            await mainProduct.save();
          }
        }
      } catch (error) {
        console.error("Error updating product stock:", error);
        // Decide if this should be a critical failure or just a logged warning
        // For now, let's log and continue with status update
      }
    }
    
    // Save the order with the updated item status    // Ensure corresponding entry in other array is also updated with the same status
    if (itemPath === 'products' && order.orderItems && order.orderItems.length > 0) {
      const matchingOrderItem = order.orderItems.find(
        (item: any) => String(item.product) === String(itemToUpdate.product)
      );
      
      if (matchingOrderItem && matchingOrderItem.status !== status) {
        console.log(`[updateProductOrderStatus] Sync status to orderItems: ${matchingOrderItem.status} -> ${status}`);
        matchingOrderItem.status = status;
        
        if (status === "Confirmed" && typeof trackingUrl !== 'undefined') {
          matchingOrderItem.trackingUrl = trackingUrl;
        }
        if (status === "Confirmed" && typeof trackingId !== 'undefined') {
          matchingOrderItem.trackingId = trackingId;
        }
        
        order.markModified('orderItems');
      }
    } else if (itemPath === 'orderItems' && order.products && order.products.length > 0) {
      const matchingProduct = order.products.find(
        (prod: any) => String(prod.product) === String(itemToUpdate.product)
      );
      
      if (matchingProduct && matchingProduct.status !== status) {
        console.log(`[updateProductOrderStatus] Sync status to products: ${matchingProduct.status} -> ${status}`);
        matchingProduct.status = status;
        
        if (status === "Confirmed" && typeof trackingUrl !== 'undefined') {
          matchingProduct.trackingUrl = trackingUrl;
        }
        if (status === "Confirmed" && typeof trackingId !== 'undefined') {
          matchingProduct.trackingId = trackingId;
        }
        
        order.markModified('products');
      }
    }

    await order.save();
    console.log('[updateProductOrderStatus] Order.save() executed.');

    // Send email notification
    if (!suppressEmailNotification) {
      try {
        const userEmail = order.user?.email;
        const userName = order.user?.name || "Customer";
        
        if (userEmail) {
          if (status.toString() === "Confirmed") {
            // Prepare orderDetails for the confirmation email
            // Ensure products or orderItems are populated with necessary details
            const itemsForEmail = (order.products || order.orderItems || []).map((item: any) => ({
              name: item.product?.name || item.name || "Product Name",
              quantity: item.qty || 1,
              price: (item.price || 0).toFixed(2),
              // Add image if available and needed by the template
              // image: item.product?.images?.[0]?.url || item.image || undefined
            }));

            // Pass new details to the email function
            await sendOrderConfirmationEmail(userEmail, {
              id: order._id.toString(),
              userName: userName,
              items: itemsForEmail,
              totalAmount: (order.totalAmount ?? order.total).toFixed(2),
              trackingUrl: itemToUpdate.trackingUrl, // Pass trackingUrl
              trackingId: itemToUpdate.trackingId,   // Pass trackingId
              customMessage: customMessage,         // Pass customMessage
              // You might want to add other details like shipping address here
              // shippingAddress: order.shippingAddress || order.deliveryAddress,
            });
            console.log(`Order CONFIRMED email with tracking sent to ${userEmail} for order ${orderId}`);

          } else {
            // For other status updates, send the specific product status update email
            const productDetails = await Product.findById(itemToUpdate.product).select('name');
            const productName = productDetails?.name || "Ordered product";

            await sendOrderStatusUpdateEmail(userEmail, {
              orderId: order._id.toString(),
              userName: userName,
              productName: productName,
              status: status,
              statusUpdateMessage: `The status of your product "${productName}" (Order ID: ${order._id.toString()}) has been updated to "${status}".`
            });
            console.log(`Status update email sent to ${userEmail} for product ${productId} in order ${orderId}`);
          }
        } else {
          console.warn(`Could not send email notification for order ${orderId}: User email not found`);
        }
      } catch (emailError) {
        console.error(`Failed to send email for order ${orderId} (status: ${status}):`, emailError);
      }
    } else {
      console.log(`[updateProductOrderStatus] Email notification suppressed for order ${orderId}, product ${productId}, status ${status}.`);
    }
    
    return {
      message: "Successfully updated product order status and sent notification.",
      success: true,
      order: JSON.parse(JSON.stringify(order)) // Return the updated order
    };

  } catch (error: any) {
    console.error("Error in updateProductOrderStatus:", error);
    return {
      message: error.message || "An error occurred while updating status",
      success: false,
      error,
    };
  }
};

// updating order to old
export const updateOrdertoOldOrder = async (id: string) => {
  try {
    await connectToDatabase();
    await Order.findByIdAndUpdate(id, { isNew: false });
    return {
      message: "Order successfully changed to old order",
    };
  } catch (error: any) {
    console.log(error);
  }
};

// get all new orders for admin
export const getAllNewOrders = async () => {
  try {
    await connectToDatabase();

    const newOrders = await Order.find({
      products: {
        isNew: true,
      },
    });
    return JSON.parse(
      JSON.stringify({
        newOrders,
      })
    );
  } catch (error: any) {
    console.log(error);
  }
};

// Get total amount for a specific order
export const getOrderTotalAmount = async (orderId: string) => {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId).select('totalAmount').lean(); // .lean() for plain JS object
    if (!order || Array.isArray(order)) {
      // It's good practice to indicate if the order wasn't found
      return { success: false, message: 'Order not found', totalAmount: null };
    }
    // The order object will only contain _id and totalAmount due to .select()
    return { success: true, totalAmount: (order as { totalAmount?: number }).totalAmount ?? null };
  } catch (error: any) {
    console.error("Error fetching order total amount:", error);
    // Return a structured error response
    return { success: false, message: error.message || 'An error occurred while fetching total amount', totalAmount: null };
  }
};

// Get a single order by its ID
export const getOrderById = async (orderId: string) => {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId)
      .populate({
        path: "user",
        model: User,
        select: "name email", // Select fields you need
      })
      .populate({
        path: "orderItems.product", // Populate product details within orderItems
        model: Product,
        select: "name images slug price", // Select fields you need
      })
      .populate({
        path: "products.product", // Also populate products array if used differently
        model: Product,
        select: "name images slug price",
      })
      .lean();

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    // Ensure orderItems and products are consistently populated if one is missing
    // This logic might be more complex depending on your exact data model needs
    const orderObj = JSON.parse(JSON.stringify(order));
     if (
        orderObj.orderItems?.length > 0 &&
        (!orderObj.products || orderObj.products.length === 0)
      ) {
        orderObj.products = orderObj.orderItems.map((item: any) => ({
          ...item,
          status: item.status || "Not Processed", // Ensure status exists
        }));
      }
      else if (
        orderObj.products?.length > 0 &&
        (!orderObj.orderItems || orderObj.orderItems.length === 0)
      ) {
        orderObj.orderItems = orderObj.products.map((item: any) => ({
         ...item,
          status: item.status || "Not Processed", // Ensure status exists
        }));
      }


    return { success: true, order: orderObj };
  } catch (error: any) {
    console.error(`Error fetching order by ID ${orderId}:`, error);
    return { success: false, message: error.message || "Failed to fetch order." };
  }
};

// Update the overall status of an order
export const updateOverallOrderStatus = async (
  orderId: string,
  newStatus: string, // This should be the website-compatible status
  sendEmailNotification: boolean = true,
  customMessage?: string
) => {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId).populate({
      path: "user",
      model: User,
      select: "name email",
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    const oldStatus = order.status;
    order.status = newStatus; // Update the main order status

    // Sync the new status to all individual orderItems and products
    // This ensures consistent status across the entire order
    const adminStatus = mapWebsiteStatusToAdmin(newStatus);
    
    if (order.orderItems && order.orderItems.length > 0) {
      console.log(`[updateOverallOrderStatus] Updating all ${order.orderItems.length} orderItems to ${adminStatus}`);
      order.orderItems.forEach((item: { status: string }) => {
        item.status = adminStatus; // Updates status for each orderItem
      });
      order.markModified('orderItems');
    }
    
    if (order.products && order.products.length > 0) {
      console.log(`[updateOverallOrderStatus] Updating all ${order.products.length} products to ${adminStatus}`);
      order.products.forEach((item: { status: string }) => {
        item.status = adminStatus; // Updates status for each product
      });
      order.markModified('products');
    }

    if (newStatus === "delivered" && oldStatus !== "delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    if (sendEmailNotification && order.user?.email) {
      try {
        // You might want a more generic email template for overall status changes
        // or adapt sendOrderStatusUpdateEmail if it fits
        await sendOrderStatusUpdateEmail(order.user.email, {
          orderId: order._id.toString(),
          userName: order.user.name || "Customer",
          productName: "Your Recent Order", // Generic product name for overall status
          status: newStatus,
          statusUpdateMessage: customMessage || `The status of your order (ID: ${order.orderId}) has been updated to "${newStatus}".`,
        });
        console.log(`Overall status update email sent to ${order.user.email} for order ${order.orderId}`);
      } catch (emailError) {
        console.error(`Failed to send overall status update email for order ${order.orderId}:`, emailError);
      }
    }

    return { success: true, message: "Order status updated successfully.", order: JSON.parse(JSON.stringify(order)) };
  } catch (error: any) {
    console.error(`Error updating overall order status for ${orderId}:`, error);
    return {
      success: false,
      message: error.message || "An error occurred while updating status",
      error,
    };
  }
};


// process order address - ensures delivery address is properly formatted
export const processOrderAddress = async (orderId: string) => {
  try {
    await connectToDatabase();
    
    const order = await Order.findById(orderId);
    if (!order) {
      return {
        message: "Order not found with this Id!",
        success: false,
      };
    }
    
    // Ensure we have proper address objects
    if (!order.deliveryAddress || typeof order.deliveryAddress !== "object") {
      // Copy from shippingAddress if available
      if (order.shippingAddress && typeof order.shippingAddress === "object") {
        order.deliveryAddress = { ...order.shippingAddress };
      } else {
        // Create a default address if both are missing
        order.deliveryAddress = {
          firstName: "Customer",
          lastName: "",
          phoneNumber: "Not provided",
          address1: "Address not available",
          city: "Unknown",
          state: "Unknown",
          zipCode: "000000",
          country: "Unknown"
        };
      }
      // Make same update to shippingAddress to keep in sync
      if (!order.shippingAddress || typeof order.shippingAddress !== "object") {
        order.shippingAddress = { ...order.deliveryAddress };
      }
    }
    
    // Ensure all required fields exist in the addresses
    const requiredFields = ["firstName", "lastName", "phoneNumber", "address1", "city", "state", "zipCode", "country"];
    let updateMade = false;
    
    for (const field of requiredFields) {
      // Check and fix deliveryAddress
      if (!order.deliveryAddress[field] || String(order.deliveryAddress[field]).trim() === "") {
        // Try to get from shippingAddress first
        if (order.shippingAddress && order.shippingAddress[field] && 
            String(order.shippingAddress[field]).trim() !== "") {
          order.deliveryAddress[field] = order.shippingAddress[field];
        } else {
          // Use a default value if not available in either address
          const defaults: {[key: string]: string} = {
            firstName: "Customer",
            lastName: "",
            phoneNumber: "Not provided",
            address1: "Address not available",
            city: "Unknown",
            state: "Unknown",
            zipCode: "000000",
            country: "Unknown"
          };
          order.deliveryAddress[field] = defaults[field];
        }
        updateMade = true;
      }
      
      // Check and fix shippingAddress
      if (!order.shippingAddress[field] || String(order.shippingAddress[field]).trim() === "") {
        order.shippingAddress[field] = order.deliveryAddress[field];
        updateMade = true;
      }
    }
    
    if (updateMade) {
      await order.save();
      return {
        message: "Successfully processed and updated delivery address",
        success: true,
        order: JSON.parse(JSON.stringify(order))
      };
    } else {
      return {
        message: "Delivery address is already properly formatted",
        success: true,
        order: JSON.parse(JSON.stringify(order))
      };
    }
    
  } catch (error: any) {
    console.error("Error processing order address:", error);
    return {
      message: error.message || "An error occurred while processing delivery address",
      success: false,
      error,
    };
  }
};

// Get order details by ID
export const getOrderDetailsById = async (orderId: string) => {
  try {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return {
        success: false,
        message: "Invalid order ID format.",
        order: null,
      };
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "user",
        model: User,
        select: "name email image", // Select fields you need from User
      })
      .populate({
        path: "orderItems.product", // If your order items reference products directly
        model: Product,
        select: "name images slug", // Select fields you need from Product
      })
      .populate({
        path: "products.product", // If you have a products array with product refs
        model: Product,
        select: "name images slug",
      });

    if (!order) {
      return {
        success: false,
        message: "Order not found.",
        order: null,
      };
    }

    return {
      success: true,
      message: "Order fetched successfully.",
      order: JSON.parse(JSON.stringify(order)),
    };
  } catch (error: any) {
    console.error("Error fetching order details:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch order details.",
      order: null,
    };
  }
};

// Manually update order status directly - for admin use only
export const manuallyUpdateOrderStatus = async (
  orderId: string,
  newStatus: string,
  updateAllItems: boolean = true,
) => {
  try {
    await connectToDatabase();
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return {
        success: false,
        message: "Invalid order ID format"
      };
    }
    
    // Find the order first
    const order = await Order.findById(orderId);
    if (!order) {
      return {
        success: false,
        message: "Order not found with this ID"
      };
    }
    
    const previousStatus = order.status;
    
    // Create update object
    const updateObj: any = {
      status: newStatus,
    };
    
    // If order is marked as delivered, set deliveredAt timestamp
    if (newStatus === "delivered" && previousStatus !== "delivered") {
      updateObj.deliveredAt = new Date();
    }
    
    // If updateAllItems is true, update status in all products and orderItems
    if (updateAllItems) {
      // Convert website status to admin status for items
      const adminStatus = mapWebsiteStatusToAdmin(newStatus);
      
      // Direct update approach for arrays
      if (order.products && order.products.length > 0) {
        for (let i = 0; i < order.products.length; i++) {
          order.products[i].status = adminStatus;
        }
      }
      
      if (order.orderItems && order.orderItems.length > 0) {
        for (let i = 0; i < order.orderItems.length; i++) {
          order.orderItems[i].status = adminStatus;
        }
      }
      
      order.markModified('products');
      order.markModified('orderItems');
    }
    
    // Apply the status update
    order.status = newStatus;
    
    // Save the changes
    await order.save();
    
    return {
      success: true,
      message: `Order status successfully updated from ${previousStatus} to ${newStatus}`,
      order: JSON.parse(JSON.stringify(order))
    };
  } catch (error: any) {
    console.error("Error in manuallyUpdateOrderStatus:", error);
    return {
      success: false,
      message: error.message || "Failed to update order status",
      error: error
    };
  }
};
