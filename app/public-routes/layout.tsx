"use client";

import React from 'react';
import Navbar from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8 min-h-[calc(100vh-64px)]">
        {children}
      </main>
      <footer className="bg-gray-50 border-t py-6 px-4 text-center text-gray-600 text-sm">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} Co-Pal E-Commerce Admin</p>
        </div>
      </footer>
      <Toaster />
    </>
  );
}
