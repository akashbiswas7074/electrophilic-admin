import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Eye, Edit, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface FeaturedProduct {
  _id: string;
  name: string;
  slug: string;
  subProducts: Array<{
    images: Array<{ url: string }>;
    sizes: Array<{ price: number }>;
  }>;
  category: { name: string; slug: string };
  featured: boolean;
  price?: number;
  rating?: number;
  reviews?: number;
}

const FeaturedProductsManager = () => {
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchAllProducts();
  }, [currentPage]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`/api/products/featured?page=${currentPage}&limit=12`);
      const data = await response.json();
      
      if (data.success) {
        setFeaturedProducts(data.products);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast.error('Failed to fetch featured products');
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setAllProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeaturedStatus = async (productId: string, currentStatus: boolean) => {
    try {
      setUpdating(productId);
      
      const response = await fetch('/api/products/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          featured: !currentStatus
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchFeaturedProducts();
        fetchAllProducts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    } finally {
      setUpdating(null);
    }
  };

  const getProductImage = (product: FeaturedProduct) => {
    return product.subProducts?.[0]?.images?.[0]?.url || '/placeholder-image.png';
  };

  const getProductPrice = (product: FeaturedProduct) => {
    return product.subProducts?.[0]?.sizes?.[0]?.price || product.price || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Featured Products</h1>
          <p className="text-gray-500 mt-1">
            Manage which products appear as featured on your homepage
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {featuredProducts.length} Featured
        </Badge>
      </div>

      {/* Featured Products Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Currently Featured Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {featuredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No featured products yet. Toggle products below to feature them.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="relative aspect-square mb-3">
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      FEATURED
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.category.name}</p>
                  <p className="font-bold text-lg mb-3">₹{getProductPrice(product)}</p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`/admin/dashboard/product/${product._id}`, '_blank')}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => toggleFeaturedStatus(product._id, true)}
                      disabled={updating === product._id}
                    >
                      {updating === product._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Remove'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Products - Available to Feature */}
      <Card>
        <CardHeader>
          <CardTitle>Add Products to Featured</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allProducts
              .filter(product => !product.featured)
              .slice(0, 12)
              .map((product) => (
                <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="relative aspect-square mb-3">
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.category.name}</p>
                  <p className="font-bold text-lg mb-3">₹{getProductPrice(product)}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Feature this product</span>
                    <Switch
                      checked={false}
                      onCheckedChange={() => toggleFeaturedStatus(product._id, false)}
                      disabled={updating === product._id}
                    />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeaturedProductsManager;