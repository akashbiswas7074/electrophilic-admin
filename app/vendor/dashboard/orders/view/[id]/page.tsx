"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById } from "@/lib/database/actions/admin/orders/orders.actions";
import { mapWebsiteStatusToAdmin } from "@/lib/order-status-utils";
import {
  Container,
  Title,
  Text,
  Paper,
  Loader,
  Alert,
  Divider,
  SimpleGrid,
  Badge,
  Group,
  Button,
  Select,
  Table,
  Image,
  Anchor,
  Breadcrumbs,
  LoadingOverlay
} from "@mantine/core";
import { IconX, IconCircleCheck, IconShoppingCart, IconUser, IconTruckDelivery, IconCreditCard, IconListDetails, IconRefresh, IconArrowLeft, IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import OrderStatusBadge from '@/components/admin/orders/OrderStatusBadge';

// Define a more specific type for an order item if possible
interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: { url: string }[];
    price: number; // Assuming price is on the product snapshot in orderItem
    slug: string;
  };
  quantity: number;
  price: number; // Price at the time of order for this item
  size?: string;
  color?: string;
  status: string; // Status for this specific item
}

interface Order {
  _id: string;
  orderId: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
  products: any[]; // This might be a duplicate or admin-specific version of orderItems
  totalAmount: number;
  status: string; // Overall order status (website format)
  adminStatus?: string; // Store admin format status separately if needed
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  paymentId?: string;
  isPaid: boolean;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminOrderViewPage = () => {
  const params = useParams();
  const router = useRouter();
  // Ensure params and params.id are valid strings before using them
  const orderIdFromParams = params?.id;
  const orderId = Array.isArray(orderIdFromParams) ? orderIdFromParams[0] : orderIdFromParams;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(""); // Added state for selectedStatus
  const [isUpdating, setIsUpdating] = useState<boolean>(false); // Added state for isUpdating

  // Placeholder functions - Implement these based on your application logic
  const updateOverallOrderStatus = async (orderId: string, status: string, sendEmail: boolean) => {
    console.warn("updateOverallOrderStatus not implemented", { orderId, status, sendEmail });
    // Replace with your actual API call
    // Example: const response = await fetch(`/api/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status, sendEmail }) });
    // return await response.json();
    return { success: true, message: "Status updated (mocked)" };
  };

  const mapAdminStatusToWebsite = (adminStatus: string) => {
    console.warn("mapAdminStatusToWebsite not implemented", { adminStatus });
    // Replace with your actual mapping logic
    // Example: if (adminStatus === "Delivered") return "completed";
    return adminStatus.toLowerCase(); // Placeholder
  };

  const updateProductOrderStatus = async (orderId: string, productId: string, status: string, customMessage?: string, trackingUrl?: string, trackingId?: string) => {
    console.warn("updateProductOrderStatus not implemented", { orderId, productId, status, customMessage, trackingUrl, trackingId });
    // Replace with your actual API call for individual product status update
    return { success: true, message: "Product status updated (mocked)" };
  };

  const fetchOrderDetails = async () => {
    if (orderId) {
      setLoading(true);
      setError(null);
      try {
        const result = await getOrderById(orderId as string);
        if (result.success && result.order) {
          const fetchedOrder = result.order as Order;
          // The status from DB is likely website status, map it for admin display/select
          fetchedOrder.adminStatus = mapWebsiteStatusToAdmin(fetchedOrder.status);
          setOrder(fetchedOrder);
          setSelectedStatus(fetchedOrder.adminStatus); // Initialize select with current admin status
        } else {
          setError(result.message || "Failed to fetch order details.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching order details.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!order || !selectedStatus) return;
    setIsUpdating(true);
    setError(null);
    try {
      // Convert selected admin status to website status before sending to backend
      const websiteStatus = mapAdminStatusToWebsite(selectedStatus);
      const result = await updateOverallOrderStatus(order._id, websiteStatus, true); // Assuming sendEmail = true
      if (result.success) {
        // Refetch order details to show updated status
        await fetchOrderDetails(); 
        alert("Order status updated successfully!");
      } else {
        setError(result.message || "Failed to update order status.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && !order) { // Show main loader only if no order data is present yet
    return (
      <Container className="flex justify-center items-center h-[80vh]">
        <Loader size="xl" />
      </Container>
    );
  }

  if (error && !order) { // Show main error only if no order data could be fetched
    return (
      <Container>
        <Alert title="Error" color="red" icon={<IconX />} mt="lg">
          {error}
        </Alert>
         <Button onClick={() => router.back()} leftSection={<IconArrowLeft size={14} />} mt="md">
            Go Back
          </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container>
        <Text mt="lg">Order not found.</Text>
        <Button onClick={() => router.back()} leftSection={<IconArrowLeft size={14} />} mt="md">
            Go Back
        </Button>
      </Container>
    );
  }

  const breadcrumbItems = [
    { title: "Dashboard", href: "/admin/dashboard" },
    { title: "Orders", href: "/admin/dashboard/orders" },
    { title: `Order #${order.orderId}`, href: `/admin/dashboard/orders/view/${order._id}` },
  ].map((item, index) => (
    <Anchor component={Link} href={item.href} key={index}>
      {item.title}
    </Anchor>
  ));
  
  const orderStatusOptions = [
    "Not Processed",
    "Processing",
    "Confirmed", // Added Confirmed as it's a common status
    "Dispatched",
    "Delivered", // Mapped from "Completed" for user display
    "Cancelled",
  ].map(status => ({ value: status, label: status }));


  return (
    <Container fluid p="lg">
       <LoadingOverlay visible={loading || isUpdating} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Breadcrumbs mb="lg">{breadcrumbItems}</Breadcrumbs>
      <Paper p="xl" shadow="md" radius="md">
        <Group justify="space-between" align="flex-start" className="mb-6">
          <div>
            <Title order={1} className="mb-1">Order Details</Title>
            <Text c="dimmed">Order ID: {order.orderId} (DB ID: {order._id})</Text>
            <Text size="sm" c="dimmed">
              Placed on: {new Date(order.createdAt).toLocaleString()}
            </Text>
          </div>
          <Badge color={order.isPaid ? "green" : "red"} variant="light" size="lg">
            {order.isPaid ? "Paid" : "Not Paid"}
          </Badge>
        </Group>
        
        {error && ( // Display non-critical errors here
          <Alert title="Update Issue" color="red" icon={<IconX />} my="md" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Divider my="lg" />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="lg">
          <Paper withBorder p="md" radius="sm">
            <Title order={4} mb="sm" className="flex items-center"><IconUser size={20} className="mr-2"/>Customer Details</Title>
            <Text><strong>Name:</strong> {order.user?.name || "N/A"}</Text>
            <Text><strong>Email:</strong> {order.user?.email || "N/A"}</Text>
            <Text mt="xs"><strong>Shipping Address:</strong></Text>
            <Text>{order.shippingAddress.name}</Text>
            <Text>{order.shippingAddress.street}</Text>
            <Text>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</Text>
            <Text>{order.shippingAddress.country}</Text>
            <Text><strong>Phone:</strong> {order.shippingAddress.phone}</Text>
          </Paper>

          <Paper withBorder p="md" radius="sm">
            <Title order={4} mb="sm" className="flex items-center"><IconCreditCard size={20} className="mr-2"/>Payment & Status</Title>
            <Text><strong>Total Amount:</strong> ₹{order.totalAmount.toFixed(2)}</Text>
            <Text><strong>Payment Method:</strong> {order.paymentMethod}</Text>
            {order.paymentId && <Text><strong>Payment ID:</strong> {order.paymentId}</Text>}            <Text>
                <strong>Current Admin Status:</strong> 
                <Badge ml={5} color={
                  selectedStatus === "Delivered" ? "green" : 
                  selectedStatus === "Confirmed" ? "cyan" :
                  selectedStatus === "Cancelled" ? "red" : 
                  selectedStatus === "Dispatched" ? "indigo" : 
                  "blue"
                }>
                    {selectedStatus}
                </Badge>
            </Text>
             <Text>
                <strong>Current Website Status:</strong> 
                <Badge ml={5} color={
                  order.status === "delivered" ? "green" : 
                  order.status === "confirmed" ? "cyan" :
                  order.status === "shipped" ? "indigo" :
                  order.status === "cancelled" ? "red" : 
                  "blue"
                }>
                    {order.status}
                </Badge>
            </Text>
            {order.deliveredAt && <Text><strong>Delivered On:</strong> {new Date(order.deliveredAt).toLocaleDateString()}</Text>}
            
            <Group mt="md">
              <Select
                label="Update Order Status"
                placeholder="Select new status"
                data={orderStatusOptions}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value || "")}
                disabled={isUpdating}
              />
              <Button onClick={handleStatusUpdate} loading={isUpdating} disabled={!selectedStatus || selectedStatus === order.adminStatus} leftSection={<IconRefresh size={16}/>}>
                Update Status
              </Button>
            </Group>
          </Paper>
        </SimpleGrid>

        <Title order={3} mb="md" mt="xl" className="flex items-center"><IconShoppingCart size={24} className="mr-2"/>Order Items</Title>        <Group mb="lg">
          <Button 
            variant="outline" 
            color="amber" 
            leftSection={<IconAlertCircle size={16}/>}
            onClick={() => {
              // Check if there are any items with cancelRequested
              const items = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.products;
              const cancelRequests = items.filter(item => item.cancelRequested);
              if (cancelRequests.length > 0) {
                alert(`This order has ${cancelRequests.length} cancellation request(s). Look for items with amber indicators.`);
              } else {
                alert('No cancellation requests found in this order.');
              }
            }}
          >
            Check Cancellation Requests
          </Button>
        </Group>
        
        <Paper withBorder radius="sm" style={{overflowX: 'auto'}}>
          <Table striped highlightOnHover verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Product</Table.Th>
                <Table.Th>SKU/Details</Table.Th>
                <Table.Th>Unit Price</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Item Total</Table.Th>
                <Table.Th>Item Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.products).map((item: OrderItem | any) => (
                <Table.Tr key={item._id}>
                  <Table.Td>
                    <Group>
                      <Image src={item.product?.images?.[0]?.url || "/placeholder-image.png"} alt={item.product?.name || "Product Image"} width={50} height={50} fit="contain" radius="sm" />
                      <div>
                        <Anchor component={Link} href={`/admin/dashboard/product/view/${item.product?._id}`} size="sm" fw={500}>
                            {item.product?.name || "N/A"}
                        </Anchor>
                        {item.product?.slug && <Text size="xs" c="dimmed">Slug: {item.product.slug}</Text>}
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {item.size && <Text size="xs">Size: {item.size}</Text>}
                    {item.color && <Text size="xs">Color: {item.color}</Text>}
                    {/* You might want to display SKU from item.product.sku if available */}
                  </Table.Td>
                  <Table.Td>₹{item.price?.toFixed(2) || (item.product?.price?.toFixed(2) || "N/A")}</Table.Td>
                  <Table.Td>{item.quantity}</Table.Td>
                  <Table.Td>₹{(item.price * item.quantity).toFixed(2)}</Table.Td>                  <Table.Td>
                    <OrderStatusBadge 
                      status={item.status}
                      orderId={order._id}
                      productId={item._id}
                      onStatusChange={updateProductOrderStatus}
                      itemName={item.product?.name || "Product"}
                      cancelRequested={item.cancelRequested}
                      cancelReason={item.cancelReason}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
        {(!order.orderItems || order.orderItems.length === 0) && (!order.products || order.products.length === 0) && (
            <Text mt="md" c="dimmed">No items found in this order.</Text>
        )}
        
        <Divider my="xl" />
        <Group justify="space-between">
            <Button onClick={() => router.push('/admin/dashboard/orders')} leftSection={<IconArrowLeft size={14} />}>
                Back to Orders List
            </Button>
            <Text size="xs" c="dimmed">Last Updated: {new Date(order.updatedAt).toLocaleString()}</Text>
        </Group>
      </Paper>
    </Container>
  );
};

export default AdminOrderViewPage;

