import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Group, Text, Alert, Box, Stack, Divider, TextInput } from '@mantine/core';
import axios from 'axios';

interface ManualStatusUpdateProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdated?: (newStatus: string) => void;
}

const ManualStatusUpdate: React.FC<ManualStatusUpdateProps> = ({ 
  orderId, 
  currentStatus, 
  onStatusUpdated 
}) => {
  // Move status mapping to client-only code with useEffect
  const [adminCurrentStatus, setAdminCurrentStatus] = useState<string>(currentStatus);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [trackingId, setTrackingId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Client-side only code to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    
    // Now it's safe to map the status
    const mappedStatus = mapWebsiteStatusToAdmin(currentStatus);
    setAdminCurrentStatus(mappedStatus);
    setSelectedStatus(mappedStatus);
  }, [currentStatus]);

  // Implement the necessary utility functions inline
  const mapWebsiteStatusToAdmin = (websiteStatus: string): string => {
    if (!websiteStatus) return 'Not Processed';
    
    const statusMap: Record<string, string> = {
      'pending': 'Not Processed',
      'processing': 'Processing',
      'confirmed': 'Confirmed',
      'shipped': 'Dispatched',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Processing Refund',
      'completed': 'Completed'
    };
    
    return statusMap[websiteStatus] || websiteStatus;
  };
  
  const mapAdminStatusToWebsite = (adminStatus: string): string => {
    if (!adminStatus) return 'pending';
    
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
    
    return statusMap[adminStatus] || adminStatus;
  };
  
  const getStatusColor = (status: string): {bg: string, text: string, border: string} => {
    const colors: Record<string, {bg: string, text: string, border: string}> = {
      'Not Processed': { bg: '#fff4e5', text: '#ff8b00', border: '#ffe0b2' },
      'Processing': { bg: '#e3f2fd', text: '#1976d2', border: '#bbdefb' },
      'Confirmed': { bg: '#e0f2f7', text: '#00796b', border: '#b2dfdb' },
      'Dispatched': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
      'Delivered': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
      'Cancelled': { bg: '#fbe9e7', text: '#d32f2f', border: '#ffcdd2' },
      'Completed': { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' }
    };
    
    return colors[status] || { bg: '#f5f5f5', text: '#757575', border: '#e0e0e0' };
  };
  
  const statusRequiresTracking = (status: string): boolean => {
    return ['Confirmed', 'Dispatched'].includes(status);
  };
  
  const getOrderStatusOptions = () => {
    return [
      { value: 'Not Processed', label: 'Not Processed' },
      { value: 'Processing', label: 'Processing' },
      { value: 'Confirmed', label: 'Confirmed' },
      { value: 'Dispatched', label: 'Dispatched' },
      { value: 'Delivered', label: 'Delivered' },
      { value: 'Cancelled', label: 'Cancelled' },
      { value: 'Completed', label: 'Completed' }
    ];
  };

  const statusOptions = getOrderStatusOptions();
  const showTrackingFields = selectedStatus && statusRequiresTracking(selectedStatus);
  const currentStatusColor = isClient ? getStatusColor(adminCurrentStatus) : { bg: '#f5f5f5', text: '#757575', border: '#e0e0e0' };

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === adminCurrentStatus) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convert admin status to website format for the API
      const websiteStatus = mapAdminStatusToWebsite(selectedStatus);
      
      const response = await axios.post('/api/admin/orders/manual-status-update', {
        orderId,
        status: websiteStatus,
        updateAllItems: true,
        trackingUrl: showTrackingFields ? trackingUrl : undefined,
        trackingId: showTrackingFields ? trackingId : undefined,
        customMessage: customMessage || undefined
      });
      
      if (response.data.success) {
        setSuccess(`Status updated successfully to ${selectedStatus}`);
        if (onStatusUpdated) {
          onStatusUpdated(websiteStatus);
        }
      } else {
        setError(response.data.message || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" p="md" radius="md" withBorder>
      <Text fw={500} size="lg" mb={15}>Manual Status Update</Text>
      
      {error && (
        <Alert color="red" title="Error" mb={10} withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert color="green" title="Success" mb={10} withCloseButton onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Stack gap="md">
        {isClient ? ( // Only render status display on client
          <Box>
            <Text size="sm" mb={5}>Current Status:</Text>
            <Box 
              p="xs" 
              style={{ 
                backgroundColor: currentStatusColor.bg,
                color: currentStatusColor.text,
                border: `1px solid ${currentStatusColor.border}`,
                borderRadius: '4px',
                display: 'inline-block',
                fontWeight: 500
              }}
            >
              {adminCurrentStatus}
            </Box>
          </Box>
        ) : (
          <Text size="sm" color="dimmed">Loading current status...</Text>
        )}
        
        <Select
          label="Select New Status"
          placeholder="Choose new status"
          data={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
          disabled={loading || !isClient}
          required
        />
        
        {showTrackingFields && (
          <>
            <Divider label="Tracking Information" labelPosition="center" />
            
            <TextInput
              label="Tracking URL"
              placeholder="https://example.com/tracking/..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              disabled={loading}
            />
            
            <TextInput
              label="Tracking ID/Number"
              placeholder="Enter tracking number"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              disabled={loading}
            />
          </>
        )}
        
        <TextInput
          label="Custom Message (Optional)"
          placeholder="Add a note for customer email"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          disabled={loading}
        />
        
        <Group justify="flex-end">
          <Button 
            onClick={handleUpdateStatus} 
            loading={loading}
            disabled={!selectedStatus || selectedStatus === adminCurrentStatus || !isClient}
          >
            Update Status
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default ManualStatusUpdate;
