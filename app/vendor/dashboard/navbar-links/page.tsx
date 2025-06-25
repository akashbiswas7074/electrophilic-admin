"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getAllNavbarLinks, toggleNavbarLinkActive, deleteNavbarLink } from "@/lib/database/actions/admin/navbar-links/navbar-links.actions";
import { useState, useEffect } from "react";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import Link from "next/link";
import CreateNavbarLinkForm from "./create-form";

export default function NavbarLinksPage() {
  const [navbarLinks, setNavbarLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Fetch all navbar links
  const fetchNavbarLinks = async () => {
    setLoading(true);
    try {
      const result = await getAllNavbarLinks();
      if (result.success) {
        setNavbarLinks(result.navbarLinks);
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

  // Load navbar links on component mount
  useEffect(() => {
    fetchNavbarLinks();
  }, []);

  // Toggle navbar link active status
  const handleToggleActive = async (id: string) => {
    try {
      const result = await toggleNavbarLinkActive(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Navbar link status updated",
        });
        fetchNavbarLinks();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update navbar link status",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Delete navbar link
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this navbar link?")) {
      try {
        const result = await deleteNavbarLink(id);
        if (result.success) {
          toast({
            title: "Success",
            description: "Navbar link deleted successfully",
          });
          fetchNavbarLinks();
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to delete navbar link",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Navbar Links</h1>
          <p className="text-sm text-muted-foreground">
            Manage the navigation links that appear on your website.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <MdAdd size={18} />
          Add New Link
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : navbarLinks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">No navbar links found. Add your first link to get started.</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
              <MdAdd size={18} />
              Add New Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {navbarLinks.map((link) => (
            <Card key={link._id} className="overflow-hidden">
              <CardHeader className="p-4 pb-0 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-xl">{link.label}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="text-blue-600">{link.href}</span>
                    {link.isExternal && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">External</span>}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Active</span>
                  <Switch 
                    checked={link.isActive} 
                    onCheckedChange={() => handleToggleActive(link._id)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Order: {link.order}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/dashboard/navbar-links/edit/${link._id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <MdEdit size={16} />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleDelete(link._id)}
                    >
                      <MdDelete size={16} />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Navbar Link Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Navbar Link</h2>
            <CreateNavbarLinkForm
              onSuccess={() => {
                setIsCreateModalOpen(false);
                fetchNavbarLinks();
              }}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}