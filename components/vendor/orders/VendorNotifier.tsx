"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@mantine/core';
import { IconAlertCircle, IconShoppingCart, IconStar } from '@tabler/icons-react';

interface VendorNotification {
  _id: string;
  type: 'new_order' | 'review' | 'low_stock' | 'general';
  orderId?: string;
  productId?: string;
  message: string;
  createdAt: string;
}

/**
 * Component that checks for vendor-specific notifications on mount and periodically
 * Displays toast notifications for new orders, reviews, low stock alerts, etc.
 */
export default function VendorNotifier() {
  const { toast } = useToast();
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Function to get appropriate icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <IconShoppingCart size={16} />;
      case 'review':
        return <IconStar size={16} />;
      case 'low_stock':
        return <IconAlertCircle size={16} />;
      default:
        return <IconAlertCircle size={16} />;
    }
  };

  // Function to get notification title based on type
  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'New Order Received';
      case 'review':
        return 'New Product Review';
      case 'low_stock':
        return 'Low Stock Alert';
      default:
        return 'Vendor Notification';
    }
  };

  // Function to get appropriate link based on notification type
  const getNotificationLink = (notification: VendorNotification) => {
    switch (notification.type) {
      case 'new_order':
        return notification.orderId 
          ? `/vendor/dashboard/orders/${notification.orderId}` 
          : '/vendor/dashboard/orders';
      case 'review':
        return notification.productId 
          ? `/vendor/dashboard/products/${notification.productId}/reviews` 
          : '/vendor/dashboard/reviews';
      case 'low_stock':
        return notification.productId 
          ? `/vendor/dashboard/products/${notification.productId}` 
          : '/vendor/dashboard/products';
      default:
        return '/vendor/dashboard';
    }
  };

  // Function to check for vendor notifications
  const checkForVendorNotifications = async () => {
    try {
      // Only send the last check time if we have one
      const params = lastCheckTime 
        ? new URLSearchParams({ since: lastCheckTime.toISOString() }) 
        : new URLSearchParams();
        
      const response = await fetch(`/api/vendor/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendor notifications');
      }
      
      const data = await response.json();
      
      if (data.success && data.notifications.length > 0) {
        // Show notification for each new notification or a summary if there are many
        if (data.notifications.length <= 3) {
          data.notifications.forEach((notification: VendorNotification) => {
            toast({
              title: getNotificationTitle(notification.type),
              description: notification.message,
              duration: 10000, // 10 seconds
              action: (
                <a 
                  href={getNotificationLink(notification)}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-secondary px-3 text-sm font-medium text-secondary-foreground ring-offset-background transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  View
                </a>
              ),
            });
          });
        } else {
          // If there are many notifications, show a summary
          toast({
            title: "Multiple New Notifications",
            description: `You have ${data.notifications.length} new notifications`,
            duration: 10000,
            action: (
              <a 
                href="/vendor/dashboard"
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-secondary px-3 text-sm font-medium text-secondary-foreground ring-offset-background transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                View All
              </a>
            ),
          });
        }
      }
      
      // Update the last check time
      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Error checking for vendor notifications:', error);
    }
  };

  useEffect(() => {
    // Check on component mount
    checkForVendorNotifications();
    
    // Set up interval to check periodically (every 5 minutes)
    const intervalId = setInterval(checkForVendorNotifications, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  return null; // This is a background component, no UI needed
}