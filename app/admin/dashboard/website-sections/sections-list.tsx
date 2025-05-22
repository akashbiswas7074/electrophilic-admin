"use client";

import React, { useState } from "react";
import { IWebsiteSection } from "@/lib/database/models/website.section.model";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  toggleSectionVisibility,
  deleteWebsiteSection,
  updateSectionOrder,
} from "@/lib/database/actions/website.section.actions";
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
import EditSectionDialog from "./edit-section-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface WebsiteSectionsListProps {
  sections: IWebsiteSection[];
  onSectionChanged: () => void;
}

export default function WebsiteSectionsList({ 
  sections, 
  onSectionChanged 
}: WebsiteSectionsListProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<IWebsiteSection | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Handle section visibility toggle
  const handleToggleVisibility = async (id: string) => {
    setIsUpdating(true);
    try {
      const result = await toggleSectionVisibility(id);
      
      if (result.success) {
        onSectionChanged();
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to toggle section visibility",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling section visibility:", error);
      toast({
        title: "Error",
        description: "Failed to toggle section visibility",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: string) => {
    setSectionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle section deletion
  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    
    setIsUpdating(true);
    try {
      const result = await deleteWebsiteSection(sectionToDelete);
      
      if (result.success) {
        onSectionChanged();
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete section",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (section: IWebsiteSection) => {
    setSectionToEdit(section);
    setIsEditDialogOpen(true);
  };

  // Handle section edit success
  const handleSectionEdited = () => {
    onSectionChanged();
    setIsEditDialogOpen(false);
    toast({
      title: "Success",
      description: "Section updated successfully",
    });
  };

  // Handle changing section order
  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(section => section._id === id);
    if (currentIndex === -1) return;

    // Can't move up if already at the top
    if (direction === 'up' && currentIndex === 0) return;
    // Can't move down if already at the bottom
    if (direction === 'down' && currentIndex === sections.length - 1) return;

    // Create a new array with the reordered sections
    const reorderedSections = [...sections];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap the positions
    [reorderedSections[currentIndex], reorderedSections[targetIndex]] = 
    [reorderedSections[targetIndex], reorderedSections[currentIndex]];

    // Get all section IDs in the new order
    const orderedIds = reorderedSections.map(section => section._id as string);

    setIsUpdating(true);
    try {
      const result = await updateSectionOrder(orderedIds);
      
      if (result.success) {
        onSectionChanged();
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update section order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating section order:", error);
      toast({
        title: "Error",
        description: "Failed to update section order",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open preview dialog
  const openPreviewDialog = () => {
    setIsPreviewOpen(true);
  };

  // Get only visible sections sorted by order
  const visibleSections = [...sections]
    .filter(section => section.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Sections ({sections.length})</h3>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={openPreviewDialog}
        >
          <Eye size={16} /> Preview Layout
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Section ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Visible</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No sections found. Add your first section.
                </TableCell>
              </TableRow>
            ) : (
              sections.sort((a, b) => (a.order || 0) - (b.order || 0)).map((section) => (
                <TableRow key={section._id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveSection(section._id as string, 'up')}
                        disabled={isUpdating || sections.indexOf(section) === 0}
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <span className="text-xs">{section.order}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveSection(section._id as string, 'down')}
                        disabled={isUpdating || sections.indexOf(section) === sections.length - 1}
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{section.name}</TableCell>
                  <TableCell className="font-mono text-xs">{section.sectionId}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{section.description || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={section.isVisible}
                      onCheckedChange={() => handleToggleVisibility(section._id as string)}
                      disabled={isUpdating}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(section)}
                        disabled={isUpdating}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => openDeleteDialog(section._id as string)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Section Dialog */}
      {sectionToEdit && (
        <EditSectionDialog
          section={sectionToEdit}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSectionEdited={handleSectionEdited}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Homepage Layout Preview</DialogTitle>
            <DialogDescription>
              This is how your homepage sections will appear based on current visibility and order settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 border rounded-md p-4 max-h-[60vh] overflow-y-auto">
            {visibleSections.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No visible sections. The homepage will use the default layout.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-6">
                  Sections will appear in the following order (top to bottom):
                </div>
                
                {visibleSections.map((section, index) => (
                  <div 
                    key={section._id}
                    className="flex items-center gap-4 p-3 bg-secondary/30 rounded-md border"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{section.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {section.sectionId}
                      </div>
                    </div>
                    {section.categoryId && (
                      <div className="px-2 py-1 rounded-md bg-primary/10 text-xs">
                        Category Section
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewOpen(false)}
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}