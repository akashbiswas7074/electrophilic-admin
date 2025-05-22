import React from 'react';
import { Select, Chip, Badge, Box } from '@mantine/core';
import { getOrderStatusOptions, getStatusColor } from '@/lib/utils/order-status';

interface StatusSelectorProps {
  currentStatus: string;
  onChange: (status: string) => void;
  disabled?: boolean;
  showBadge?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const StatusSelector: React.FC<StatusSelectorProps> = ({
  currentStatus,
  onChange,
  disabled = false,
  showBadge = true,
  size = 'sm'
}) => {
  const statusOptions = getOrderStatusOptions();
  const statusColor = getStatusColor(currentStatus);
  
  return (
    <Box>
      {showBadge && (
        <Badge
          mb="xs"
          style={{
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            border: `1px solid ${statusColor.border}`
          }}
        >
          {currentStatus}
        </Badge>
      )}
      
      <Select
        data={statusOptions}
        value={currentStatus}
        onChange={(value) => onChange(value || '')}
        disabled={disabled}
        placeholder="Select Status"
        size={size}
        clearable={false}
      />
    </Box>
  );
};

export default StatusSelector;
