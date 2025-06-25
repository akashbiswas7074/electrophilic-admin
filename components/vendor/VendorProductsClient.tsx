"use client";

import { useState, useEffect } from "react";
import ProductsDataTable from "../data.products.table";
import { getAllProducts } from "@/lib/database/actions/admin/products/products.actions";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VendorProductsClient() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching vendor products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "vendor") {
      fetchProducts();
    }
  }, [session]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                My Products 
                <Badge variant="secondary">{products.length}</Badge>
              </CardTitle>
              <CardDescription>
                Manage your product catalog and inventory
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Vendor Dashboard
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ProductsDataTable rows={products} />
        </CardContent>
      </Card>
    </div>
  );
}