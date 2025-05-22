/**
 * Utilities for handling order status mapping between website and admin formats
 */

/**
 * Maps the website order status to admin status format
 */
export function mapWebsiteStatusToAdmin(websiteStatus: string): string {
  // Early return for undefined/null values to prevent errors
  if (websiteStatus === undefined || websiteStatus === null) {
    return 'Not Processed';
  }

  const statusMap: Record<string, string> = {
    'pending': 'Not Processed',
    'processing': 'Processing',
    'confirmed': 'Confirmed',
    'Confirmed': 'Confirmed', // Handle case variations
    'shipped': 'Dispatched',
    'dispatched': 'Dispatched', // Handle case variations
    'Dispatched': 'Dispatched', // Handle case variations
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'Cancelled': 'Cancelled', // Handle case variations
    'refunded': 'Processing Refund',
    'completed': 'Completed',
    'Completed': 'Completed' // Handle case variations
  };
  
  return statusMap[websiteStatus] || websiteStatus || 'Not Processed';
}

/**
 * Maps the admin order status to website format
 */
export function mapAdminStatusToWebsite(adminStatus: string): string {
  const statusMap: Record<string, string> = {
    'Not Processed': 'pending',
    'Processing': 'processing',
    'Confirmed': 'confirmed',
    'Dispatched': 'shipped',
    'Delivered': 'delivered',
    'Cancelled': 'cancelled',
    'Processing Refund': 'refunded',
    'Completed': 'completed'
  };
  
  return statusMap[adminStatus] || adminStatus || 'pending';
}

/**
 * Get status color coding for UI based on status
 */
export function getStatusColor(status: string): { bg: string, text: string, border: string } {
  const statusColors = {
    'Not Processed': { bg: '#fff4e5', text: '#ff8b00', border: '#ffe0b2' },
    'Processing': { bg: '#e3f2fd', text: '#1976d2', border: '#bbdefb' },
    'Confirmed': { bg: '#e0f2f7', text: '#00796b', border: '#b2dfdb' },
    'Dispatched': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
    'Delivered': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
    'Cancelled': { bg: '#fbe9e7', text: '#d32f2f', border: '#ffcdd2' },
    'Processing Refund': { bg: '#fbe9e7', text: '#d32f2f', border: '#ffcdd2' },
    'Completed': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
    
    // Website status colors
    'pending': { bg: '#fff4e5', text: '#ff8b00', border: '#ffe0b2' },
    'processing': { bg: '#e3f2fd', text: '#1976d2', border: '#bbdefb' },
    'confirmed': { bg: '#e0f2f7', text: '#00796b', border: '#b2dfdb' },
    'shipped': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
    'delivered': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
    'cancelled': { bg: '#fbe9e7', text: '#d32f2f', border: '#ffcdd2' },
    'refunded': { bg: '#fbe9e7', text: '#d32f2f', border: '#ffcdd2' },
    'completed': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' }
  };

  // Normalize the status to handle case variations
  const normalizedStatus = Object.keys(statusColors).find(
    key => key.toLowerCase() === status?.toLowerCase()
  ) || status;

  return statusColors[normalizedStatus as keyof typeof statusColors] || { bg: '#f5f5f5', text: '#757575', border: '#e0e0e0' };
}

/**
 * Get array of available status options
 */
export function getOrderStatusOptions() {
  return [
    { value: 'Not Processed', label: 'Not Processed' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Dispatched', label: 'Dispatched' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Completed', label: 'Completed' }
  ];
}

/**
 * Determine if the status requires tracking information
 */
export function statusRequiresTracking(status: string): boolean {
  const trackingStatuses = ['Confirmed', 'Dispatched', 'confirmed', 'shipped'];
  return trackingStatuses.includes(status);
}

// Ensure all functions are properly exported
const orderStatusUtils = {
  mapWebsiteStatusToAdmin,
  mapAdminStatusToWebsite,
  getStatusColor,
  getOrderStatusOptions,
  statusRequiresTracking
};

export default orderStatusUtils;
