import React, { useState } from 'react';
import {
  Modal,
  Select,
  Button,
  Group,
  TextInput,
  Text,
  Stack,
  Divider,
  Alert,
  Box
} from '@mantine/core';
import { IconAlertCircle, IconTruckDelivery, IconCheck } from '@tabler/icons-react';
import axios from 'axios';

interface StatusChangePopupProps {
  opened: boolean;
  onClose: () => void;
  orderId: string;
  productId: string;
  currentStatus: string;
  onStatusChanged?: (newStatus: string) => void;
  orderItemName?: string;
}

const StatusChangePopup = ({
  opened,
  onClose,
  orderId,
  productId,
  currentStatus,
  onStatusChanged,
  orderItemName = 'Order Item'
}: StatusChangePopupProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(currentStatus);
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [trackingId, setTrackingId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const statusOptions = [
    { value: 'Not Processed', label: 'Not Processed' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Dispatched', label: 'Dispatched' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Completed', label: 'Completed' },
  ];

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post('/api/admin/orders/status', {
        orderId,
        productId,
        status: selectedStatus,
        trackingUrl: trackingUrl || undefined,
        trackingId: trackingId || undefined,
        customMessage: customMessage || undefined
      });
      
      if (response.data.success) {
        setSuccess(`Status successfully updated to ${selectedStatus}`);
        if (onStatusChanged) {
          onStatusChanged(selectedStatus);
        }
        setTimeout(() => {
          onClose();
          // Wait for the modal to close before resetting form
          setTimeout(resetForm, 300);
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while updating status');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStatus(currentStatus);
    setTrackingUrl('');
    setTrackingId('');
    setCustomMessage('');
    setError(null);
    setSuccess(null);
  };

  // Reset form when modal is opened
  React.useEffect(() => {
    if (opened) {
      resetForm();
    }
  }, [opened, currentStatus]);

  const showTrackingFields = selectedStatus === 'Confirmed';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Update Order Status</Text>}
      size="md"
      centered
    >
      <Box p="xs">
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Error" 
            color="red" 
            mb="md" 
            withCloseButton 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            icon={<IconCheck size={16} />} 
            title="Success" 
            color="green" 
            mb="md"
          >
            {success}
          </Alert>
        )}

        <Text size="sm" mb="xs">
          Current Status: <Text span fw={500} color={currentStatus === 'Cancelled' ? 'red' : 'blue'}>{currentStatus}</Text>
        </Text>
        
        <Text size="sm" mb="sm">
          Order ID: <Text span fw={500}>{orderId}</Text>
        </Text>
        
        <Text size="sm" mb="sm" color="dimmed">
          {orderItemName}
        </Text>

        <Stack gap="md">
          <Select
            label="Select New Status"
            placeholder="Choose a status"
            data={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            required
            searchable
          />

          {showTrackingFields && (
            <>
              <Divider label="Tracking Information" labelPosition="center" mb="xs" />
              
              <TextInput
                label="Tracking URL"
                placeholder="https://example.com/tracking/..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                leftSection={<IconTruckDelivery size={16} />}
              />
              
              <TextInput
                label="Tracking ID/Number"
                placeholder="Enter tracking number"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
            </>
          )}

          <TextInput
            label="Custom Message (Optional)"
            placeholder="Add a note for customer email"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            loading={loading}
            disabled={!selectedStatus || selectedStatus === currentStatus}
            color="blue"
          >
            Update Status
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};

export default StatusChangePopup;
