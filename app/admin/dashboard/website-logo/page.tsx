"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllWebsiteLogos, setLogoAsActive } from "@/lib/database/actions/website.logo.actions";
import { IWebsiteLogo } from "@/lib/database/models/website.logo.model";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LogoUploadDialog from "./logo-upload-dialog";
import Image from "next/image";
import DeleteLogoDialog from "./delete-logo-dialog";

export default function WebsiteLogoPage() {
  const { toast } = useToast();
  const [logos, setLogos] = useState<IWebsiteLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [logoToDelete, setLogoToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch all logos
  const fetchLogos = async () => {
    setIsLoading(true);
    try {
      const result = await getAllWebsiteLogos();
      
      if (result.success) {
        setLogos(result.logos);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load logos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching logos:", error);
      toast({
        title: "Error",
        description: "Failed to load logos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  // Handle logo upload success
  const handleLogoUploaded = () => {
    fetchLogos();
    setIsUploadDialogOpen(false);
    toast({
      title: "Success",
      description: "Logo uploaded successfully",
    });
  };

  // Handle logo deletion success
  const handleLogoDeleted = () => {
    fetchLogos();
    setIsDeleteDialogOpen(false);
    toast({
      title: "Success",
      description: "Logo deleted successfully",
    });
  };

  // Open delete dialog
  const openDeleteDialog = (id: string) => {
    setLogoToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Set logo as active
  const handleSetActive = async (id: string) => {
    setIsUpdating(true);
    try {
      const result = await setLogoAsActive(id);
      
      if (result.success) {
        fetchLogos();
        toast({
          title: "Success",
          description: "Logo set as active successfully",
        });
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
        description: "Failed to set logo as active",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Website Logo Management</h1>
          <p className="text-muted-foreground">
            Upload and manage the logo that appears in the website navbar
          </p>
        </div>
        
        <Button onClick={() => setIsUploadDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle size={16} />
          Upload Logo
        </Button>
      </div>

      <Separator className="my-6" />

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-60 text-center text-muted-foreground">
              <p className="mb-4">No logos uploaded yet</p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>Upload First Logo</Button>
            </div>
          ) : (
            logos.map((logo) => (
              <Card key={logo._id} className={`overflow-hidden ${logo.isActive ? 'border-primary' : ''}`}>
                <div className="relative h-48 bg-muted flex items-center justify-center p-4">
                  <Image
                    src={logo.logoUrl}
                    alt={logo.altText}
                    width={200}
                    height={80}
                    style={{ objectFit: 'contain' }}
                  />
                  {logo.isActive && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs flex items-center">
                      <Check size={12} className="mr-1" />
                      Active
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold">{logo.name}</h3>
                    <p className="text-sm text-muted-foreground">{logo.altText}</p>
                    {logo.mobileLogoUrl && (
                      <p className="text-xs text-muted-foreground mt-1">Has mobile version</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!logo.isActive && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleSetActive(logo._id as string)}
                        disabled={isUpdating}
                      >
                        Set as active
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openDeleteDialog(logo._id as string)}
                      disabled={isUpdating}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <LogoUploadDialog 
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onLogoUploaded={handleLogoUploaded}
      />

      {/* Delete Dialog */}
      <DeleteLogoDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        logoId={logoToDelete}
        onLogoDeleted={handleLogoDeleted}
      />
    </div>
  );
}