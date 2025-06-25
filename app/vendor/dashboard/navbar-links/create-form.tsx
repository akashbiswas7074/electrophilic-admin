"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createNavbarLink } from "@/lib/database/actions/admin/navbar-links/navbar-links.actions";
import { useState } from "react";

interface CreateNavbarLinkFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateNavbarLinkForm({ onSuccess, onCancel }: CreateNavbarLinkFormProps) {
  const [formData, setFormData] = useState({
    label: "",
    href: "",
    order: 0,
    isActive: true,
    isExternal: false,
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    
    setLoading(true);
    try {
      const result = await createNavbarLink(formData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Navbar link created successfully",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create navbar link",
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

  return (
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
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="animate-spin mr-2">⊚</span>
              Creating...
            </>
          ) : (
            "Create Link"
          )}
        </Button>
      </div>
    </form>
  );
}