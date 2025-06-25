import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Banner, columns } from "../components/columns"; // Corrected import path
import { DataTable } from "../components/data-table"; // Corrected import path

// Placeholder for fetching banners - replace with your actual data fetching logic
async function getBanners(): Promise<Banner[]> {
  // Example: Simulate API call delay and return sample data
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
  return [
    {
      id: "1",
      title: "Summer Sale Special",
      imageUrl: "https://via.placeholder.com/300x150/FFD700/000000?Text=Summer+Sale",
      isActive: true,
      link: "/sales/summer",
    },
    {
      id: "2",
      title: "New Collection Launch",
      imageUrl: "https://via.placeholder.com/300x150/87CEEB/FFFFFF?Text=New+Collection",
      isActive: true,
      link: "/collections/new",
    },
    {
      id: "3",
      title: "Flash Deal Friday",
      imageUrl: "https://via.placeholder.com/300x150/FF6347/FFFFFF?Text=Flash+Deal",
      isActive: false,
    },
    {
      id: "4",
      title: "Holiday Specials",
      imageUrl: "https://via.placeholder.com/300x150/32CD32/FFFFFF?Text=Holiday+Specials",
      isActive: true,
      link: "/holidays",
    },
    {
      id: "5",
      title: "Limited Stock Alert",
      imageUrl: "",
      isActive: true,
      link: "/alerts/stock",
    }, // Example with no image
  ];
}

export default async function BannersPage() {
  const banners = await getBanners();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Manage Banners
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, update, and manage your promotional banners.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New Banner
          </Button>
        </div>
      </div>

      {banners.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8 py-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight">
              No Banners Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              You haven&apos;t added any banners. Click the button below to add your first banner.
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add New Banner
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6"> {/* Adjusted margin */}
          <DataTable columns={columns} data={banners} searchKey="title" />
        </div>
      )}
    </div>
  );
}
