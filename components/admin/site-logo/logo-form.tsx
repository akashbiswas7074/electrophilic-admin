"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useWebsiteLogo } from "@/hooks/use-website-logo";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Define schema for logo form
const logoSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  logoUrl: z.string().url({ message: "Must be a valid URL" }),
  altText: z.string().min(1, { message: "Alt text is required" }),
  mobileLogoUrl: z.string().url({ message: "Must be a valid URL" }).optional(),
  isActive: z.boolean().default(false),
});

type LogoFormValues = z.infer<typeof logoSchema>;

export interface IWebsiteLogo {
  _id?: string;
  name: string;
  logoUrl: string;
  altText: string;
  mobileLogoUrl?: string;
  isActive: boolean;
}

interface LogoFormProps {
  initialData: IWebsiteLogo[];
}

export function LogoForm({ initialData = [] }: LogoFormProps) {
  const { toast } = useToast();
  const { refetch } = useWebsiteLogo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLogo, setActiveLogo] = useState<IWebsiteLogo | null>(
    initialData.find(logo => logo.isActive) || null
  );

  // Default values for the form
  const defaultValues: LogoFormValues = {
    name: "",
    logoUrl: "",
    altText: "",
    mobileLogoUrl: "",
    isActive: false,
  };

  const form = useForm<LogoFormValues>({
    resolver: zodResolver(logoSchema),
    defaultValues,
  });

  async function onSubmit(data: LogoFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/website/logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Logo saved successfully",
          variant: "default",
        });
        
        form.reset(defaultValues);
        refetch(); // Refresh logo data
      } else {
        throw new Error(result.message || "Failed to save logo");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving the logo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Function to handle setting a logo as active
  async function handleSetActive(id: string) {
    try {
      const response = await fetch(`/api/admin/website/logo/set-active/${id}`, {
        method: "PUT",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Logo set as active successfully",
          variant: "default",
        });
        
        refetch(); // Refresh logo data
        
        // Update the active logo locally
        const updatedActiveLogo = initialData.find(logo => logo._id === id) || null;
        setActiveLogo(updatedActiveLogo);
      } else {
        throw new Error(result.message || "Failed to set logo as active");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while setting the logo as active",
        variant: "destructive",
      });
    }
  }

  // Function to delete a logo
  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this logo?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/website/logo/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Logo deleted successfully",
          variant: "default",
        });
        
        refetch(); // Refresh logo data
        
        // If the deleted logo was active, clear the active logo state
        if (activeLogo && activeLogo._id === id) {
          setActiveLogo(null);
        }
      } else {
        throw new Error(result.message || "Failed to delete logo");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while deleting the logo",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Logo</CardTitle>
          <CardDescription>Upload a new logo for your website</CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Logo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mobileLogoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/mobile-logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Set as Active</FormLabel>
                      <CardDescription>
                        This logo will be displayed on your website
                      </CardDescription>
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
            </CardContent>
            
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                  </>
                ) : (
                  "Save Logo"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Existing Logos */}
      {initialData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Logos</CardTitle>
            <CardDescription>Manage your existing website logos</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {initialData.map((logo) => (
                <Card key={logo._id} className="overflow-hidden">
                  <div className="aspect-video w-full bg-gray-100 flex items-center justify-center p-4">
                    <img
                      src={logo.logoUrl}
                      alt={logo.altText}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{logo.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{logo.altText}</p>
                    {logo.isActive && (
                      <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                        Active
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between p-4 pt-0">
                    {!logo.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logo._id && handleSetActive(logo._id)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => logo._id && handleDelete(logo._id)}
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}