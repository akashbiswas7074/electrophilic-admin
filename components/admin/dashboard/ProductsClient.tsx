'use client';

import { useState, useEffect } from "react";
import ProductsDataTable from "./data.products.table";
import { getAllProducts } from "@/lib/database/actions/admin/products/products.actions";

export default function ProductsClient() {
  const [products, setProducts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setIsLoading(true);
        const res = await getAllProducts();
        setProducts(res);
      } catch (error: any) {
        console.error(error);
        setError(error.message || 'Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllProducts();
  }, []);

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return Array.isArray(products) && products.length > 0 ? (
    <ProductsDataTable products={products} />
  ) : (
    <p>No Products Found!!!</p>
  );
}
