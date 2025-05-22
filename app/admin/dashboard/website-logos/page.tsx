"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Loader2, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { 
  createWebsiteLogo, 
  deleteWebsiteLogo, 
  getAllWebsiteLogos, 
  setLogoAsActive 
} from '@/lib/database/actions/website.logo.actions';
import ImageUploader from '@/components/admin/ImageUploader';

interface WebsiteLogo {
  _id: string;
  name: string;
  logoUrl: string;
  altText: string;
  isActive: boolean;
  mobileLogoUrl?: string;
}

export default function WebsiteLogosPage() {
  const { toast } = useToast();
  const [logos, setLogos] = useState<WebsiteLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    altText: '',
    mobileLogoUrl: '',
    isActive: false,
  });

  // Fetch all logos when the component mounts
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        setIsLoading(true);
        const result = await getAllWebsiteLogos();
        
        if (result.success) {
          setLogos(result.logos);
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to fetch logos",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching logos:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while fetching logos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogos();
  }, []);

  // Handle input change in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle logo image upload
  const handleLogoUpload = (url: string) => {
    setFormData({
      ...formData,
      logoUrl: url,
    });
  };

  // Handle mobile logo image upload
  const handleMobileLogoUpload = (url: string) => {
    setFormData({
      ...formData,
      mobileLogoUrl: url,
    });
  };

  // Handle form submission to create a new logo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.logoUrl || !formData.altText) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and upload a logo image",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await createWebsiteLogo(formData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Logo created successfully",
        });
        
        // Reset form and reload logos
        setFormData({
          name: '',
          logoUrl: '',
          altText: '',
          mobileLogoUrl: '',
          isActive: false,
        });
        
        // Add the new logo to the list
        if (result.logo) {
          setLogos([result.logo, ...logos]);
        }
        
        // If the new logo is active, update the active state for all logos
        if (formData.isActive && result.logo) {
          setLogos(prevLogos => 
            prevLogos.map(logo => ({
              ...logo,
              isActive: logo._id === result.logo._id,
            }))
          );
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create logo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating logo:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the logo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle setting a logo as active
  const handleSetActive = async (id: string) => {
    try {
      const result = await setLogoAsActive(id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Logo set as active successfully",
        });
        
        // Update logos in the state
        setLogos(logos.map(logo => ({
          ...logo,
          isActive: logo._id === id,
        })));
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to set logo as active",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error setting logo as active:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while setting the logo as active",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a logo
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this logo?")) {
      return;
    }
    
    try {
      const result = await deleteWebsiteLogo(id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Logo deleted successfully",
        });
        
        // Remove the deleted logo from the state
        setLogos(logos.filter(logo => logo._id !== id));
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete logo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the logo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Website Logo Management</h1>
      
      <Tabs defaultValue="existing">
        <TabsList className="mb-6">
          <TabsTrigger value="existing">Existing Logos</TabsTrigger>
          <TabsTrigger value="add-new">Add New Logo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="existing">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : logos.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No logos found. Add your first website logo.</p>
              </div>
            ) : (
              logos.map((logo) => (
                <Card key={logo._id} className={`overflow-hidden ${logo.isActive ? 'border-green-500 border-2' : ''}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center">
                      <span>{logo.name}</span>
                      {logo.isActive && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{logo.altText}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-xs font-medium text-gray-500 mb-2">Logo:</p>
                    <div className="relative h-20 w-full">
                      <Image 
                        src={logo.logoUrl} 
                        alt={logo.altText}
                        className="object-contain"
                        fill
                      />
                    </div>
                    
                    {logo.mobileLogoUrl && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Mobile Logo:</p>
                        <div className="relative h-16 w-full">
                          <Image 
                            src={logo.mobileLogoUrl} 
                            alt={`Mobile version of ${logo.altText}`}
                            className="object-contain"
                            fill
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-4 flex justify-between">
                    {!logo.isActive && (
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetActive(logo._id)}
                        className="mr-2 flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Set as Active
                      </Button>
                    )}
                    <Button
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(logo._id)}
                      className={`${!logo.isActive ? 'flex-1' : 'w-full'}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="add-new">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add New Website Logo</CardTitle>
                <CardDescription>
                  Upload a new logo for your website. It will appear in the navbar and footer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Logo Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Main Brand Logo"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altText">Alt Text</Label>
                    <Input
                      id="altText"
                      name="altText"
                      placeholder="e.g., Company Name Logo"
                      value={formData.altText}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Main Logo Upload */}
                  <ImageUploader
                    label="Main Logo"
                    helpText="Recommended size: 160x40px with transparent background"
                    existingImageUrl={formData.logoUrl}
                    onUploadComplete={handleLogoUpload}
                  />
                  
                  {/* Mobile Logo Upload (Optional) */}
                  <ImageUploader
                    label="Mobile Logo (Optional)"
                    helpText="Optional logo for mobile devices"
                    existingImageUrl={formData.mobileLogoUrl}
                    onUploadComplete={handleMobileLogoUpload}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isActive" 
                    name="isActive"
                    checked={formData.isActive} 
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Set as active logo</Label>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" disabled={isSubmitting || !formData.logoUrl}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Save Logo
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}