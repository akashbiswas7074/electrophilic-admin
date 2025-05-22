"use client";
import { useEffect, useState } from "react";
import { getOrderDetailsById } from "@/lib/database/actions/admin/orders/orders.actions"; // Updated import
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Image,
  Badge,
  Group,
  Paper,
  Loader,
  Alert,
  Divider,
  List,
  ThemeIcon,
  Accordion,
  Table, // For displaying order items
  Button, // For actions
  Card, // For better layout sections
} from "@mantine/core";
import {
  IconCircleCheck,
  IconX,
  IconReceipt,
  IconUserCircle,
  IconCalendarEvent,
  IconTruckDelivery,
  IconShoppingCart,
  IconCurrencyRupee, // For Indian Rupee symbol
  IconMapPin,
  IconMail,
  IconPhone,
  IconFileDescription,
  IconInfoCircle,
  IconListDetails,
  IconBuildingStore,
  IconLink
} from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation"; // Added useRouter
import Link from "next/link"; // For linking to product pages

const OrderViewPage = () => {
  const params = useParams();
  const router = useRouter(); // Initialize router
  const idFromParams = params?.id;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderId = Array.isArray(idFromParams) ? idFromParams[0] : idFromParams;
    if (orderId) {
      const fetchOrder = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getOrderDetailsById(orderId as string);
          if (result && result.success) {
            setOrder(result.order);
          } else {
            setError(result?.message || "Failed to fetch order details.");
          }
        } catch (err: any) {
          setError(
            err.message || "An error occurred while fetching order details."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [idFromParams]);

  if (loading) {
    return (
      <Container className="flex justify-center items-center h-[80vh]">
        <Loader size="xl" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert title="Error" color="red" icon={<IconX />}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container>
        <Text>Order not found.</Text>
      </Container>
    );
  }

  const itemsToDisplay = order.orderItems || order.products || [];
  const shippingAddress = order.shippingAddress || order.deliveryAddress;

  return (
    <Container fluid p="lg">
      <Paper p="xl" shadow="md" radius="md">
        <Group justify="space-between" align="flex-start" className="mb-6">
          <div>
            <Title order={1} className="mb-1 flex items-center">
              <IconReceipt size={32} className="mr-2" /> Order Details
            </Title>
            <Text c="dimmed">Order ID: {order._id}</Text>
          </div>
          <Badge
            color={order.isPaid ? "green" : "red"}
            variant="light"
            size="lg"
          >
            {order.isPaid ? "Paid" : "Not Paid"}
          </Badge>
        </Group>

        <Divider my="lg" />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {/* Customer & Order Info Section */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} className="mb-4 flex items-center">
              <IconUserCircle size={24} className="mr-2" /> Customer & Order Info
            </Title>
            {order.user && (
              <>
                <Text className="mb-1">
                  <strong>Customer:</strong> {order.user.name || "N/A"}
                </Text>
                <Text className="mb-1 flex items-center">
                  <IconMail size={16} className="mr-2" /> {order.user.email || "N/A"}
                </Text>
                {order.user.image && (
                  <Image
                    src={order.user.image}
                    alt={order.user.name || "User"}
                    radius="sm"
                    w={80}
                    h={80}
                    fit="cover"
                    className="my-2"
                  />
                )}
                <Divider my="sm" />
              </>
            )}
            <Text className="mb-1 flex items-center">
              <IconCalendarEvent size={16} className="mr-2" />
              <strong>Order Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </Text>
            <Text className="mb-1 flex items-center">
              <IconTruckDelivery size={16} className="mr-2" />
              <strong>Order Status:</strong>{" "}
              <Badge color="blue" variant="light" ml={5}>
                {order.status || "N/A"}
              </Badge>
            </Text>
            <Text className="mb-1 flex items-center">
              <IconCurrencyRupee size={16} className="mr-2" />
              <strong>Payment Method:</strong> {order.paymentMethod || "N/A"}
            </Text>
            <Text className="mb-1 flex items-center">
              <IconCurrencyRupee size={16} className="mr-2" />
              <strong>Total Amount:</strong> ₹
              {(order.totalAmount ?? order.total)?.toFixed(2) || "0.00"}
            </Text>
            {order.couponApplied && (
              <Text className="mb-1">
                <strong>Coupon:</strong> {order.couponApplied}
              </Text>
            )}
             <Text className="mb-1 flex items-center">
              <IconInfoCircle size={16} className="mr-2" />
              <strong>Is New Order:</strong> {order.isNew ? "Yes" : "No"}
            </Text>
            {order.deliveredAt && (
                 <Text className="mb-1 flex items-center">
                    <IconCircleCheck size={16} className="mr-2 text-green-500" />
                    <strong>Delivered At:</strong> {new Date(order.deliveredAt).toLocaleString()}
                </Text>
            )}
          </Card>

          {/* Shipping Address Section */}
          {shippingAddress && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} className="mb-4 flex items-center">
                <IconMapPin size={24} className="mr-2" /> Shipping Address
              </Title>
              <Text>
                {shippingAddress.firstName} {shippingAddress.lastName}
              </Text>
              <Text>{shippingAddress.address1}</Text>
              {shippingAddress.address2 && <Text>{shippingAddress.address2}</Text>}
              <Text>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              </Text>
              <Text>{shippingAddress.country}</Text>
              {shippingAddress.phoneNumber && (
                <Text className="mt-1 flex items-center">
                  <IconPhone size={16} className="mr-2" /> {shippingAddress.phoneNumber}
                </Text>
              )}
            </Card>
          )}
        </SimpleGrid>

        <Divider my="xl" />

        {/* Order Items Section */}
        <Title order={2} className="mb-4 flex items-center">
          <IconShoppingCart size={28} className="mr-2" /> Order Items ({itemsToDisplay.length})
        </Title>
        {itemsToDisplay.length > 0 ? (
          <Table highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Image</Table.Th>
                <Table.Th>Product Name</Table.Th>
                <Table.Th>SKU</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Tracking</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {itemsToDisplay.map((item: any, index: number) => {
                const productInfo = item.product || item; // Handle both populated and direct product info
                const itemTotal = (item.qty || 1) * (item.price || 0);
                return (
                  <Table.Tr key={item._id || index}>
                    <Table.Td>
                      <Image
                        src={productInfo.images?.[0]?.url || item.image || "/placeholder-image.jpg"}
                        alt={productInfo.name || "Product"}
                        radius="sm"
                        w={60}
                        h={60}
                        fit="contain"
                      />
                    </Table.Td>
                    <Table.Td>{productInfo.name || "N/A"}</Table.Td>
                    <Table.Td>{productInfo.sku || item.sku || "N/A"}</Table.Td>
                    <Table.Td>{item.size || "N/A"}</Table.Td>
                    <Table.Td>{item.qty || 1}</Table.Td>
                    <Table.Td>₹{(item.price || 0).toFixed(2)}</Table.Td>
                    <Table.Td>₹{itemTotal.toFixed(2)}</Table.Td>
                    <Table.Td>
                      <Badge color="orange" variant="light">
                        {item.status || "Not Processed"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                        {item.trackingUrl && <Link href={item.trackingUrl} target="_blank" passHref><Button size="xs" variant="outline" leftSection={<IconLink size={14}/>}>Track</Button></Link>}
                        {item.trackingId && <Text size="xs" c="dimmed" mt={4}>ID: {item.trackingId}</Text>}
                        {!item.trackingUrl && !item.trackingId && <Text size="xs" c="dimmed">N/A</Text>}
                    </Table.Td>
                    <Table.Td>
                      {productInfo.slug && (
                        <Link href={`/admin/dashboard/product/view/${productInfo._id || item.product?._id || item.productId}`} passHref>
                          <Button size="xs" variant="outline" leftSection={<IconBuildingStore size={14}/>}>
                            View Product
                          </Button>
                        </Link>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed">No items found in this order.</Text>
        )}

        <Divider my="lg" />

        <Group justify="flex-end" className="mt-6">
          <Button onClick={() => router.back()} variant="default">
            Back to Orders
          </Button>
          <Text size="xs" c="dimmed">
            Last Updated: {new Date(order.updatedAt).toLocaleString()}
          </Text>
        </Group>
      </Paper>
    </Container>
  );
};

export default OrderViewPage;