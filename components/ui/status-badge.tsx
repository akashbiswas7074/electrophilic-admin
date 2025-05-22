"use client";

import { cn } from "@/lib/utils";

// Define the possible status types
export type StatusType = "Active" | "Inactive" | "Scheduled" | "Expired";

interface StatusBadgeProps {
  type: StatusType;
  label: string;
  className?: string;
}

export function StatusBadge({ type, label, className }: StatusBadgeProps) {
  // Define colors for different status types
  const statusStyles = {
    Active: "bg-green-100 text-green-800 border-green-300",
    Inactive: "bg-gray-100 text-gray-800 border-gray-300",
    Scheduled: "bg-blue-100 text-blue-800 border-blue-300",
    Expired: "bg-amber-100 text-amber-800 border-amber-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[type],
        className
      )}
    >
      {label}
    </span>
  );
}
