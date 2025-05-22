"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { IWebsiteLogo } from "@/lib/database/models/website.logo.model";
import { createWebsiteLogo } from "@/lib/database/actions/website.logo.actions";

// Form schema for validation
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  logoUrl: z.string().url({ message: "Please enter a valid URL" }),
  altText: z.string().min(1, { message: "Alt text is required" }),
  isActive: z.boolean().default(false),
  mobileLogoUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface LogoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogoUploaded: () => void;
}

export default function LogoUploadDialog({
  open,
  onOpenChange,
  onLogoUploaded,
}: LogoUploadDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [uploadedMobileLogoUrl, setUploadedMobileLogoUrl] = useState<string | null>(null);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      altText: "Company Logo",
      isActive: true,
      mobileLogoUrl: "",
    },
  });

  // Image upload handler (for main logo)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'logos');

    try {
      // Upload to your API endpoint
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      // Set the URL in the form
      form.setValue('logoUrl', data.url);
      setUploadedLogoUrl(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Image upload handler (for mobile logo)
  const handleMobileLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'logos');

    try {
      // Upload to your API endpoint
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      // Set the URL in the form
      form.setValue('mobileLogoUrl', data.url);
      setUploadedMobileLogoUrl(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const logoData: IWebsiteLogo = {
        name: values.name,
        logoUrl: values.logoUrl,
        altText: values.altText,
        isActive: values.isActive,
        mobileLogoUrl: values.mobileLogoUrl || undefined,
      };

      const result = await createWebsiteLogo(logoData);
      
      if (result.success) {
        form.reset();
        setUploadedLogoUrl(null);
        setUploadedMobileLogoUrl(null);
        onLogoUploaded();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to upload logo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Website Logo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Primary Logo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Main Logo Upload */}
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input 
                          type="text"
                          placeholder="Enter logo URL or upload" 
                          {...field}
                        />
                        <div className="relative">
                          <Input 
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                          <Button type="button" variant="outline">
                            <UploadCloud className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      {uploadedLogoUrl && (
                        <div className="max-w-xs h-20 bg-muted rounded-md flex items-center justify-center">
                          <img 
                            src={uploadedLogoUrl} 
                            alt="Uploaded logo preview" 
                            className="max-h-full max-w-full p-2" 
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile Logo Upload (Optional) */}
            <FormField
              control={form.control}
              name="mobileLogoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Logo (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input 
                          type="text"
                          placeholder="Enter mobile logo URL or upload" 
                          {...field}
                          value={field.value || ""}
                        />
                        <div className="relative">
                          <Input 
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={handleMobileLogoUpload}
                          />
                          <Button type="button" variant="outline">
                            <UploadCloud className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      {uploadedMobileLogoUrl && (
                        <div className="max-w-xs h-20 bg-muted rounded-md flex items-center justify-center">
                          <img 
                            src={uploadedMobileLogoUrl} 
                            alt="Uploaded mobile logo preview" 
                            className="max-h-full max-w-full p-2" 
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a separate logo version for mobile devices (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="altText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt Text</FormLabel>
                  <FormControl>
                    <Input placeholder="Company Logo" {...field} />
                  </FormControl>
                  <FormDescription>
                    Text for accessibility when image cannot be displayed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Set as active logo
                    </FormLabel>
                    <FormDescription>
                      When active, this logo will be displayed in the website navigation bar
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Logo"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}