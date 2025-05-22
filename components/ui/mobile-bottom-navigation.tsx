"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Users, Package, ShoppingBag, BarChart2 } from 'lucide-react';

interface BottomNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const BottomNavItem = ({ href, icon, label }: BottomNavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center flex-1 py-2",
        "text-xs font-medium",
        isActive 
          ? "text-blue-600" 
          : "text-gray-500 hover:text-blue-600"
      )}
    >
      <div className="mb-1">
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
};

export function MobileBottomNavigation() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-around">
        <BottomNavItem 
          href="/admin/dashboard" 
          icon={<Home className="h-5 w-5" />} 
          label="Home" 
        />
        <BottomNavItem 
          href="/admin/dashboard/orders" 
          icon={<ShoppingBag className="h-5 w-5" />} 
          label="Orders" 
        />
        <BottomNavItem 
          href="/admin/dashboard/product/all/tabular" 
          icon={<Package className="h-5 w-5" />} 
          label="Products" 
        />
        <BottomNavItem 
          href="/admin/dashboard/users" 
          icon={<Users className="h-5 w-5" />} 
          label="Users" 
        />
        <BottomNavItem 
          href="/admin/dashboard/analytics/order" 
          icon={<BarChart2 className="h-5 w-5" />} 
          label="Analytics" 
        />
      </div>
    </div>
  );
}
