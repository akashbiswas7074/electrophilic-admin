"use client";

import AllOrdersTable from "@/components/admin/dashboard/orders/data-table";
import { useEffect, useState } from "react";
import axios from "axios";
import { Grid, Card, CardContent, Typography, Box, Dialog, DialogTitle, DialogContent, Button as MuiButton, List, ListItem, ListItemText, ListItemButton, DialogActions, MenuItem, Select, FormControl, InputLabel, FormHelperText } from "@mui/material";
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  ThumbUpAlt,
  Close,
} from "@mui/icons-material";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MobileDataView, MobileDataViewHeader, MobileDataCard, MobileDataItem, MobileActionBar } from "@/components/ui/mobile-data-view";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilterX, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const OrdersPage = () => {
  type DateRange =
    | "today"
    | "yesterday"
    | "2d"
    | "7d"
    | "15d"
    | "30d"
    | "2m"
    | "5m"
    | "10m"
    | "12m"
    | "all"
    | "today_and_yesterday";
  type PaymentStatus = "paid" | "unPaid" | "-";
  type PaymentMethod = "cash" | "RazorPay" | "-";

  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("all");
  const [isPaid, setIsPaid] = useState<PaymentStatus>("-");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("-");
  const [vendorFilter, setVendorFilter] = useState<string>(""); // Add vendor filter state

  const [orderStats, setOrderStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    confirmed: 0, // Ensure this is present
    dispatched: 0,
    cancelled: 0,
    notProcessed: 0,
    totalSales: 0,
  });
    // Dialog state for processing orders
  const [processingDialog, setProcessingDialog] = useState(false);
  const [processingOrders, setProcessingOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [processingLoading, setProcessingLoading] = useState(false);
  const [statusChangeMode, setStatusChangeMode] = useState<'order' | 'product'>('order'); // Default to order-level status change
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/admin/orders?range=${range}&isPaid=${isPaid}&paymentMethod=${paymentMethod}`
      );

      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
        calculateOrderStats(response.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setOrders([]);
        setError("Failed to fetch orders. Unexpected response format.");
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setError(
        error.response?.data?.error || error.message || "Failed to fetch orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate order statistics
  const calculateOrderStats = (orderData: any[]) => {
    const stats = {
      total: orderData.length,
      completed: 0,
      processing: 0,
      confirmed: 0, // Added confirmed counter
      dispatched: 0,
      cancelled: 0,
      notProcessed: 0,
      totalSales: 0,
    };

    orderData.forEach((order) => {
      // Add to total sales
      stats.totalSales += parseFloat(order.total || 0);

      // Count statuses
      const products = order.products || [];
      if (products.length === 0) return;

      // Get majority status
      const statusCounts: { [key: string]: number } = {};
      products.forEach((product: any) => {
        const status = product.status || "Not Processed";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Find most common status
      let majorityStatus = "";
      let maxCount = 0;
      Object.entries(statusCounts).forEach(([status, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityStatus = status;
        }
      });

      // Increment the appropriate counter
      switch (majorityStatus) {
        case "Completed":
          stats.completed++;
          break;
        case "Processing":
          stats.processing++;
          break;
        case "Confirmed": // Added case for Confirmed
          stats.confirmed++;
          break;
        case "Dispatched":
          stats.dispatched++;
          break;
        case "Cancelled":
          stats.cancelled++;
          break;
        case "Not Processed":
        default:
          stats.notProcessed++;
          break;
      }
    });

    setOrderStats(stats);
  };
  // API functions to handle order actions
  const updateOrderStatus = async (
    orderId: string,
    productId: string | null, // Can be null for order-level status changes
    status: string,
    customMessage?: string, // Added customMessage
    trackingUrl?: string,   // Added trackingUrl
    trackingId?: string     // Added trackingId
  ) => {
    try {
      const isOrderLevelChange = productId === null;
      
      console.log(
        isOrderLevelChange
          ? `Updating status for entire order ${orderId} to ${status}`
          : `Updating status for order ${orderId}, product ${productId} to ${status} with tracking: ${trackingUrl} (${trackingId})`
      );
      
      const endpoint = isOrderLevelChange 
        ? "/api/admin/orders/order-status" // New endpoint for order-level status
        : "/api/admin/orders/status";      // Existing endpoint for product-level status
      
      const response = await axios.post(endpoint, {
        orderId,
        productId,
        status,
        customMessage, // Pass customMessage
        trackingUrl,   // Pass trackingUrl
        trackingId,    // Pass trackingId
      });

      if (response.status !== 200) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Log success for debugging
      console.log("Order status update successful:", response.data);

      // Force refetch after update with increased timeout for database consistency
      setTimeout(() => {
        console.log("Refreshing orders after status update");
        fetchOrders();
      }, 500);

      return response.data;
    } catch (error: any) {
      console.error("Error updating order status:", error);
      // Return structured error to be handled by the component
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update order status",
      };
    }
  };

  const markOrderAsOld = async (orderId: string) => {
    try {
      const response = await axios.post("/api/admin/orders/mark-old", {
        orderId,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error marking order as old:", error);
      throw error.response?.data || error;
    }
  };  // Fetch only processing orders for the dialog
  const fetchProcessingOrders = () => {
    console.log("Fetching processing orders");
    setProcessingLoading(true);
    // Reset any previous selections
    setSelectedOrder(null);
    setSelectedStatus("");
    
    // Filter processing orders from current orders or fetch them specifically
    const filtered = orders.filter(order => {
      const products = order.products || [];
      if (products.length === 0) return false;
      
      // Count processing status
      let processingCount = 0;
      products.forEach((product: any) => {
        if (product.status === "Processing") {
          processingCount++;
        }
      });
      
      // Include order if at least one product is in processing
      return processingCount > 0;
    });
    
    console.log(`Found ${filtered.length} processing orders`);
    setProcessingOrders(filtered);
    setProcessingDialog(true);
    setProcessingLoading(false);
  };// Handle status change from dialog
  const handleStatusChange = async () => {
    if (!selectedOrder || !selectedStatus) {
      console.log("No order or status selected");
      return;
    }
    
    console.log(`Changing status to ${selectedStatus} in ${statusChangeMode} mode for order ${selectedOrder._id}`);
    setProcessingLoading(true);
    
    try {
      if (statusChangeMode === 'order') {
        // Update status for the entire order
        console.log("Updating entire order status");
        const result = await updateOrderStatus(
          selectedOrder._id,
          null, // Null productId indicates order-level status change
          selectedStatus
        );
        console.log("Order status update result:", result);
      } else {
        // Update status for all selected order's products that are in Processing status
        console.log("Updating individual product statuses");
        const products = selectedOrder.products || [];
        const processingProducts = products.filter((p: any) => p.status === "Processing");
        
        console.log(`Found ${processingProducts.length} processing products to update`);
        for (const product of processingProducts) {
          const result = await updateOrderStatus(
            selectedOrder._id,
            product._id,
            selectedStatus
          );
          console.log(`Updated product ${product._id} result:`, result);
        }
      }
      
      // Close dialog and refresh
      console.log("Status update complete, refreshing orders");
      setProcessingDialog(false);
      setSelectedOrder(null);
      setSelectedStatus("");
      fetchOrders();
    } catch (error) {
      console.error("Error bulk updating order statuses:", error);
    } finally {
      setProcessingLoading(false);
    }
  };

  // Format order status for display
  const formatStatus = (status: string) => {
    switch(status) {
      case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "CONFIRMED": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
      case "PROCESSING": return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Processing</Badge>;
      case "SHIPPED": return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Shipped</Badge>;
      case "DELIVERED": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Apply filters to orders
  useEffect(() => {
    if (!orders.length) return;
    
    let filtered = [...orders];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order.user?.email?.toLowerCase().includes(query) ||
        order.user?.name?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply date filter
    if (date) {
      const orderDate = new Date(date).toDateString();
      filtered = filtered.filter(order => {
        const createdAt = new Date(order.createdAt).toDateString();
        return createdAt === orderDate;
      });
    }
    
    // Apply vendor filter
    if (vendorFilter) {
      filtered = filtered.filter(order => order.vendorId === vendorFilter);
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, date, vendorFilter]);
  
  // Mobile order card renderer
  const renderMobileOrderCard = (order: any) => (
    <MobileDataCard key={order._id} className="relative">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">Order #{order.orderNumber}</h3>
        <div>{formatStatus(order.status)}</div>
      </div>
      
      <MobileDataItem 
        label="Customer" 
        value={order.user?.name || "Guest"} 
      />
      
      <MobileDataItem 
        label="Order Date" 
        value={new Date(order.createdAt).toLocaleDateString()} 
      />
      
      <MobileDataItem 
        label="Total Amount" 
        value={`₹${order.totalAmount?.toFixed(2)}`} 
      />
      
      <MobileDataItem 
        label="Items" 
        value={`${order.items?.length || 0} products`} 
      />
      
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end items-center gap-2">
        <Button size="sm" variant="outline">View Details</Button>
        
        {order.status === "PENDING" && (
          <Button size="sm" variant="default">Confirm</Button>
        )}
        
        {(order.status === "CONFIRMED" || order.status === "PROCESSING") && (
          <Button size="sm" variant="default">Update Status</Button>
        )}
      </div>
    </MobileDataCard>
  );

  useEffect(() => {
    fetchOrders();
  }, [range, isPaid, paymentMethod]);

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {isMobile ? (
        <>
          <MobileDataViewHeader
            title="Orders"
            description="Manage and track all customer orders"
          />
          
          <Tabs defaultValue="all" className="mb-4">
            <TabsList className="w-full h-auto flex overflow-x-auto py-1">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
              <TabsTrigger value="processing" className="flex-1">Processing</TabsTrigger>
              <TabsTrigger value="shipped" className="flex-1">Shipped</TabsTrigger>
              <TabsTrigger value="delivered" className="flex-1">Delivered</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                className="pl-9 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-10 p-0">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="icon" className="h-10 w-10">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          {date && (
            <div className="mb-4 flex items-center">
              <Badge variant="outline" className="flex gap-1 items-center">
                <span>Date: {format(date, "PP")}</span>
                <Button 
                  variant="ghost" 
                  className="h-5 w-5 p-0 ml-1" 
                  onClick={() => setDate(undefined)}
                >
                  <FilterX className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}
          
          <MobileDataView
            data={filteredOrders.length > 0 ? filteredOrders : orders}
            keyExtractor={(order) => order._id}
            renderItem={renderMobileOrderCard}
            emptyMessage="No orders found"
          />
        </>
      ) : (
        // Existing desktop UI
        <div>
          {/* Order Statistics Cards */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            sx={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              backgroundColor: "#f8fafc",
              borderLeft: "4px solid #4f46e5",
              height: "100%",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <div>
                  <Typography color="textSecondary" variant="body2">
                    Total Orders
                  </Typography>
                  <Typography variant="h4" component="div">
                    {orderStats.total}
                  </Typography>
                </div>
                <ShoppingBag sx={{ color: "#4f46e5", fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            sx={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              backgroundColor: "#f8fafc",
              borderLeft: "4px solid #0891b2",
              height: "100%",
              cursor: "pointer",
              position: "relative",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
            }}
            onClick={() => fetchProcessingOrders()}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <div>
                  <Typography color="textSecondary" variant="body2">
                    Processing
                  </Typography>
                  <Typography variant="h4" component="div">
                    {orderStats.processing}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Click to manage
                  </Typography>
                </div>
                <HourglassEmpty sx={{ color: "#0891b2", fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Confirmed Orders Card - Added New Card */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            sx={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              backgroundColor: "#f8fafc",
              borderLeft: "4px solid #00796b", // Cyan border for Confirmed
              height: "100%",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <div>
                  <Typography color="textSecondary" variant="body2">
                    Confirmed
                  </Typography>
                  <Typography variant="h4" component="div">
                    {orderStats.confirmed}
                  </Typography>
                </div>
                <ThumbUpAlt sx={{ color: "#00796b", fontSize: 40 }} /> {/* Icon for Confirmed */}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            sx={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              backgroundColor: "#f8fafc",
              borderLeft: "4px solid #0d9488",
              height: "100%",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <div>
                  <Typography color="textSecondary" variant="body2">
                    Dispatched
                  </Typography>
                  <Typography variant="h4" component="div">
                    {orderStats.dispatched}
                  </Typography>
                </div>
                <LocalShipping sx={{ color: "#0d9488", fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            sx={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              backgroundColor: "#f8fafc",
              borderLeft: "4px solid #16a34a",
              height: "100%",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <div>
                  <Typography color="textSecondary" variant="body2">
                    Completed
                  </Typography>
                  <Typography variant="h4" component="div">
                    {orderStats.completed}
                  </Typography>
                </div>
                <CheckCircle sx={{ color: "#16a34a", fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            sx={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              backgroundColor: "#f8fafc",
              borderLeft: "4px solid #dc2626",
              height: "100%",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <div>
                  <Typography color="textSecondary" variant="body2">
                    Cancelled
                  </Typography>
                  <Typography variant="h4" component="div">
                    {orderStats.cancelled}
                  </Typography>
                </div>
                <Cancel sx={{ color: "#dc2626", fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            sx={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              backgroundColor: "#f8fafc",
              borderLeft: "4px solid #ca8a04",
              height: "100%",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <div>
                  <Typography color="textSecondary" variant="body2">
                    Total Sales
                  </Typography>
                  <Typography variant="h6" component="div">
                    ₹{orderStats.totalSales.toLocaleString("en-IN")}
                  </Typography>
                </div>
                <Typography variant="h3" fontWeight="bold" color="#ca8a04">
                  ₹
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          <p>Error: {error}</p>
          <p>Please try again or contact support.</p>
        </div>
      )}

      <AllOrdersTable
        rows={orders || []}
        range={range}
        setRange={setRange}
        setIsPaid={setIsPaid}
        isPaid={isPaid}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        vendorFilter={vendorFilter}
        setVendorFilter={setVendorFilter}
        updateOrderStatus={updateOrderStatus}
        markOrderAsOld={markOrderAsOld}
        refreshOrders={fetchOrders}
      />
      
      {/* Processing Orders Dialog */}
      <Dialog 
        open={processingDialog} 
        onClose={() => setProcessingDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Manage Processing Orders</Typography>
            <MuiButton // Changed from Button to MuiButton
              onClick={() => setProcessingDialog(false)} 
              color="inherit" 
              size="small"
              sx={{ minWidth: 'auto' }}
            >
              <Close />
            </MuiButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {processingLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </Box>
          ) : processingOrders.length === 0 ? (
            <Box p={2} textAlign="center">
              <Typography variant="body1">No processing orders found</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
                Select an order and choose how you want to update the status:
              </Typography>
                <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                <Box display="flex" alignItems="center" gap={2} sx={{ flexWrap: 'wrap' }}>
                  <Typography variant="body2" fontWeight="medium">Status Change Mode:</Typography><Button
                    variant={statusChangeMode === 'order' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      console.log("Setting mode to order");
                      setStatusChangeMode('order');
                    }}
                    className="min-w-[120px]"
                  >
                    Order Level
                  </Button>
                  <Button
                    variant={statusChangeMode === 'product' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => {
                      console.log("Setting mode to product");
                      setStatusChangeMode('product');
                    }}
                    className="min-w-[120px]"
                  >
                    Product Level
                  </Button>
                </Box>
              </FormControl>
              
              <List>
                {processingOrders.map((order) => (
                  <ListItem key={order._id} disablePadding divider>
                    <ListItemButton
                      selected={selectedOrder?._id === order._id}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <ListItemText 
                        primary={
                          <Box sx={{ fontWeight: selectedOrder?._id === order._id ? 'bold' : 'regular' }}>
                            {`Order #${order.orderId || order._id}`}
                          </Box>
                        } 
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                            {` — ${order.user?.name || 'Customer'} — ₹${parseFloat(order.total || 0).toLocaleString('en-IN')}`}
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              
              {selectedOrder && (
                <Box mt={3}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {statusChangeMode === 'order' 
                      ? 'Change status for the entire order:' 
                      : 'Change status for all processing items in this order:'}
                  </Typography>
                  
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel id="change-status-label">Change Status To</InputLabel>
                    <Select
                      labelId="change-status-label"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      label="Change Status To"
                    >
                      <MenuItem value="Not Processed">Not Processed</MenuItem>
                      <MenuItem value="Processing">Processing</MenuItem>
                      <MenuItem value="Confirmed">Confirmed</MenuItem>
                      <MenuItem value="Dispatched">Dispatched</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                    <FormHelperText>
                      {statusChangeMode === 'order' 
                        ? 'This will update the status for the entire order'
                        : 'This will change the status of all processing items in this order'}
                    </FormHelperText>
                  </FormControl>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
  <MuiButton onClick={() => setProcessingDialog(false)} color="inherit">
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleStatusChange}
            variant="contained" 
            color="primary"
            disabled={!selectedOrder || !selectedStatus || processingLoading}
          >
            Update Status
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  )}
  </div>
  );
};

export default OrdersPage;
