"use client";
import React from "react"; // Added React import for React.use()
import { useEffect, useState } from "react";
import { getOrderDetailsById } from "@/lib/database/actions/admin/orders/orders.actions";
import { getSingleVendor } from "@/lib/database/actions/admin/vendor.actions"; // Added import for vendor actions
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

const OrderViewPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const { id: idFromParams } = React.use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorDetails, setVendorDetails] = useState<Record<string, any>>({});
  const [loadingVendors, setLoadingVendors] = useState(false);

  useEffect(() => {
    if (idFromParams) {
      const fetchOrder = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getOrderDetailsById(idFromParams as string);
          if (result && result.success) {
            setOrder(result.order);
            
            // Extract unique vendor IDs from order items
            const items = result.order.orderItems || result.order.products || [];
            const vendorIds = new Set<string>();
            
            items.forEach((item: any) => {
              const productInfo = item.product || item;
              let vendorId = null;
              
              // Extract vendor ID considering all possible formats
              if (productInfo.vendorId) {
                if (typeof productInfo.vendorId === 'object' && productInfo.vendorId._id) {
                  vendorId = productInfo.vendorId._id;
                } else if (typeof productInfo.vendorId === 'string') {
                  vendorId = productInfo.vendorId;
                }
              } else if (productInfo.vendor) {
                if (typeof productInfo.vendor === 'object' && productInfo.vendor._id) {
                  vendorId = productInfo.vendor._id;
                } else if (typeof productInfo.vendor === 'string') {
                  vendorId = productInfo.vendor;
                }
              }
              
              if (vendorId) {
                vendorIds.add(vendorId);
              }
            });
            
            // Fetch vendor details for each unique vendor ID
            if (vendorIds.size > 0) {
              await fetchVendorDetails(Array.from(vendorIds));
            }
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

  // Function to fetch vendor details
  const fetchVendorDetails = async (vendorIds: string[]) => {
    setLoadingVendors(true);
    const vendorDetailsMap: Record<string, any> = {};
    
    try {
      for (const vendorId of vendorIds) {
        try {
          const vendorResponse = await getSingleVendor(vendorId);
          if (vendorResponse && vendorResponse.success && vendorResponse.vendor) {
            vendorDetailsMap[vendorId] = vendorResponse.vendor;
          }
        } catch (vendorError) {
          console.error(`Failed to fetch details for vendor ${vendorId}:`, vendorError);
          // Still continue with other vendors even if one fails
        }
      }
      setVendorDetails(vendorDetailsMap);
    } catch (error) {
      console.error("Failed to fetch vendor details:", error);
    } finally {
      setLoadingVendors(false);
    }
  };

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
        
        {/* Extract vendor information */}
        {itemsToDisplay.length > 0 && (
          <>
            <Divider my="xl" />
            
            {/* Vendor Information Section */}
            <Title order={2} className="mb-4 flex items-center">
              <IconBuildingStore size={28} className="mr-2" /> Vendor Information
            </Title>
            
            {loadingVendors ? (
              <Group justify="center" py="lg">
                <Loader size="md" />
                <Text>Loading vendor information...</Text>
              </Group>
            ) : (
              <SimpleGrid cols={{ base: 1, md: Object.keys(vendorDetails).length > 1 ? 2 : 1 }} spacing="xl">
                {Object.entries(vendorDetails).map(([vendorId, vendorInfo]) => {
                  // Extract vendor properties with fallbacks
                  const vendorName = vendorInfo.businessName || vendorInfo.name || "N/A";
                  const vendorEmail = vendorInfo.email || "N/A";
                  const vendorPhone = vendorInfo.phoneNumber || "N/A";
                  const vendorDescription = vendorInfo.description || "N/A";
                  const vendorZipCode = vendorInfo.zipCode || "N/A";
                  const vendorAddress = vendorInfo.address || "N/A";
                  const vendorCity = vendorInfo.city || "N/A";
                  const vendorState = vendorInfo.state || "N/A";
                  const vendorCountry = vendorInfo.country || "N/A";
                  const vendorRole = vendorInfo.role || "vendor";
                  const vendorVerified = vendorInfo.verified ? "Verified" : "Not Verified";
                  const vendorCreatedAt = vendorInfo.createdAt 
                    ? new Date(vendorInfo.createdAt).toLocaleDateString() 
                    : "N/A";
                  
                  return (
                    <Card key={`vendor-${vendorId}`} shadow="sm" padding="lg" radius="md" withBorder>
                      <Title order={3} className="mb-4 flex items-center">
                        <IconBuildingStore size={24} className="mr-2" /> 
                        {vendorName !== "N/A" ? vendorName : `Vendor ID: ${vendorId}`}
                        {vendorVerified === "Verified" && (
                          <Badge ml="xs" color="green" variant="light">Verified</Badge>
                        )}
                      </Title>
                      
                      {vendorEmail !== "N/A" && (
                        <Text className="mb-2 flex items-center">
                          <IconMail size={16} className="mr-2" /> <strong>Email:</strong> {vendorEmail}
                        </Text>
                      )}
                      
                      {vendorPhone !== "N/A" && (
                        <Text className="mb-2 flex items-center">
                          <IconPhone size={16} className="mr-2" /> <strong>Phone:</strong> {vendorPhone}
                        </Text>
                      )}
                      
                      {vendorRole !== "N/A" && (
                        <Text className="mb-2 flex items-center">
                          <IconUserCircle size={16} className="mr-2" /> <strong>Role:</strong> {vendorRole}
                        </Text>
                      )}
                      
                      {/* Show full address with all available details */}
                      {(vendorAddress !== "N/A" || vendorCity !== "N/A" || vendorState !== "N/A") && (
                        <Text className="mb-2 flex items-start">
                          <IconMapPin size={16} className="mr-2 mt-1" /> <strong>Address:</strong> {' '}
                          <span>
                            {vendorAddress !== "N/A" && vendorAddress}
                            {vendorCity !== "N/A" && (vendorAddress !== "N/A" ? `, ${vendorCity}` : vendorCity)}
                            {vendorState !== "N/A" && (
                              (vendorAddress !== "N/A" || vendorCity !== "N/A") ? `, ${vendorState}` : vendorState
                            )}
                            {vendorZipCode !== "N/A" && ` - ${vendorZipCode}`}
                            {vendorCountry !== "N/A" && `, ${vendorCountry}`}
                          </span>
                        </Text>
                      )}
                      
                      {vendorDescription !== "N/A" && (
                        <Text className="mb-2 flex items-start">
                          <IconFileDescription size={16} className="mr-2 mt-1" /> <strong>Description:</strong> {vendorDescription}
                        </Text>
                      )}
                      
                      {vendorCreatedAt !== "N/A" && (
                        <Text className="mb-2 flex items-center">
                          <IconCalendarEvent size={16} className="mr-2" /> <strong>Since:</strong> {vendorCreatedAt}
                        </Text>
                      )}
                      
                      <Button 
                        size="xs" 
                        variant="outline" 
                        component={Link}
                        href={`/admin/dashboard/vendors/view/${vendorId}`}
                        className="mt-2"
                      >
                        View Full Profile
                      </Button>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </>
        )}

        <Divider my="lg" />

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
                <Table.Th>Vendor</Table.Th>
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
                
                // Improved vendor info extraction
                let vendorId = null;
                let vendorName = "N/A";
                let vendorEmail = "N/A";
                let vendorPhone = "N/A";
                let vendorAddress = "N/A";
                let vendorDescription = "N/A";
                
                // First try to get vendor from our fetched details
                if (productInfo.vendorId) {
                  if (typeof productInfo.vendorId === 'object' && productInfo.vendorId._id) {
                    vendorId = productInfo.vendorId._id;
                  } else if (typeof productInfo.vendorId === 'string') {
                    vendorId = productInfo.vendorId;
                  }
                } else if (productInfo.vendor) {
                  if (typeof productInfo.vendor === 'object' && productInfo.vendor._id) {
                    vendorId = productInfo.vendor._id;
                  } else if (typeof productInfo.vendor === 'string') {
                    vendorId = productInfo.vendor;
                  }
                }
                
                // Get vendor data from our cached details
                if (vendorId && vendorDetails[vendorId]) {
                  const vendorInfo = vendorDetails[vendorId];
                  vendorName = vendorInfo.businessName || vendorInfo.name || "N/A";
                  vendorEmail = vendorInfo.email || "N/A";
                  vendorPhone = vendorInfo.phoneNumber || "N/A";
                  vendorAddress = vendorInfo.address || "N/A";
                  vendorDescription = vendorInfo.description || "N/A";
                }
                // Fallback to embedded data
                else if (productInfo.vendorId && typeof productInfo.vendorId === 'object') {
                  const vendorInfo = productInfo.vendorId;
                  vendorName = vendorInfo.businessName || vendorInfo.name || "N/A";
                  vendorEmail = vendorInfo.email || "N/A";
                  vendorPhone = vendorInfo.phoneNumber || "N/A";
                  vendorAddress = vendorInfo.address || "N/A";
                  vendorDescription = vendorInfo.description || "N/A";
                }
                else if (productInfo.vendor && typeof productInfo.vendor === 'object') {
                  const vendorInfo = productInfo.vendor;
                  vendorName = vendorInfo.businessName || vendorInfo.name || "N/A";
                  vendorEmail = vendorInfo.email || "N/A";
                  vendorPhone = vendorInfo.phoneNumber || "N/A";
                  vendorAddress = vendorInfo.address || "N/A";
                  vendorDescription = vendorInfo.description || "N/A";
                }
                
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
                    <Table.Td>
                      <div className="flex flex-col">
                        <Text fw={500}>{vendorName}</Text>
                        {vendorEmail !== "N/A" && (
                          <Text size="xs" c="dimmed" className="flex items-center">
                            <IconMail size={12} className="mr-1" /> {vendorEmail}
                          </Text>
                        )}
                        {vendorPhone !== "N/A" && (
                          <Text size="xs" c="dimmed" className="flex items-center">
                            <IconPhone size={12} className="mr-1" /> {vendorPhone}
                          </Text>
                        )}
                        {vendorAddress !== "N/A" && (
                          <Text size="xs" c="dimmed" className="flex items-center">
                            <IconMapPin size={12} className="mr-1" /> {vendorAddress}
                          </Text>
                        )}
                        {vendorDescription !== "N/A" && (
                          <Text size="xs" c="dimmed" className="flex items-center truncate max-w-[150px]" title={vendorDescription}>
                            <IconFileDescription size={12} className="mr-1" /> {vendorDescription}
                          </Text>
                        )}
                      </div>
                    </Table.Td>
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