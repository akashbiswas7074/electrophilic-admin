"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Settings, TrendingUp, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface RecommendationStats {
  totalRecommendations: number;
  categoryBasedCount: number;
  brandBasedCount: number;
  trendingCount: number;
  averageRecommendationsPerProduct: number;
  topPerformingTypes: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
}

interface ProductRecommendation {
  productId: string;
  productName: string;
  recommendationType: string;
  recommendationCount: number;
  clickThroughRate: number;
  conversionRate: number;
  lastGenerated: string;
}

const RecommendationEngineManager: React.FC = () => {
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [testProductId, setTestProductId] = useState('');
  const [testType, setTestType] = useState<string>('hybrid');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    defaultLimit: 8,
    cacheTimeout: 1800,
    enableAnalytics: true,
    minSimilarityScore: 0.3,
  });

  useEffect(() => {
    fetchStats();
    fetchRecommendations();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/recommendations/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching recommendation stats:', error);
      toast.error('Failed to fetch recommendation statistics');
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/recommendations');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const testRecommendations = async () => {
    if (!testProductId.trim()) {
      toast.error('Please enter a product ID to test');
      return;
    }

    try {
      setTestLoading(true);
      const response = await fetch(
        `/api/products/recommendations?productId=${testProductId}&type=${testType}&limit=6`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch test recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setTestResults(data.recommendations);
        toast.success(`Generated ${data.recommendations.length} recommendations`);
      } else {
        toast.error(data.message || 'Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error testing recommendations:', error);
      toast.error('Failed to test recommendations');
    } finally {
      setTestLoading(false);
    }
  };

  const refreshCache = async () => {
    try {
      const response = await fetch('/api/admin/recommendations/refresh', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Recommendation cache refreshed successfully');
        fetchStats();
        fetchRecommendations();
      } else {
        throw new Error('Failed to refresh cache');
      }
    } catch (error) {
      console.error('Error refreshing cache:', error);
      toast.error('Failed to refresh recommendation cache');
    }
  };

  const updateSettings = async () => {
    try {
      const response = await fetch('/api/admin/recommendations/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        toast.success('Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recommendation Engine</h1>
          <p className="text-gray-600">Manage and monitor product recommendations</p>
        </div>
        <Button onClick={refreshCache} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Cache
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecommendations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Generated recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Category Based</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoryBasedCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Category recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brand Based</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.brandBasedCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Brand recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per Product</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRecommendationsPerProduct.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Recommendations per product
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">Test Engine</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Recommendation Engine</CardTitle>
              <CardDescription>
                Test the recommendation engine with a specific product ID and type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product ID</Label>
                  <Input
                    id="productId"
                    placeholder="Enter product ID"
                    value={testProductId}
                    onChange={(e) => setTestProductId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommendationType">Recommendation Type</Label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="category">Category Based</SelectItem>
                      <SelectItem value="brand">Brand Based</SelectItem>
                      <SelectItem value="similar">Similar Price</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={testRecommendations} 
                    disabled={testLoading}
                    className="w-full"
                  >
                    {testLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Recommendations'
                    )}
                  </Button>
                </div>
              </div>

              {testResults.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4">Test Results ({testResults.length} recommendations)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {testResults.map((product, index) => (
                      <Card key={product.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-sm line-clamp-2">{product.name}</h5>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Price: ₹{product.price.toLocaleString()}</p>
                          <p>Category: {product.category}</p>
                          <p>Rating: {product.rating}/5 ({product.reviews} reviews)</p>
                          {product.isFeatured && (
                            <Badge variant="outline" className="text-xs">Featured</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendation Performance</CardTitle>
              <CardDescription>
                Analytics and performance metrics for the recommendation engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.topPerformingTypes.map((type, index) => (
                    <div key={type.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">{type.type} Recommendations</h4>
                        <p className="text-sm text-gray-600">{type.count} generated</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{type.successRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engine Settings</CardTitle>
              <CardDescription>
                Configure recommendation engine parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultLimit">Default Limit</Label>
                  <Input
                    id="defaultLimit"
                    type="number"
                    value={settings.defaultLimit}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultLimit: parseInt(e.target.value) || 8
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cacheTimeout">Cache Timeout (seconds)</Label>
                  <Input
                    id="cacheTimeout"
                    type="number"
                    value={settings.cacheTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      cacheTimeout: parseInt(e.target.value) || 1800
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minSimilarityScore">Min Similarity Score</Label>
                  <Input
                    id="minSimilarityScore"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={settings.minSimilarityScore}
                    onChange={(e) => setSettings({
                      ...settings,
                      minSimilarityScore: parseFloat(e.target.value) || 0.3
                    })}
                  />
                </div>
              </div>
              <Button onClick={updateSettings} className="w-full md:w-auto">
                Update Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecommendationEngineManager;