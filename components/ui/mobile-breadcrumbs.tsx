"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MobileBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  homeIcon?: boolean;
}

export function MobileBreadcrumbs({ 
  items, 
  className,
  homeIcon = true
}: MobileBreadcrumbsProps) {
  return (
    <nav className={cn("flex", className)}>
      <ol className="flex flex-wrap items-center space-x-1 md:space-x-2 text-sm">
        {homeIcon && (
          <li className="flex items-center">
            <Link 
              href="/" 
              className="text-gray-500 hover:text-gray-900 flex items-center"
            >
              <Home className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="sr-only">Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 mx-1" />
          </li>
        )}
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                <span className="font-medium text-gray-900 truncate max-w-[150px] md:max-w-none">
                  {item.label}
                </span>
              ) : (
                <>
                  {item.href ? (
                    <Link 
                      href={item.href} 
                      className="text-gray-500 hover:text-gray-900 truncate max-w-[100px] md:max-w-none"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-500 truncate max-w-[100px] md:max-w-none">
                      {item.label}
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 mx-1" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
