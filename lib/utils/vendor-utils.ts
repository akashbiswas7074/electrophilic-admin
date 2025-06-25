/**
 * Utility functions for vendor-related operations
 */

/**
 * Extract vendor name from vendor object or populated vendor data
 */
export function getVendorName(vendor: any, vendorId?: any): string {
  try {
    // If vendor is a populated object with name
    if (vendor && typeof vendor === 'object' && vendor.name) {
      return vendor.name;
    }
    
    // If vendor has businessName
    if (vendor && typeof vendor === 'object' && vendor.businessName) {
      return vendor.businessName;
    }
    
    // If vendorId is populated with vendor details
    if (vendorId && typeof vendorId === 'object' && vendorId.name) {
      return vendorId.name;
    }
    
    // If vendorId has businessName
    if (vendorId && typeof vendorId === 'object' && vendorId.businessName) {
      return vendorId.businessName;
    }
    
    // If vendor is stored as object with name property
    if (vendor && vendor.name) {
      return vendor.name;
    }
    
    // If vendor has email but no name
    if (vendor && vendor.email && !vendor.name) {
      return vendor.email.split('@')[0]; // Use email prefix as fallback
    }
    
    // If vendorId has email but no name
    if (vendorId && vendorId.email && !vendorId.name) {
      return vendorId.email.split('@')[0]; // Use email prefix as fallback
    }
    
    return 'Unknown Vendor';
  } catch (error) {
    console.warn('Error extracting vendor name:', error);
    return 'Unknown Vendor';
  }
}

/**
 * Extract vendor email from vendor object or populated vendor data
 */
export function getVendorEmail(vendor: any, vendorId?: any): string {
  try {
    // If vendor is a populated object with email
    if (vendor && typeof vendor === 'object' && vendor.email) {
      return vendor.email;
    }
    
    // If vendorId is populated with vendor details
    if (vendorId && typeof vendorId === 'object' && vendorId.email) {
      return vendorId.email;
    }
    
    // If vendor is stored as object with email property
    if (vendor && vendor.email) {
      return vendor.email;
    }
    
    return '';
  } catch (error) {
    console.warn('Error extracting vendor email:', error);
    return '';
  }
}

/**
 * Extract vendor phone from vendor object or populated vendor data
 */
export function getVendorPhone(vendor: any, vendorId?: any): string {
  try {
    // If vendor is a populated object with phone
    if (vendor && typeof vendor === 'object' && vendor.phone) {
      return vendor.phone;
    }
    
    // If vendor is a populated object with phoneNumber
    if (vendor && typeof vendor === 'object' && vendor.phoneNumber) {
      return vendor.phoneNumber;
    }
    
    // If vendorId is populated with vendor details
    if (vendorId && typeof vendorId === 'object' && vendorId.phone) {
      return vendorId.phone;
    }
    
    // If vendorId is populated with phoneNumber
    if (vendorId && typeof vendorId === 'object' && vendorId.phoneNumber) {
      return vendorId.phoneNumber;
    }
    
    return '';
  } catch (error) {
    console.warn('Error extracting vendor phone:', error);
    return '';
  }
}

/**
 * Extract vendor business name from vendor object or populated vendor data
 */
export function getVendorBusinessName(vendor: any, vendorId?: any): string {
  try {
    // If vendor is a populated object with businessName
    if (vendor && typeof vendor === 'object' && vendor.businessName) {
      return vendor.businessName;
    }
    
    // If vendorId is populated with vendor details
    if (vendorId && typeof vendorId === 'object' && vendorId.businessName) {
      return vendorId.businessName;
    }
    
    // Fall back to regular name if no business name
    return getVendorName(vendor, vendorId);
  } catch (error) {
    console.warn('Error extracting vendor business name:', error);
    return 'Unknown Business';
  }
}

/**
 * Extract vendor ID from vendor object or populated vendor data
 */
export function getVendorId(vendor: any, vendorId?: any): string {
  try {
    // If vendor is a populated object with _id
    if (vendor && typeof vendor === 'object' && vendor._id) {
      return vendor._id.toString();
    }
    
    // If vendorId is populated with vendor details
    if (vendorId && typeof vendorId === 'object' && vendorId._id) {
      return vendorId._id.toString();
    }
    
    // If vendorId is a string
    if (vendorId && typeof vendorId === 'string') {
      return vendorId;
    }
    
    return '';
  } catch (error) {
    console.warn('Error extracting vendor ID:', error);
    return '';
  }
}

export interface VendorDisplayInfo {
  name: string;
  email: string;
  businessName: string;
  vendorId: string;
  phone?: string;
  hasVendor: boolean;
}

/**
 * Gets formatted vendor display information from a vendor object or vendorId
 * @param vendor The vendor object (could be various formats depending on API)
 * @param vendorId Optional vendor ID if vendor object is not available
 * @returns Standardized vendor display information
 */
export function getVendorDisplayInfo(vendor?: any, vendorId?: string): VendorDisplayInfo {
  // Default display info when no vendor is found
  const defaultInfo: VendorDisplayInfo = {
    name: 'Unknown Vendor',
    email: '',
    businessName: 'Unknown Business',
    vendorId: vendorId || '',
    hasVendor: false
  };

  // Return default if no vendor data is available
  if (!vendor && !vendorId) {
    return defaultInfo;
  }

  // Flag to indicate if we found valid vendor info
  let hasVendor = false;

  try {
    // Handle case where vendor is a string ID
    if (typeof vendor === 'string') {
      return {
        ...defaultInfo,
        vendorId: vendor,
        name: `Vendor ID: ${vendor}`,
        businessName: `Vendor ID: ${vendor}`,
        hasVendor: true
      };
    }

    // Handle case where vendor is an object
    if (vendor && typeof vendor === 'object') {
      hasVendor = true;
      const vendorEmail = vendor.email || vendor.emailAddress || '';
      const vendorName = vendor.name || vendor.fullName || vendor.displayName || 'Unnamed Vendor';
      const businessName = vendor.businessName || vendor.companyName || vendor.storeName || vendorName;
      const phone = vendor.phone || vendor.phoneNumber || vendor.contactNumber || '';
      const id = vendor._id || vendor.id || vendorId || '';

      return {
        name: vendorName,
        email: vendorEmail,
        businessName: businessName,
        vendorId: id,
        phone: phone,
        hasVendor: hasVendor
      };
    }

    // If we only have a vendorId, return a basic info with that ID
    if (vendorId) {
      return {
        ...defaultInfo,
        vendorId: vendorId,
        name: `Vendor ID: ${vendorId}`,
        businessName: `Vendor ID: ${vendorId}`,
        hasVendor: true
      };
    }
  } catch (error) {
    console.error('Error parsing vendor info:', error);
  }

  return defaultInfo;
}

/**
 * Extracts a standard vendor object with common fields from various vendor data formats
 * @param vendorData Raw vendor data that might be in different formats
 * @returns Standardized vendor object
 */
export function normalizeVendorData(vendorData: any) {
  if (!vendorData) return null;

  // Handle string IDs
  if (typeof vendorData === 'string') {
    return {
      _id: vendorData,
      name: `Vendor ${vendorData}`,
      email: ''
    };
  }

  // Handle objects
  if (typeof vendorData === 'object') {
    return {
      _id: vendorData._id || vendorData.id || '',
      name: vendorData.name || vendorData.fullName || vendorData.displayName || 'Unnamed Vendor',
      email: vendorData.email || vendorData.emailAddress || '',
      businessName: vendorData.businessName || vendorData.companyName || vendorData.storeName || '',
      phone: vendorData.phone || vendorData.phoneNumber || vendorData.contactNumber || '',
      // Add other fields as needed
    };
  }

  return null;
}