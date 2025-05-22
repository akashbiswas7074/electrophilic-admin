import React, { useState, useEffect } from 'react';
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
  Badge,
  Paper
} from '@mantine/core';
import { IconAlertCircle, IconTruckDelivery, IconCheck, IconCalendar } from '@tabler/icons-react';

interface OrderStatusChangePopupProps {
  opened: boolean;
  onClose: () => void;
  orderId: string;
  productId: string;
  currentStatus: string;
  onStatusChange: (
    orderId: string,
    productId: string,
    newStatus: string,
    trackingUrl?: string,
    trackingId?: string,
    customMessage?: string
  ) => Promise<any>;
  itemName?: string;
  cancelRequested?: boolean;
  cancelReason?: string;
  cancelRequestedAt?: Date;
}

const OrderStatusChangePopup = ({
  opened,
  onClose,
  orderId,
  productId,
  currentStatus,
  onStatusChange,
  itemName = 'Product',
  cancelRequested = false,
  cancelReason = '',
  cancelRequestedAt
}: OrderStatusChangePopupProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(currentStatus);
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [trackingId, setTrackingId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If there's a cancellation request, pre-select "Cancelled" status
  useEffect(() => {
    if (cancelRequested && opened) {
      setSelectedStatus('Cancelled');
      if (cancelReason) {
        setCustomMessage(`Cancellation approved as requested by customer. Reason: ${cancelReason}`);
      }
    }
  }, [cancelRequested, cancelReason, opened]);

  const statusOptions = [
    { value: 'Not Processed', label: 'Not Processed' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Dispatched', label: 'Dispatched' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Completed', label: 'Completed' },
  ];

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await onStatusChange(
        orderId,
        productId,
        selectedStatus,
        trackingUrl || undefined,
        trackingId || undefined,
        customMessage || undefined
      );
      
      if (result.success) {
        setSuccess(`Status successfully updated to ${selectedStatus}`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating status');
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

  // When modal closes, reset form
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const showTrackingFields = selectedStatus === 'Confirmed';
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Update Order Status"
      centered
      overlayProps={{ blur: 3 }}
    >
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

      <Stack gap="md">        <Text size="sm" fw={500}>
          Updating status for: {itemName}
        </Text>

        {cancelRequested && (
          <Paper withBorder p="md" radius="md" bg="amber.0">
            <Group align="flex-start">
              <IconAlertCircle size={20} color="orange" />
              <div>
                <Text fw={600} size="sm">Customer Requested Cancellation</Text>
                <Text size="sm" c="dimmed" mb={10}>
                  Reason: {cancelReason || 'No reason provided'}
                </Text>
                {cancelRequestedAt && (
                  <Group gap="xs">
                    <IconCalendar size={14} />
                    <Text size="xs">
                      Requested on: {new Date(cancelRequestedAt).toLocaleString()}
                    </Text>
                  </Group>
                )}
              </div>
              <Badge color="amber">Pending</Badge>
            </Group>
          </Paper>
        )}
        
        <Select
          label="Select New Status"
          placeholder="Choose a status"
          data={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
          required
          searchable
          mb="xs"
        />

        {showTrackingFields && (
          <>
            <Divider label="Tracking Information" labelPosition="center" />
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
          placeholder="Add a note to be included in the customer email"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
        />        <Group justify="space-between" mt="lg">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedStatus || selectedStatus === currentStatus || loading}
            color="blue"
          >
            Update Status
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default OrderStatusChangePopup;
