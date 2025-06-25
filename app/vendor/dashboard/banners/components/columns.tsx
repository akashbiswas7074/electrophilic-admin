"use client";

import { ColumnDef, Table as TableType, Row as RowType, Column as ColumnType } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button, ButtonProps } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, StatusType } from "@/components/ui/status-badge"; // Import StatusBadge
import Image from "next/image";

// Define the Banner type (mirroring the one in page.tsx or a central types file)
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean; // This will be mapped to StatusType
  link?: string;
  // Add other relevant banner properties here
  startDate?: string; // Added for consistency with website banners if needed
  endDate?: string;   // Added for consistency with website banners if needed
}

export const columns: ColumnDef<Banner>[] = [
  {
    id: "select",
    header: ({ table }: { table: TableType<Banner> }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: { row: RowType<Banner> }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }: { column: ColumnType<Banner, unknown> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }: { row: RowType<Banner> }) => {
      const banner = row.original;
      return (
        <div className="relative h-16 w-32 overflow-hidden rounded-md">
          {banner.imageUrl ? (
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              objectFit="cover"
              className="rounded-md" // Added for better image presentation
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground rounded-md">
              No Image
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }: { row: RowType<Banner> }) => {
      const banner = row.original;
      let statusType: StatusType = "Inactive";
      let statusLabel = "Inactive";

      const now = new Date();
      const startDate = banner.startDate ? new Date(banner.startDate) : null;
      const endDate = banner.endDate ? new Date(banner.endDate) : null;

      if (banner.isActive) {
        if (startDate && startDate > now) {
          statusType = "Scheduled";
          statusLabel = "Scheduled" // Simplified label for table view
        } else if (endDate && endDate < now) {
          statusType = "Expired";
          statusLabel = "Expired";
        } else {
          statusType = "Active";
          statusLabel = "Active";
        }
      } else {
        statusType = "Inactive";
        statusLabel = "Inactive";
      }
      
      // If start/end dates are not present, rely solely on isActive
      if (!banner.startDate && !banner.endDate) {
        if (banner.isActive) {
            statusType = "Active";
            statusLabel = "Active";
        } else {
            statusType = "Inactive";
            statusLabel = "Inactive";
        }
      }


      return <StatusBadge type={statusType} label={statusLabel} />;
    },
  },
  {
    accessorKey: "link",
    header: "Link",
    cell: ({ row }: { row: RowType<Banner> }) => {
      const link = row.getValue("link") as string | undefined;
      return link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View Link
        </a>
      ) : (
        <span className="text-muted-foreground">No Link</span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: RowType<Banner> }) => {
      const banner = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(banner.id)}
            >
              Copy Banner ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 hover:!text-red-600 hover:!bg-red-100 dark:hover:!bg-red-900 dark:hover:!text-red-100">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
