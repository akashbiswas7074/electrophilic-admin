"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Banner {
  _id: string;
  public_id: string;
  url: string;
  platform: 'desktop' | 'mobile';
  linkUrl?: string;
  altText?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

interface MetricData {
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export default function BannerMetrics() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [topPerformers, setTopPerformers] = useState<MetricData[]>([]);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      // Build URL with query parameters
      let url = '/api/admin/banners';
      const params = new URLSearchParams();
      
      if (platform !== "all") {
        params.append('platform', platform);
      }
      
      if (activeStatus !== "all") {
        params.append('active', activeStatus === "active" ? "true" : "false");
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        
        // Process top performers
        const sorted = [...data.banners]
          .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
          .slice(0, 5)
          .map(banner => ({
            name: banner.altText || banner.public_id.substring(0, 10) + '...',
            impressions: banner.impressions || 0,
            clicks: banner.clicks || 0,
            ctr: banner.impressions ? ((banner.clicks || 0) / banner.impressions) * 100 : 0
          }));
          
        setTopPerformers(sorted);
      } else {
        setBanners([]);
        setTopPerformers([]);
      }
    } catch (error) {
      console.error('Failed to fetch banner data:', error);
      setBanners([]);
      setTopPerformers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [platform, activeStatus]);

  // Aggregate metrics by platform
  const platformMetrics = banners.reduce((acc, banner) => {
    const platform = banner.platform || 'unknown';
    if (!acc[platform]) {
      acc[platform] = { impressions: 0, clicks: 0 };
    }
    acc[platform].impressions += banner.impressions || 0;
    acc[platform].clicks += banner.clicks || 0;
    return acc;
  }, {} as Record<string, { impressions: number, clicks: number }>);

  const platformData = Object.entries(platformMetrics).map(([name, data]) => ({
    name,
    impressions: data.impressions,
    clicks: data.clicks,
    ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0
  }));

  // Calculate totals
  const totalImpressions = banners.reduce((sum, banner) => sum + (banner.impressions || 0), 0);
  const totalClicks = banners.reduce((sum, banner) => sum + (banner.clicks || 0), 0);
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Banner Metrics</h1>
          <p className="text-gray-500">Track performance of your website banners</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Platform</SelectLabel>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Select value={activeStatus} onValueChange={setActiveStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Active status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="all">All Banners</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Total Impressions"
          value={totalImpressions.toLocaleString()}
          description="Banner views across all platforms"
          loading={loading}
        />
        <MetricCard
          title="Total Clicks"
          value={totalClicks.toLocaleString()}
          description="Banner clicks across all platforms" 
          loading={loading}
        />
        <MetricCard
          title="Average CTR"
          value={`${averageCTR.toFixed(2)}%`}
          description="Click-through rate across all banners"
          loading={loading}
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">By Platform</TabsTrigger>
          <TabsTrigger value="top">Top Performers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Banner Performance</CardTitle>
              <CardDescription>Impressions vs. Clicks for all banners</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={banners.map(b => ({
                      name: b.altText || b.public_id.substring(0, 10) + '...',
                      impressions: b.impressions || 0,
                      clicks: b.clicks || 0
                    }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="impressions" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="platforms" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Metrics by Platform</CardTitle>
              <CardDescription>Desktop vs. Mobile performance</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={platformData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="impressions" fill="#8884d8" />
                    <Bar dataKey="clicks" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Banners</CardTitle>
              <CardDescription>Banners with highest click rates</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topPerformers}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clicks" fill="#82ca9d" />
                    <Bar dataKey="ctr" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BannerTable banners={banners} loading={loading} />
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  description, 
  loading 
}: { 
  title: string; 
  value: string; 
  description: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-gray-500">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BannerTable({ banners, loading }: { banners: Banner[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Banner Details</CardTitle>
        <CardDescription>Performance metrics for all banners</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Banner</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Impressions</th>
                <th className="px-6 py-3">Clicks</th>
                <th className="px-6 py-3">CTR</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="bg-white border-b">
                    <td colSpan={6} className="px-6 py-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No banner data available
                  </td>
                </tr>
              ) : (
                banners.map((banner) => {
                  const ctr = banner.impressions ? ((banner.clicks || 0) / banner.impressions) * 100 : 0;
                  const isActive = banner.isActive && 
                    (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
                    (!banner.endDate || new Date(banner.endDate) >= new Date());
                  
                  return (
                    <tr key={banner.public_id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded overflow-hidden">
                            <img 
                              src={banner.url} 
                              alt={banner.altText || "Banner"} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium truncate max-w-[200px]">
                              {banner.altText || banner.public_id.substring(0, 15) + '...'}
                            </div>
                            {banner.linkUrl && (
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                {banner.linkUrl}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize">{banner.platform}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">{banner.impressions || 0}</td>
                      <td className="px-6 py-4">{banner.clicks || 0}</td>
                      <td className="px-6 py-4">{ctr.toFixed(2)}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}