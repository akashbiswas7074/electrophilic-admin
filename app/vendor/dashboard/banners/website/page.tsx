"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  UploadCloud,
  Settings,
  Trash,
  RefreshCcw,
  Eye,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fetchAllWebsiteBanners } from "@/lib/database/actions/admin/banners/banners.actions";
import { useToast } from "@/components/ui/use-toast";
import BannerUploadForm from "@/components/admin/dashboard/banners/BannerUploadForm";
import BannerCard from "@/components/admin/dashboard/banners/BannerCard";
import BannerEditModal from "@/components/admin/dashboard/banners/BannerEditModal";
import EmptyState from "@/components/admin/dashboard/EmptyState";

interface Banner {
  _id: string;
  url: string;
  public_id: string;
  platform: "desktop" | "mobile";
  linkUrl?: string;
  altText?: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  priority: number; // Changed from priority?: number
  impressions?: number;
  clicks?: number;
  createdAt: string;
  updatedAt: string;
}

export default function WebsiteBannersPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [activePlatform, setActivePlatform] = useState<string>("all");
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch all banners
  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const fetchedBannersFromApi = await fetchAllWebsiteBanners();
      // Ensure isActive is always boolean, defaulting to true if undefined
      // Ensure priority is always number, defaulting to 10 if undefined
      const processedBanners = fetchedBannersFromApi.map((banner: any) => ({
        ...banner,
        isActive: banner.isActive === undefined ? true : banner.isActive,
        priority: banner.priority === undefined ? 10 : Number(banner.priority),
      }));
      setBanners(processedBanners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch banners. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Apply filters when banners, activeTab, or activePlatform change
  useEffect(() => {
    if (!banners) return;

    let filtered = [...banners];
    const today = new Date();

    // Filter by platform
    if (activePlatform !== "all") {
      filtered = filtered.filter(
        (banner) => banner.platform === activePlatform
      );
    }

    // Filter by status
    switch (activeTab) {
      case "active":
        filtered = filtered.filter(
          (banner) =>
            banner.isActive !== false &&
            (!banner.startDate || new Date(banner.startDate) <= today) &&
            (!banner.endDate || new Date(banner.endDate) >= today)
        );
        break;
      case "scheduled":
        filtered = filtered.filter(
          (banner) =>
            banner.startDate && new Date(banner.startDate) > today &&
            banner.isActive !== false
        );
        break;
      case "expired":
        filtered = filtered.filter(
          (banner) =>
            banner.endDate && new Date(banner.endDate) < today &&
            banner.isActive !== false
        );
        break;
      case "inactive":
        filtered = filtered.filter((banner) => banner.isActive === false);
        break;
      default:
        // All banners, no filter needed
        break;
    }

    // Sort by priority (ascending - lower numbers first) and then by creation date (descending - newest first)
    filtered.sort((a, b) => {
      // Sort by priority first (lower = higher priority)
      const priorityDiff = (a.priority || 10) - (b.priority || 10);
      if (priorityDiff !== 0) return priorityDiff;

      // If priority is the same, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredBanners(filtered);
  }, [banners, activeTab, activePlatform]);

  const handleDelete = (bannerId: string) => {
    setBanners(banners.filter((banner) => banner.public_id !== bannerId));
  };

  const handleEdit = (bannerId: string) => {
    const banner = banners.find((b) => b.public_id === bannerId);
    if (banner) {
      setSelectedBanner(banner);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSave = () => {
    setIsEditModalOpen(false);
    fetchBanners(); // Refresh the banner list
  };

  const handleClearFilters = () => {
    setActiveTab("all");
    setActivePlatform("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Website Banners</h2>
          <p className="text-muted-foreground">
            Manage banners that appear on your website.
          </p>
        </div>
        <Sheet open={isUploadSheetOpen} onOpenChange={setIsUploadSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Banner
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Upload New Banner</SheetTitle>
              <SheetDescription>
                Add a new banner to display on your website. Set schedule, priority,
                and visibility.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <BannerUploadForm />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-5 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap gap-2 ml-auto">
          <Tabs value={activePlatform} onValueChange={setActivePlatform}>
            <TabsList>
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="desktop">Desktop</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchBanners}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>

          {(activeTab !== "all" || activePlatform !== "all") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Banner List */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : filteredBanners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredBanners.map((banner) => (
              <BannerCard
                key={banner._id}
                banner={banner}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              activeTab === "active"
                ? Eye
                : activeTab === "scheduled"
                ? Calendar
                : activeTab === "expired"
                ? Clock
                : activeTab === "inactive"
                ? Settings
                : UploadCloud
            }
            title={
              activeTab === "all"
                ? "No banners found"
                : `No ${activeTab} banners found`
            }
            description={
              activeTab === "all"
                ? "Add your first banner to get started."
                : `There are no ${activeTab} banners matching your filters.`
            }
            action={
              activeTab === "all" ? (
                <Button onClick={() => setIsUploadSheetOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Banner
                </Button>
              ) : (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )
            }
          />
        )}
      </div>

      {/* Edit Modal */}
      <BannerEditModal
        banner={selectedBanner}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
      />
    </div>
  );
}
