import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { IoIosCloseCircle } from "react-icons/io";
import { SlEye } from "react-icons/sl";
import { HiCurrencyRupee } from "react-icons/hi";
import { VscGraph } from "react-icons/vsc";
import { IoListCircleSharp } from "react-icons/io5";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  calculateTotalOrders,
  getDashboardData,
} from "@/lib/database/actions/admin/dashboard/dashboard.actions";
import DashboardCard from "@/components/admin/dashboard/dashboardCard";
import ProductData from "@/components/admin/dashboard/product.perfomance";
import LowStockProducts from "@/components/admin/dashboard/low-stock-products";
import OutOfStockProducts from "@/components/admin/dashboard/out-of-stock-products";
import AdminManagement from "@/components/admin/dashboard/admin-management";
import AdminList from "@/components/admin/dashboard/admin-list";

const AdminDashboardPage = async () => {
  const data = await getDashboardData().catch((err) => console.log(err));
  const allOrdersData = await calculateTotalOrders().catch((err) =>
    console.log(err)
  );

  return (
    <div className="p-6 space-y-8">
      {/* Stats Section */}
      <section>
        <h1 className="title-lg mb-6">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800">₹{allOrdersData?.totalSales}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <HiCurrencyRupee className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Sales</p>
                <p className="text-2xl font-bold text-gray-800">₹{allOrdersData?.lastMonthSales}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <HiCurrencyRupee className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Growth</p>
                <p className="text-2xl font-bold text-gray-800">{allOrdersData?.growthPercentage}%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <VscGraph className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{data?.orders?.length || 0}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <IoListCircleSharp className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Orders Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="title-md">Recent Orders</h2>
          <Link href="/admin/dashboard/orders">
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
                  <TableCell className="font-semibold">Customer</TableCell>
                  <TableCell className="font-semibold">Amount</TableCell>
                  <TableCell className="font-semibold">Status</TableCell>
                  <TableCell className="font-semibold">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.orders?.slice(0, 5).map((order: any, index: number) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap">
                      {order?.user?.email}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      ₹{order.total}
                    </TableCell>
                    <TableCell>
                      {order.isPaid ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaCheckCircle className="mr-1" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <IoIosCloseCircle className="mr-1" /> Unpaid
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/dashboard/order/view/${order._id}`}>
                        <button className="flex items-center text-blue-600 hover:text-blue-700">
                          <SlEye className="w-5 h-5 mr-1" /> View Order
                        </button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card hover:shadow-md transition-shadow">
          <ProductData />
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <LowStockProducts />
        </div>
      </section>

      {/* Admin Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card hover:shadow-md transition-shadow">
          <AdminManagement />
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <AdminList />
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
