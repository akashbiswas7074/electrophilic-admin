import React, { useState } from 'react';
import { Badge, ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import StatusChangePopup from '@/components/admin/orders/StatusChangePopup';

interface StatusCellProps {
  status: string;
  orderId: string;
  productId: string;
  onStatusChange: () => void;
}

const StatusCell: React.FC<StatusCellProps> = ({ status, orderId, productId, onStatusChange }) => {
  const [popupOpened, setPopupOpened] = useState(false);

  // Determine badge color based on status
  const getBadgeColor = () => {
    switch (status) {
      case 'processing':
      case 'Processing':
        return 'blue';
      case 'confirmed':
      case 'Confirmed':
        return 'cyan';
      case 'dispatched':
      case 'Dispatched':
        return 'indigo';
      case 'delivered':
      case 'Delivered':
      case 'completed':
      case 'Completed':
        return 'green';
      case 'cancelled':
      case 'Cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleStatusChanged = () => {
    if (onStatusChange) {
      onStatusChange();
    }
  };

  return (
    <>
      <Group gap={5}>
        <Badge 
          color={getBadgeColor()} 
          variant="light"
          style={{ cursor: 'pointer' }}
          onClick={() => setPopupOpened(true)}
        >
          {status}
        </Badge>
        <Tooltip label="Edit status">
          <ActionIcon size="xs" onClick={() => setPopupOpened(true)}>
            <IconEdit size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <StatusChangePopup
        opened={popupOpened}
        onClose={() => setPopupOpened(false)}
        orderId={orderId}
        productId={productId}
        currentStatus={status}
        onStatusChanged={handleStatusChanged}
      />
    </>
  );
};

export default StatusCell;
