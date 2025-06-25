import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getVendorDisplayInfo } from '@/lib/utils/vendor-utils';

interface VendorBadgeProps {
  vendor?: any;
  vendorId?: any;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showEmail?: boolean;
}

export function VendorBadge({ 
  vendor, 
  vendorId, 
  className = '', 
  size = 'sm',
  showEmail = false 
}: VendorBadgeProps) {
  const { name, email, hasVendor } = getVendorDisplayInfo(vendor, vendorId);
  
  if (!hasVendor) {
    return (
      <Badge variant="outline" className={`text-gray-500 border-gray-300 ${className}`}>
        No Vendor
      </Badge>
    );
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <Badge 
        variant="default" 
        className={`bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 ${sizeClasses[size]}`}
      >
        {name}
      </Badge>
      {showEmail && email && (
        <span className="text-xs text-gray-500">{email}</span>
      )}
    </div>
  );
}