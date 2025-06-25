"use client";

import React from "react"; // Added React import for React.use()
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllNavbarLinks, updateNavbarLink } from "@/lib/database/actions/admin/navbar-links/navbar-links.actions";
import { MdArrowBack } from "react-icons/md";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditNavbarLinkPageProps {
  params: Promise<{ id: string }>; // Updated to Promise type
}

export default function EditNavbarLinkPage({ params }: EditNavbarLinkPageProps) {
  const { id } = React.use(params); // Use React.use() to unwrap params
  const [formData, setFormData] = useState({
    label: "",
    href: "",
    order: 0,
    isActive: true,
    isExternal: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch the navbar link data
  useEffect(() => {
    const fetchNavbarLink = async () => {
      try {
        const result = await getAllNavbarLinks();
        if (result.success) {
          const navbarLink = result.navbarLinks.find((link: any) => link._id === id);
          if (navbarLink) {
            setFormData({
              label: navbarLink.label,
              href: navbarLink.href,
              order: navbarLink.order || 0,
              isActive: navbarLink.isActive ?? true,
              isExternal: navbarLink.isExternal ?? false,
            });
          } else {
            toast({
              title: "Error",
              description: "Navbar link not found",
              variant: "destructive",
            });
            router.push("/admin/dashboard/navbar-links");
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to fetch navbar links",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNavbarLink();
  }, [id, router, toast]); // Updated dependency

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value) || 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label.trim() || !formData.href.trim()) {
      toast({
        title: "Validation Error",
        description: "Label and link URL are required fields",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const result = await updateNavbarLink(id, formData); // Use id directly
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Navbar link updated successfully",
        });
        router.push("/admin/dashboard/navbar-links");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update navbar link",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push("/admin/dashboard/navbar-links")}
        >
          <MdArrowBack size={18} />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Navbar Link</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit "{formData.label}"</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Link Text</Label>
              <Input
                id="label"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                placeholder="e.g. Home, About, Shop"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="href">Link URL</Label>
              <Input
                id="href"
                name="href"
                value={formData.href}
                onChange={handleInputChange}
                placeholder="e.g. /shop, /contact"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleNumberChange}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500">
                Lower numbers appear first in the navigation menu
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isExternal" className="cursor-pointer">External Link</Label>
                <Switch
                  id="isExternal"
                  checked={formData.isExternal}
                  onCheckedChange={(checked) => handleSwitchChange("isExternal", checked)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/admin/dashboard/navbar-links")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <span className="animate-spin mr-2">⊚</span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}