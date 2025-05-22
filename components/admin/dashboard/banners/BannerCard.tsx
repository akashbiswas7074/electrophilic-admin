"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CircleHelp, Pencil, Calendar, Hash, Link2, ExternalLink, Trash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  deleteAnyBannerId 
} from "@/lib/database/actions/admin/banners/banners.actions";
import { 
  toggleBannerActiveStatus,
  updateBannerPriority
} from "@/lib/database/actions/admin/banners/banner-settings.actions";

interface BannerCardProps {
  banner: {
    _id: string;
    url: string;
    public_id: string;
    platform: "desktop" | "mobile";
    linkUrl?: string;
    altText?: string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    isActive?: boolean;
    priority?: number;
    impressions?: number;
    clicks?: number;
    createdAt: string;
    updatedAt: string;
  };
  onEdit: (bannerId: string) => void;
  onDelete: (bannerId: string) => void;
}

export default function BannerCard({ banner, onEdit, onDelete }: BannerCardProps) {
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const today = new Date();
  
  // Convert dates to Date objects if they're strings
  const startDate = banner.startDate ? new Date(banner.startDate) : null;
  const endDate = banner.endDate ? new Date(banner.endDate) : null;
  
  // Determine banner status
  let status: "Active" | "Inactive" | "Scheduled" | "Expired" = "Active";
  
  if (banner.isActive === false) {
    status = "Inactive";
  } else if (startDate && startDate > today) {
    status = "Scheduled";
  } else if (endDate && endDate < today) {
    status = "Expired";
  }
  
  // Calculate CTR (Click-Through Rate) if we have impression data
  const ctr = banner.impressions && banner.impressions > 0
    ? ((banner.clicks || 0) / banner.impressions * 100).toFixed(2)
    : "N/A";
  
  const handleActiveToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleBannerActiveStatus(banner.public_id);
      if (result.success) {
        toast({
          title: "Status Updated",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update banner status",
      });
    } finally {
      setIsToggling(false);
    }
  };
  
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this banner?")) {
      setIsDeleting(true);
      try {
        const result = await deleteAnyBannerId(banner.public_id);
        if (result.success) {
          toast({
            title: "Banner Deleted",
            description: "The banner has been successfully deleted.",
          });
          onDelete(banner.public_id);
        } else {
          toast({
            variant: "destructive",
            title: "Delete Failed",
            description: result.message,
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete banner",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 border-green-300";
      case "Inactive": return "bg-gray-100 text-gray-800 border-gray-300";
      case "Scheduled": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Expired": return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <Image 
          src={banner.url} 
          alt={banner.altText || "Banner image"} 
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <Badge variant="outline" className={`${getStatusColor()} ml-auto`}>
            {status}
          </Badge>
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
            {banner.platform}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-start">
            <div className="font-medium truncate max-w-[70%]">
              {banner.altText || "Untitled Banner"}
            </div>
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Hash className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{banner.priority || 10}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Priority: {banner.priority || 10}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {banner.linkUrl && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />
              <span className="truncate flex-1">{banner.linkUrl}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => window.open(banner.linkUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open link in new tab</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>From: {format(startDate, "MMM d, yyyy")}</span>
              </div>
            )}
            
            {endDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>To: {format(endDate, "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
          
          {(banner.impressions !== undefined || banner.clicks !== undefined) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs border-t pt-2 mt-2">
              <div>Impressions: {banner.impressions || 0}</div>
              <div>Clicks: {banner.clicks || 0}</div>
              <div>CTR: {ctr}%</div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex justify-between items-center border-t">
        <div className="flex items-center space-x-2">
          <Switch
            id={`banner-active-${banner._id}`}
            checked={banner.isActive !== false}
            onCheckedChange={handleActiveToggle}
            disabled={isToggling}
          />
          <Label htmlFor={`banner-active-${banner._id}`}>Active</Label>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onEdit(banner.public_id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <CircleHelp className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onEdit(banner.public_id)}
                className="cursor-pointer"
              >
                Edit Banner
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="cursor-pointer text-destructive"
              >
                {isDeleting ? "Deleting..." : "Delete Banner"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}