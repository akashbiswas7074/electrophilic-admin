"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
    return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="max-w-3xl mx-auto">
        <div className="inline-block bg-blue-600/10 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          Admin Portal
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-blue-700 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Welcome to Co-Pal E-Commerce Admin
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-600">
          Manage your store, products, orders and more with our powerful admin dashboard.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
          <Button 
            onClick={() => router.push('/admin/login')}
            className="px-6 py-6 text-lg bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            Admin Login
          </Button>
          <Button 
            onClick={() => router.push('/admin/dashboard')}
            variant="outline" 
            className="px-6 py-6 text-lg rounded-xl border-2"
          >
            Dashboard
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-medium text-lg text-center">Manage Orders</h3>
          </div>
          
          <div className="p-6 rounded-xl bg-white shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg text-center">Track Products</h3>
          </div>
          
          <div className="p-6 rounded-xl bg-white shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg text-center">View Analytics</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
