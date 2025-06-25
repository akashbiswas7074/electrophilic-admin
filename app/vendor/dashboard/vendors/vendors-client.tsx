"use client";

import React, { useEffect, useState } from "react";
import EnhancedTableVendors from "@/components/admin/dashboard/vendors/table";
import { MobileDataView, MobileDataViewHeader, MobileDataCard, MobileDataItem } from "@/components/ui/mobile-data-view";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Vendor {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phoneNo?: string;
  storeName?: string;
  isVerified?: boolean;
  products?: any[];
}

export default function VendorsClient({ vendors }: { vendors: Vendor[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>(vendors || []);
  // Only execute client-side code after mounting
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Safe mounting hook for client-side only code
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (vendors) {
      setFilteredVendors(
        vendors.filter(vendor => 
          vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, vendors]);

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <MobileDataViewHeader 
        title="Vendor Management"
        description="View and manage all vendors in your system"
        actions={
          <Button variant="default" size="sm" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>Add Vendor</span>
          </Button>
        }
      />
      
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Only render these components when we're on the client side */}
      {isMounted && (
        <>
          {isMobile ? (
            <MobileDataView
              data={filteredVendors}
              keyExtractor={(item) => item.id?.toString() || item._id?.toString() || ""}
              renderItem={(vendor) => (
                <MobileDataCard>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{vendor.name}</h3>
                      <p className="text-sm text-gray-500">{vendor.email}</p>
                    </div>
                    <div className="flex items-center">
                      {vendor.isVerified ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <MobileDataItem label="Phone" value={vendor.phoneNo || "Not provided"} />
                  <MobileDataItem label="Store Name" value={vendor.storeName || "Not provided"} />
                  <MobileDataItem label="Products" value={vendor.products?.length || 0} />
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end items-center gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    {vendor.isVerified ? (
                      <Button variant="destructive" size="sm">Unverify</Button>
                    ) : (
                      <Button variant="default" size="sm">Verify</Button>
                    )}
                  </div>
                </MobileDataCard>
              )}
              emptyMessage="No vendors found"
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <EnhancedTableVendors rows={filteredVendors} />
            </div>
          )}
        </>
      )}
    </div>
  );
}