"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface CancellationRequest {
  _id: string;
  orderId: string;
  productId: string;
  reason: string;
  requestedAt: string;
}

/**
 * Component that checks for cancellation requests on mount and periodically
 * Displays toast notifications for new requests
 */
export default function CancellationRequestNotifier() {
  const { toast } = useToast();
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Function to check for cancellation requests
  const checkForCancellationRequests = async () => {
    try {
      // Only send the last check time if we have one
      const params = lastCheckTime 
        ? new URLSearchParams({ since: lastCheckTime.toISOString() }) 
        : new URLSearchParams();
        
      const response = await fetch(`/api/admin/orders/cancellation-requests?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cancellation requests');
      }
      
      const data = await response.json();
      
      if (data.success && data.requests.length > 0) {
        // Show notification for each new request or a summary if there are many
        if (data.requests.length <= 3) {
          data.requests.forEach((request: CancellationRequest) => {
            toast({
              title: "New Cancellation Request",
              description: `Order ${request.orderId}: ${request.reason}`,
              duration: 10000, // 10 seconds
              action: (
                <a 
                  href={`/admin/dashboard/orders/view/${request.orderId}`}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-secondary px-3 text-sm font-medium text-secondary-foreground ring-offset-background transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  View
                </a>
              ),
            });
          });
        } else {
          // If there are many requests, show a summary
          toast({
            title: "Multiple New Cancellation Requests",
            description: `You have ${data.requests.length} new cancellation requests`,
            duration: 10000,
            action: (
              <a 
                href="/admin/dashboard/orders"
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
      console.error('Error checking for cancellation requests:', error);
    }
  };

  useEffect(() => {
    // Check on component mount
    checkForCancellationRequests();
    
    // Set up interval to check periodically (every 5 minutes)
    const intervalId = setInterval(checkForCancellationRequests, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  return null; // This is a background component, no UI needed
}
