"use client";

import { useEffect } from "react";
import { Metadata } from "next";
import BannerMetrics from "@/components/admin/dashboard/banners/BannerMetrics";

export default function BannerMetricsPage() {
  useEffect(() => {
    // Set page title
    document.title = "Banner Metrics | VIBECart Admin";
  }, []);

  return (
    <div className="p-6">
      <BannerMetrics />
    </div>
  );
}