"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Eye,
  Plus,
  BarChart3,
  Users,
  Building,
  Settings
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalVendors: number;
  pendingVendors: number;
  monthlyGrowth: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalVendors: 0,
    pendingVendors: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        // TODO: Implement admin stats API endpoint
        // const response = await fetch('/api/admin/stats');
        // const data = await response.json();
        // setStats(data.stats);
        
        // Mock data for now
        setStats({
          totalProducts: 150,
          totalOrders: 1250,
          totalRevenue: 125000,
          totalUsers: 850,
          totalVendors: 25,
          pendingVendors: 3,
          monthlyGrowth: 12.5,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "admin") {
      fetchAdminStats();
    }
  }, [session]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading admin dashboard...</div>;
  }

  const quickActions = [
    {
      title: "Manage Products",
      description: "View and manage all products",
      href: "/admin/dashboard/product/all/tabular",
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "View Orders",
      description: "Manage customer orders",
      href: "/admin/dashboard/orders",
      icon: ShoppingCart,
      color: "bg-green-500",
    },
    {
      title: "Vendor Management",
      description: "Approve and manage vendors",
      href: "/admin/dashboard/vendors",
      icon: Building,
      color: "bg-purple-500",
    },
    {
      title: "User Management",
      description: "Manage customer accounts",
      href: "/admin/dashboard/users",
      icon: Users,
      color: "bg-orange-500",
    },
    {
      title: "Analytics",
      description: "View business analytics",
      href: "/admin/dashboard/analytics",
      icon: BarChart3,
      color: "bg-indigo-500",
    },
    {
      title: "Settings",
      description: "System configuration",
      href: "/admin/dashboard/admin-management",
      icon: Settings,
      color: "bg-gray-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || "Admin"}! Here's your platform overview.
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          Administrator
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Across all vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Platform-wide orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingVendors} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="group cursor-pointer rounded-lg border p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${action.color} text-white`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Vendor Approvals</p>
                  <p className="text-sm text-muted-foreground">{stats.pendingVendors} vendors awaiting approval</p>
                </div>
                <Badge variant="destructive">{stats.pendingVendors}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Product Reviews</p>
                  <p className="text-sm text-muted-foreground">5 products need review</p>
                </div>
                <Badge variant="outline">5</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Support Tickets</p>
                  <p className="text-sm text-muted-foreground">12 open tickets</p>
                </div>
                <Badge variant="secondary">12</Badge>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/dashboard/vendors">
                <Button variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Review Pending Items
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest platform orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Mock recent orders */}
              {[1, 2, 3].map((order) => (
                <div key={order} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Order #{2000 + order}</p>
                    <p className="text-sm text-muted-foreground">₹2,500 • 3 items</p>
                  </div>
                  <Badge variant="outline">Processing</Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/dashboard/orders">
                <Button variant="outline" className="w-full">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View All Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}