"use client";
import { Paper, Loader, Alert, Group, Text, Badge, ThemeIcon, RingProgress } from "@mantine/core";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { getOrderAnalytics, getTopSellingProducts, sizeAnalytics } from "@/lib/database/actions/admin/analytics/analytics.actions";
import { IconChartBar, IconShoppingCart, IconShirt, IconTrendingUp } from "@tabler/icons-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF6384"];

// Card component for summary metrics
const MetricCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
  <Paper className="p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4" style={{ borderLeftColor: color }}>
    <Group justify="space-between" className="mb-2">
      <Text size="xs" color="dimmed" className="uppercase" fw={700}>
        {title}
      </Text>
      <ThemeIcon color={color} variant="light" size="md" radius="xl">
        {icon}
      </ThemeIcon>
    </Group>
    <Text size="xl" fw={700}>
      {value}
    </Text>
  </Paper>
);

const OrderAnalytics = () => {
  const [orderData, setOrderData] = useState<any[]>([]);
  const [sizeData, setSizeData] = useState<{ name: string; value: number }[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    topSellingCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [orderAnalyticsResponse, sizeStats, topProducts] = await Promise.all([
          getOrderAnalytics(), // Fetches { orders: MonthlyAnalyticsData[], revenue, products_sold, ... }
          sizeAnalytics(),
          getTopSellingProducts()
        ]);
        
        // Handle order data and summary metrics from orderAnalyticsResponse
        if (orderAnalyticsResponse && orderAnalyticsResponse.orders) {
          setOrderData(orderAnalyticsResponse.orders); // This is the array for the chart
          
          // Set summary metrics from the response
          setSummaryMetrics({
            totalOrders: orderAnalyticsResponse.total_orders || 0,
            totalRevenue: orderAnalyticsResponse.total_revenue || 0,
            avgOrderValue: orderAnalyticsResponse.average_order_value || 0,
            topSellingCount: orderAnalyticsResponse.products_sold || 0 // Or a more specific field if available
          });
        } else {
          console.warn("Order analytics data is not in expected format:", orderAnalyticsResponse);
          setOrderData([]);
          setSummaryMetrics({ totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, topSellingCount: 0 });
        }
        
        // Handle size stats data
        if (Array.isArray(sizeStats)) {
          setSizeData(sizeStats);
        } else {
          console.warn("Size stats data is not in expected format:", sizeStats);
          setSizeData([]);
        }
        
        // Handle top selling products data
        if (Array.isArray(topProducts)) {
          setTopSellingProducts(topProducts);
        } else {
          console.warn("Top selling products data is not in expected format:", topProducts);
          setTopSellingProducts([]);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader size="xl" variant="bars" color="indigo" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert color="red" title="Error" icon={<IconTrendingUp size="1rem" />}>
          {error}
        </Alert>
      </div>
    );
  }

  // Check if we have valid data for rendering charts
  const hasOrderData = orderData && orderData.length > 0;
  const hasSizeData = sizeData && sizeData.length > 0;
  const hasProductData = topSellingProducts && topSellingProducts.length > 0;

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="mb-8 border-b pb-4">
        <Group justify="apart" align="flex-end">
          <div>
            <Text className="text-xs text-gray-500 uppercase tracking-wider">Dashboard</Text>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <IconChartBar size={28} stroke={1.5} className="text-indigo-600" />
              Analytics Overview
            </h1>
          </div>
          <Badge size="lg" radius="sm" color="indigo" variant="filled">Last 12 Months</Badge>
        </Group>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Orders" 
          value={summaryMetrics.totalOrders.toLocaleString()} 
          icon={<IconShoppingCart size="1.2rem" />}
          color="#4263eb" 
        />
        <MetricCard 
          title="Total Revenue" 
          value={`$${summaryMetrics.totalRevenue.toLocaleString()}`} 
          icon={<IconTrendingUp size="1.2rem" />}
          color="#40c057" 
        />
        <MetricCard 
          title="Avg. Order Value" 
          value={`$${summaryMetrics.avgOrderValue.toLocaleString()}`} 
          icon={<IconChartBar size="1.2rem" />}
          color="#f59f00" 
        />
        <MetricCard 
          title="Products Sold" 
          value={summaryMetrics.topSellingCount.toLocaleString()} 
          icon={<IconShirt size="1.2rem" />}
          color="#e64980" 
        />
      </div>

      {/* Order Trends */}
      <div className="grid gap-6 mb-8">
        <Paper className="p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-white border border-gray-100">
          <Group justify="apart" className="mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Order Trends</h2>
              <Text size="sm" color="dimmed">Monthly orders and revenue over time</Text>
            </div>
            {hasOrderData && (
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[{ value: 100, color: '#4263eb' }]}
                label={
                  <Text size="xs" ta="center" fw={700}>
                    12
                    <Text size="xs" ta="center" color="dimmed">months</Text>
                  </Text>
                }
              />
            )}
          </Group>
          <div className="h-[400px]">
            {hasOrderData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderData}>
                  <XAxis dataKey="month" tick={{ fill: '#6c757d' }} axisLine={{ stroke: '#e9ecef' }} />
                  <YAxis tick={{ fill: '#6c757d' }} axisLine={{ stroke: '#e9ecef' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e9ecef' 
                    }} 
                  />
                  <Legend 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '10px' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    strokeWidth={0} 
                    dot={{ fill: '#4263eb', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#4263eb' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    strokeWidth={0} 
                    dot={{ fill: '#40c057', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#40c057' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
                <div className="text-center">
                  <IconChartBar size={48} stroke={1} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 font-medium">No order data available</p>
                </div>
              </div>
            )}
          </div>
        </Paper>
      </div>

      {/* Product Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Products */}
        <Paper className="p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-white border border-gray-100">
          <Group justify="apart" className="mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Top Selling Products</h2>
              <Text size="sm" color="dimmed">Best performing products by sales volume</Text>
            </div>
            <Badge variant="light" color="indigo">{topSellingProducts.length} Products</Badge>
          </Group>
          <div className="h-[400px]">
            {hasProductData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topSellingProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topSellingProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} units`, name]}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e9ecef' 
                    }} 
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingLeft: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
                <div className="text-center">
                  <IconChartBar size={48} stroke={1} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 font-medium">No product data available</p>
                </div>
              </div>
            )}
          </div>
        </Paper>

        {/* Size Distribution */}
        <Paper className="p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-white border border-gray-100">
          <Group justify="apart" className="mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Size Distribution</h2>
              <Text size="sm" color="dimmed">Product sales by size</Text>
            </div>
            <Badge variant="light" color="teal">{sizeData.length} Sizes</Badge>
          </Group>
          <div className="h-[400px]">
            {hasSizeData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeData} layout="vertical" margin={{ right: 30 }}>
                  <XAxis type="number" tick={{ fill: '#6c757d' }} axisLine={{ stroke: '#e9ecef' }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#6c757d' }} axisLine={{ stroke: '#e9ecef' }} width={80} />
                  <Tooltip 
                    formatter={(value) => [`${value} units sold`, 'Sales']}
                    cursor={{ fill: 'rgba(222, 226, 230, 0.4)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e9ecef' 
                    }} 
                  />
                  <Bar dataKey="value" barSize={20} radius={[0, 5, 5, 0]}>
                    {sizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
                <div className="text-center">
                  <IconShirt size={48} stroke={1} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 font-medium">No size data available</p>
                </div>
              </div>
            )}
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default OrderAnalytics;
