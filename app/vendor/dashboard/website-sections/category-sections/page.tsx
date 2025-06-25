"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CategorySectionForm from "./category-section-form";

export default function CategorySectionsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchCategorySections = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("/api/admin/website-sections/category-sections");
        
        if (response.data.success) {
          setSections(response.data.sections);
        } else {
          toast({
            title: "Error",
            description: response.data.message || "Failed to load sections",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategorySections();
  }, [refreshKey, toast]);

  const handleCreateClick = () => {
    setSelectedSection(null);
    setDialogOpen(true);
  };

  const handleEditClick = (section: any) => {
    setSelectedSection(section);
    setDialogOpen(true);
  };

  const handleDeleteClick = (section: any) => {
    setSelectedSection(section);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSection) return;
    
    try {
      const response = await axios.delete(
        `/api/admin/website-sections/category-sections/${selectedSection._id}`
      );
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Category section deleted successfully",
        });
        setRefreshKey(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete section",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const getCategoryName = (section: any) => {
    return section.category?.name || "Unknown Category";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Category Sections</h1>
          <p className="text-muted-foreground">
            Manage category sections displayed on the website
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Section
        </Button>
      </div>
      
      <Separator className="my-6" />
      
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center p-12 border rounded-md">
          <h3 className="text-lg font-medium">No category sections found</h3>
          <p className="text-muted-foreground">
            Create your first category section to display on the website
          </p>
          <Button onClick={handleCreateClick} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Card key={section._id} className={section.isActive ? "" : "opacity-70"}>
              <CardHeader className="relative pb-2">
                <CardTitle className="text-xl">{section.title}</CardTitle>
                {!section.isActive && (
                  <div className="absolute top-4 right-6 bg-muted text-xs px-2 py-1 rounded-full">
                    Inactive
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-4">
                  <div className="text-sm">
                    <span className="font-medium">Category:</span> {getCategoryName(section)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Product Limit:</span> {section.productLimit}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Display Order:</span> {section.displayOrder}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(section)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(section)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSection ? "Edit Category Section" : "Create Category Section"}
            </DialogTitle>
            <DialogDescription>
              {selectedSection
                ? "Update this category section details"
                : "Create a new category section to display on the website"}
            </DialogDescription>
          </DialogHeader>
          <CategorySectionForm
            initialData={selectedSection}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category section "{selectedSection?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}