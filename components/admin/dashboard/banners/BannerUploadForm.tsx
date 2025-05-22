"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadWebsiteBannerImages } from "@/lib/database/actions/admin/banners/banners.actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function BannerUploadForm() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [platform, setPlatform] = useState<"desktop" | "mobile">("desktop");
  const [linkUrl, setLinkUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [priority, setPriority] = useState<number>(10); // Default priority
  const [isActive, setIsActive] = useState<boolean>(true); // Default active
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [imagePreviews, setImagePreviews] = useState<
    { url: string; file: File }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);
    const newPreviews = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index].url);
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (imagePreviews.length === 0) {
      toast({
        variant: "destructive",
        title: "No images selected",
        description: "Please select at least one image to upload.",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert images to base64
      const dataUrls = await Promise.all(
        imagePreviews.map((preview) => {
          return new Promise<{ data: string; type: string }>(
            (resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  data: reader.result as string,
                  type: preview.file.type,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(preview.file);
            }
          );
        })
      );

      // Upload images with all parameters
      const result = await uploadWebsiteBannerImages(
        dataUrls,
        platform,
        linkUrl || undefined,
        altText || undefined,
        startDate ? startDate.toISOString() : undefined,
        endDate ? endDate.toISOString() : undefined,
        priority,
        isActive
      );

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: `Successfully uploaded ${result.successfulUploads.length} banner(s)`,
        });

        // Clear form after successful upload
        setImagePreviews([]);
        setLinkUrl("");
        setAltText("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: `Failed to upload ${result.failedUploads?.length || 0} banner(s)`,
        });
      }
    } catch (error) {
      console.error("Error uploading banners:", error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "An unexpected error occurred during upload.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={platform}
          onValueChange={(value: "desktop" | "mobile") => setPlatform(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the platform where this banner will be displayed
        </p>
      </div>

      <div>
        <Label htmlFor="linkUrl">Link URL (Optional)</Label>
        <Input
          id="linkUrl"
          placeholder="https://example.com/page"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Where users will go when they click on the banner
        </p>
      </div>

      <div>
        <Label htmlFor="altText">Alt Text (Optional)</Label>
        <Input
          id="altText"
          placeholder="Brief description of banner"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
        />
        <p className="text-sm text-muted-foreground mt-1">
          For accessibility and SEO purposes
        </p>
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={priority.toString()}
          onValueChange={(value) => setPriority(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5, 10, 20, 50, 100].map((p) => (
              <SelectItem key={p} value={p.toString()}>
                {p} {p === 0 ? "(Highest)" : p === 100 ? "(Lowest)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          Lower numbers = higher priority (shown first)
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="isActive">Active</Label>
        <span className="text-sm text-muted-foreground ml-2">
          {isActive ? "Banner will be visible" : "Banner will be hidden"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="startDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "No start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground mt-1">
            When the banner will start displaying (leave blank for immediate)
          </p>
          {startDate && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => setStartDate(undefined)}
            >
              Clear
            </Button>
          )}
        </div>

        <div>
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="endDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "No end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground mt-1">
            When the banner will stop displaying (leave blank for no end date)
          </p>
          {endDate && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => setEndDate(undefined)}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="bannerImages">Banner Images</Label>
        <div className="mt-2 flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="bannerImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="max-w-md"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse
          </Button>
        </div>
      </div>

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-video rounded-md overflow-hidden border">
                <Image
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {preview.file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        onClick={handleUpload}
        disabled={isUploading || imagePreviews.length === 0}
        className="mt-4"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Upload Banners
          </>
        )}
      </Button>
    </div>
  );
}