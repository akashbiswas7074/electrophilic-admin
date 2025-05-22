"use client";

import dynamic from 'next/dynamic';

const ProductsClient = dynamic(
  () => import('@/components/admin/dashboard/ProductsClient'),
  { ssr: false }
);

export default function AllProductsPage() {
  return (
    <div className="container">
      <div className="mb-[1rem] titleStyle">All Products</div>
      <ProductsClient />
    </div>
  );
}
