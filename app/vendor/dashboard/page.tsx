"use client";
import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaBox, FaStar, FaChartLine } from "react-icons/fa";
import { IoIosCloseCircle } from "react-icons/io";
import { SlEye } from "react-icons/sl";
import { HiCurrencyRupee } from "react-icons/hi";
import { VscGraph } from "react-icons/vsc";
import { IoListCircleSharp } from "react-icons/io5";
import { MdInventory, MdPendingActions } from "react-icons/md";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  CircularProgress
} from "@mui/material";
import { useSession } from "next-auth/react";

interface VendorDashboardData {
  totalSales: number;
  salesGrowth: number;
  activeProducts: number;
  totalProducts: number;
  pendingOrders: number;
  averageRating: number;
  totalReviews: number;
  thisMonthSales: number;
  productsSold: number;
  ordersCompleted: number;
  customerSatisfaction: number;
  recentOrders: Array<{
    id: string;
    customerName: string;
    total: number;
    status: string;
    date: string;
  }>;
}

const VendorDashboardPage = () => {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        // Fetch vendor-specific dashboard data
        const response = await fetch('/api/vendor/dashboard');
        if (response.ok) {
          const result = await response.json();
          setDashboardData(result.data);
        }
      } catch (error) {
        console.error('Error fetching vendor dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'vendor') {
      fetchVendorData();
    } else {
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <section>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {session?.user?.name || 'Vendor'}!
          </h1>
          <p className="text-gray-600">Here's an overview of your business performance</p>
        </div>
      </section>

      {/* Stats Section */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sales */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{dashboardData?.totalSales || '0'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{dashboardData?.salesGrowth || '0'}% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <HiCurrencyRupee className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Active Products */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Products</p>
                <p className="text-2xl font-bold text-gray-800">
                  {dashboardData?.activeProducts || '0'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {dashboardData?.totalProducts || '0'} total products
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FaBox className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-800">
                  {dashboardData?.pendingOrders || '0'}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Requires attention
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <MdPendingActions className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-gray-800">
                  {dashboardData?.averageRating || '0'}/5
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {dashboardData?.totalReviews || '0'} reviews
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <FaStar className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Orders Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
          <Link href="/vendor/dashboard/orders">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
              View All Orders →
            </button>
          </Link>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="font-semibold">Order ID</TableCell>
                  <TableCell className="font-semibold">Customer</TableCell>
                  <TableCell className="font-semibold">Amount</TableCell>
                  <TableCell className="font-semibold">Status</TableCell>
                  <TableCell className="font-semibold">Date</TableCell>
                  <TableCell className="font-semibold">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(dashboardData?.recentOrders?.length ?? 0) > 0 ? (
                  dashboardData?.recentOrders?.slice(0, 5).map((order: any, index: number) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="whitespace-nowrap font-mono text-sm">
                        #{order.orderId}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {order.user?.name || order.user?.email}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        ₹{order.total}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status}
                          size="small"
                          color={order.status === 'Delivered' ? 'success' : order.status === 'Shipped' ? 'info' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/vendor/dashboard/order/view/${order._id}`}>
                          <button className="flex items-center text-blue-600 hover:text-blue-700">
                            <SlEye className="w-4 h-4 mr-1" /> View
                          </button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No recent orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Quick Actions & Analytics */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/vendor/dashboard/product/create">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                <FaBox className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-800">Add Product</p>
                <p className="text-xs text-gray-600">Create new product</p>
              </div>
            </Link>
            
            <Link href="/vendor/dashboard/orders">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer">
                <IoListCircleSharp className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-800">Manage Orders</p>
                <p className="text-xs text-gray-600">View & update orders</p>
              </div>
            </Link>
            
            <Link href="/vendor/dashboard/analytics/order">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer">
                <FaChartLine className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-800">View Analytics</p>
                <p className="text-xs text-gray-600">Sales performance</p>
              </div>
            </Link>
            
            <Link href="/vendor/dashboard/profile">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer">
                <MdInventory className="w-6 h-6 text-orange-600 mb-2" />
                <p className="font-medium text-gray-800">Profile Settings</p>
                <p className="text-xs text-gray-600">Update vendor info</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Month Sales</span>
              <span className="font-semibold">₹{dashboardData?.thisMonthSales || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Products Sold</span>
              <span className="font-semibold">{dashboardData?.productsSold || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Orders Completed</span>
              <span className="font-semibold">{dashboardData?.ordersCompleted || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="font-semibold">{dashboardData?.customerSatisfaction || '0'}%</span>
            </div>
            
            <div className="pt-4 border-t">
              <Link href="/vendor/dashboard/analytics/order">
                <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View Detailed Analytics →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VendorDashboardPage;
