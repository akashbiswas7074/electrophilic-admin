import React, { useState } from 'react';
import { Badge, ActionIcon, Group, Tooltip, Indicator } from '@mantine/core';
import { IconPencil, IconAlertCircle } from '@tabler/icons-react';
import OrderStatusChangePopup from './OrderStatusChangePopup';

interface OrderStatusBadgeProps {
  status: string;
  orderId: string;
  productId: string;
  onStatusChange: (
    orderId: string,
    productId: string,
    newStatus: string,
    trackingUrl?: string,
    trackingId?: string,
    customMessage?: string
  ) => Promise<any>;
  itemName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  cancelRequested?: boolean;
  cancelReason?: string;
}

const OrderStatusBadge = ({
  status,
  orderId,
  productId,
  onStatusChange,
  itemName,
  size = 'md',
  cancelRequested,
  cancelReason
}: OrderStatusBadgeProps) => {
  const [popupOpen, setPopupOpen] = useState(false);

  // Determine badge color based on status
  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'Not Processed':
        return 'gray';
      case 'Processing':
        return 'blue';
      case 'Confirmed':
        return 'cyan';
      case 'Dispatched':
        return 'indigo';
      case 'Delivered':
        return 'teal';
      case 'Completed':
        return 'green';
      case 'Cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <>
      <Group gap="xs" wrap="nowrap">
        {cancelRequested ? (
          <Tooltip label={`Customer requested cancellation: ${cancelReason || 'No reason provided'}`} multiline w={220}>
            <Indicator color="amber" position="top-start" processing withBorder size={8}>
              <Badge 
                color={getBadgeColor(status)} 
                variant="light" 
                size={size}
              >
                {status}
              </Badge>
            </Indicator>
          </Tooltip>
        ) : (
          <Badge 
            color={getBadgeColor(status)} 
            variant="light" 
            size={size}
          >
            {status}
          </Badge>
        )}
        <Tooltip label="Change status">
          <ActionIcon 
            size="sm" 
            variant="subtle" 
            onClick={() => setPopupOpen(true)}
            color="gray"
          >
            <IconPencil size={14} />
          </ActionIcon>
        </Tooltip>
        {cancelRequested && (
          <Tooltip label="Cancellation requested">
            <ActionIcon size="sm" variant="subtle" color="amber">
              <IconAlertCircle size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>      <OrderStatusChangePopup
        opened={popupOpen}
        onClose={() => setPopupOpen(false)}
        orderId={orderId}
        productId={productId}
        currentStatus={status}
        onStatusChange={onStatusChange}
        itemName={itemName}
        cancelRequested={cancelRequested}
        cancelReason={cancelReason}
      />
    </>
  );
};

export default OrderStatusBadge;
