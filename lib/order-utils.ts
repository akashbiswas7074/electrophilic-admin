/**
 * Utilities for handling order data between website and admin panel formats
 */

/**
 * Maps the website order status to admin status format
 * @param {string} websiteStatus - Status from the website order model
 * @returns {string} - Equivalent admin order status
 */
export function mapWebsiteStatusToAdmin(websiteStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Not Processed',
    'processing': 'Processing',
    'shipped': 'Dispatched',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'refunded': 'Processing Refund',
    'completed': 'Completed'
  };
  return statusMap[websiteStatus] || 'Not Processed';
}

/**
 * Maps the admin order status to website format
 * @param {string} adminStatus - Status from the admin order model
 * @returns {string} - Equivalent website order status
 */
export function mapAdminStatusToWebsite(adminStatus: string): string {
  const statusMap: Record<string, string> = {
    'Not Processed': 'pending',
    'Processing': 'processing',
    'Dispatched': 'shipped',
    'Delivered': 'delivered',
    'Cancelled': 'cancelled',
    'Processing Refund': 'refunded',
    'Completed': 'completed'
  };
  return statusMap[adminStatus] || 'pending';
}

/**
 * Normalizes order data from either format to admin panel format
 * @param order - The order object to normalize
 * @returns Normalized order object for admin use
 */
export function normalizeOrderForAdmin(order: any): any {
  if (!order) return null;
  
  // Deep clone to avoid modifying original
  const normalizedOrder = JSON.parse(JSON.stringify(order));

  // Ensure nested objects exist to prevent errors
  if (!normalizedOrder.products) normalizedOrder.products = [];
  if (!normalizedOrder.orderItems) normalizedOrder.orderItems = [];
  
  // Handle orderItems to products sync
  if (normalizedOrder.orderItems?.length > 0 && normalizedOrder.products.length === 0) {
    // Copy orderItems to products with admin-friendly structure
    normalizedOrder.products = normalizedOrder.orderItems.map((item: any) => {
      // Format item with admin-friendly fields
      return {
        ...item,
        status: item.status ? mapWebsiteStatusToAdmin(item.status) : 'Not Processed',
        // Ensure both qty and quantity exist
        qty: item.qty || item.quantity || 1,
        quantity: item.quantity || item.qty || 1
      };
    });
  }
  
  // Convert main order status to admin format if it's in website format
  if (normalizedOrder.status && typeof normalizedOrder.status === 'string' && 
      ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(normalizedOrder.status)) {
    normalizedOrder.status = mapWebsiteStatusToAdmin(normalizedOrder.status);
  }
  
  // Sync shipping address and delivery address
  if (normalizedOrder.deliveryAddress && !normalizedOrder.shippingAddress) {
    normalizedOrder.shippingAddress = { ...normalizedOrder.deliveryAddress };
  } else if (normalizedOrder.shippingAddress && !normalizedOrder.deliveryAddress) {
    normalizedOrder.deliveryAddress = { ...normalizedOrder.shippingAddress };
  }
  
  // Ensure total and totalAmount fields exist
  if (normalizedOrder.totalAmount && !normalizedOrder.total) {
    normalizedOrder.total = normalizedOrder.totalAmount;
  } else if (normalizedOrder.total && !normalizedOrder.totalAmount) {
    normalizedOrder.totalAmount = normalizedOrder.total;
  }
  
  return normalizedOrder;
}

/**
 * Prepares an order update payload for the admin API
 * @param orderId - The ID of the order to update
 * @param status - The new status in admin format
 * @returns Object with orderId and status in admin format
 */
export function prepareOrderUpdatePayload(orderId: string, status: string): any {
  return {
    orderId,
    status
  };
}

export default {
  mapWebsiteStatusToAdmin,
  mapAdminStatusToWebsite,
  normalizeOrderForAdmin,
  prepareOrderUpdatePayload
};