"use client";

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Button,
  Stack,
  Card,
  Divider,
  Loader,
  Alert,
  Select,
} from '@mantine/core';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { IconAlertCircle, IconCheck, IconClockHour4, IconFileSearch, IconX } from '@tabler/icons-react';
import Link from 'next/link';

interface CancellationRequest {
  _id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  reason: string;
  requestedAt: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
}

export default function CancellationRequestsPage() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'pending', 'approved', 'rejected'
  
  const fetchCancellationRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/orders/cancellation-requests');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cancellation requests');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests);
      } else {
        throw new Error(data.message || 'Failed to fetch cancellation requests');
      }
    } catch (err: any) {
      console.error('Error fetching cancellation requests:', err);
      setError(err.message || 'An error occurred while fetching cancellation requests');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCancellationRequests();
  }, []);
    const handleApprove = async (orderId: string, productId: string) => {
    if (window.confirm('Are you sure you want to approve this cancellation request? This will cancel the product.')) {      try {
        console.log('Approving cancellation request:', orderId, productId);
        const requestBody = {
          orderId,
          productId,
          status: 'Cancelled',
          message: 'Your cancellation request has been approved.'
        };
        console.log('Request body:', requestBody);
        
        const response = await fetch('/api/admin/orders/cancellation-requests', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error('Failed to approve cancellation request');
        }
        
        // Refresh the list after approval
        fetchCancellationRequests();
        alert('Cancellation request approved successfully');
        
      } catch (err: any) {
        console.error('Error approving cancellation request:', err);
        alert(`Failed to approve cancellation: ${err.message}`);
      }
    }
  };
    const handleReject = async (orderId: string, productId: string) => {
    if (window.confirm('Are you sure you want to reject this cancellation request?')) {
      try {
        console.log('Rejecting cancellation request:', orderId, productId);
        const requestBody = {
          orderId,
          productId,
          customMessage: 'Your cancellation request could not be approved at this time.'
        };
        console.log('Request body for rejection:', requestBody);
        
        const response = await fetch('/api/admin/orders/reject-cancellation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });        const result = await response.json();
        console.log('Rejection response:', result);
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to reject cancellation request');
        }
        
        // Refresh the list after rejection
        fetchCancellationRequests();
        alert(result.message || 'Cancellation request rejected successfully');
        
      } catch (err: any) {
        console.error('Error rejecting cancellation request:', err);
        alert(`Failed to reject cancellation: ${err.message}`);
      }
    }
  };
  
  // Filter requests based on the selected filter
  const filteredRequests = filter === 'all' 
    ? requests 
    : filter === 'pending' 
      ? requests.filter(req => req.status !== 'Cancelled' && req.status !== 'Rejected') 
      : filter === 'approved' 
        ? requests.filter(req => req.status === 'Cancelled')
        : requests.filter(req => req.status === 'Rejected');
  
  return (
    <div className="p-4">
      <Paper withBorder p="md" radius="md">
        <Title order={2} mb="md">Cancellation Requests</Title>
        
        {error && (
          <Alert color="red" title="Error" mb="md" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}
        
        <Group mb="md" justify="space-between">
          <Text size="sm" color="dimmed">
            Manage customer cancellation requests for orders
          </Text>
          
          <Select
            label="Filter by status"
            value={filter}
            onChange={(value) => setFilter(value || 'all')}
            data={[
              { value: 'all', label: 'All Requests' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]}
            style={{ width: 200 }}
          />
        </Group>
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader size="lg" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Alert color="blue" title="No Requests" icon={<IconFileSearch size={16} />}>
            No cancellation requests found.
          </Alert>
        ) : (
          <>
            {/* Desktop view */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <Link href={`/admin/dashboard/orders/view/${request.orderId}`} className="text-blue-600 hover:underline">
                          {request.orderNumber || request.orderId.substring(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>{request.productName}</TableCell>
                      <TableCell>
                        <div>
                          <div>{request.user.name}</div>
                          <div className="text-xs text-gray-500">{request.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={request.reason}>
                        {request.reason}
                      </TableCell>
                      <TableCell>{new Date(request.requestedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          color={
                            request.status === 'Cancelled' ? 'green' :
                            request.status === 'Rejected' ? 'red' : 'yellow'
                          }
                        >
                          {request.status === 'Cancelled' ? 'Approved' : 
                           request.status === 'Rejected' ? 'Rejected' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Group gap={8}>
                          {request.status !== 'Cancelled' && request.status !== 'Rejected' && (
                            <>
                              <Button 
                                size="xs" 
                                color="green"
                                leftSection={<IconCheck size={16} />}
                                onClick={() => handleApprove(request.orderId, request.productId)}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="xs" 
                                color="red"
                                leftSection={<IconX size={16} />}
                                onClick={() => handleReject(request.orderId, request.productId)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Link href={`/admin/dashboard/orders/view/${request.orderId}`} passHref>
                            <Button component="a" size="xs" variant="outline">View Order</Button>
                          </Link>
                        </Group>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Mobile view */}
            <div className="md:hidden space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request._id} withBorder p="sm" radius="md">
                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>Order #{request.orderNumber || request.orderId.substring(0, 8)}</Text>
                    <Badge 
                      color={
                        request.status === 'Cancelled' ? 'green' :
                        request.status === 'Rejected' ? 'red' : 'yellow'
                      }
                    >
                      {request.status === 'Cancelled' ? 'Approved' : 
                       request.status === 'Rejected' ? 'Rejected' : 'Pending'}
                    </Badge>
                  </Group>
                  
                  <Stack gap="xs">
                    <Text size="sm"><b>Product:</b> {request.productName}</Text>
                    <Text size="sm"><b>Customer:</b> {request.user.name}</Text>
                    <Text size="sm"><b>Reason:</b> {request.reason}</Text>
                    <Group gap={4} align="center">
                      <IconClockHour4 size={14} />
                      <Text size="xs" color="dimmed">
                        Requested on: {new Date(request.requestedAt).toLocaleString()}
                      </Text>
                    </Group>
                  </Stack>
                  
                  <Divider my="sm" />
                  
                  <Group justify="flex-end" gap={8}>
                    {request.status !== 'Cancelled' && request.status !== 'Rejected' && (
                      <>
                        <Button 
                          size="xs" 
                          color="green"
                          leftSection={<IconCheck size={16} />}
                          onClick={() => handleApprove(request.orderId, request.productId)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="xs" 
                          color="red"
                          leftSection={<IconX size={16} />}
                          onClick={() => handleReject(request.orderId, request.productId)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Link href={`/admin/dashboard/orders/view/${request.orderId}`} passHref>
                      <Button component="a" size="xs" variant="outline">View Order</Button>
                    </Link>
                  </Group>
                </Card>
              ))}
            </div>
          </>
        )}
      </Paper>
    </div>
  );
}
