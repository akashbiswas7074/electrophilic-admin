"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { getAllWebsiteSections, updateSectionOrder, toggleSectionVisibility } from "@/lib/database/actions/website.section.actions";
import { initializeDefaultSections } from "@/lib/database/actions/initialize-sections.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function HomepageSectionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch all sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const result = await getAllWebsiteSections();
      
      if (result.success) {
        // Sort sections by order
        const sortedSections = [...result.sections].sort((a, b) => a.order - b.order);
        setSections(sortedSections);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load website sections",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching website sections:", error);
      toast({
        title: "Error",
        description: "Failed to load website sections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize default sections if needed
  const handleInitializeSections = async () => {
    setInitializing(true);
    try {
      const result = await initializeDefaultSections();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Homepage sections initialized successfully",
        });
        // Refresh the sections list
        fetchSections();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to initialize sections",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error initializing sections:", error);
      toast({
        title: "Error",
        description: "Failed to initialize sections",
        variant: "destructive",
      });
    } finally {
      setInitializing(false);
    }
  };

  // Toggle section visibility
  const handleToggleVisibility = async (id: string) => {
    setUpdating(true);
    try {
      const result = await toggleSectionVisibility(id);
      
      if (result.success) {
        fetchSections();
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
      setUpdating(false);
    }
  };

  // Move section up or down in order
  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(section => section._id === id);
    if (currentIndex === -1) return;

    // Can't move up if already at top
    if (direction === 'up' && currentIndex === 0) return;
    // Can't move down if already at bottom
    if (direction === 'down' && currentIndex === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap the positions
    [newSections[currentIndex], newSections[targetIndex]] = 
    [newSections[targetIndex], newSections[currentIndex]];

    // Update the order values to match their new positions
    const sectionsWithUpdatedOrder = newSections.map((section, index) => ({
      ...section,
      order: (index + 1) * 10 // Use multiples of 10 to leave space between
    }));

    // Get all section IDs in the new order
    const orderedIds = sectionsWithUpdatedOrder.map(section => section._id as string);

    setUpdating(true);
    try {
      const result = await updateSectionOrder(orderedIds);
      
      if (result.success) {
        // Update local state to reflect the new order
        setSections(sectionsWithUpdatedOrder);
        toast({
          title: "Success",
          description: "Section order updated successfully",
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
      setUpdating(false);
    }
  };

  // Load sections on page load
  useEffect(() => {
    fetchSections();
  }, []);

  // Filter only visible sections for preview
  const visibleSections = sections.filter(section => section.isVisible);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Homepage Sections Management</h1>
          <p className="text-gray-500 mt-1">
            Control which sections appear on the homepage and their display order
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2"
          >
            <Eye size={16} />
            Preview Layout
          </Button>
          <Button
            onClick={handleInitializeSections}
            disabled={initializing}
            variant="default"
          >
            {initializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              "Initialize Default Sections"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Homepage Sections</CardTitle>
          <CardDescription>
            Drag and drop sections to change their order, or toggle visibility to show/hide them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Section ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px] text-center">Visible</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No sections found. Click "Initialize Default Sections" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sections.map((section) => (
                      <TableRow key={section._id} className={!section.isVisible ? "bg-gray-50" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMoveSection(section._id, 'up')}
                              disabled={updating || sections.indexOf(section) === 0}
                            >
                              <ArrowUp size={14} />
                            </Button>
                            <div className="text-sm font-mono py-1">{section.order}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMoveSection(section._id, 'down')}
                              disabled={updating || sections.indexOf(section) === sections.length - 1}
                            >
                              <ArrowDown size={14} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{section.name}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {section.sectionId}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {section.description || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={section.isVisible}
                            onCheckedChange={() => handleToggleVisibility(section._id)}
                            disabled={updating}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={section.isVisible ? "ghost" : "outline"}
                            size="sm"
                            onClick={() => handleToggleVisibility(section._id)}
                            disabled={updating}
                            className="h-8 w-8 p-0"
                          >
                            {section.isVisible ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Homepage Layout Preview</DialogTitle>
            <DialogDescription>
              This is how your homepage sections will appear based on current visibility and order settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 border rounded-md p-4 max-h-[60vh] overflow-y-auto">
            {visibleSections.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No visible sections. The homepage will appear empty or use fallback content.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
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
                        Category: {typeof section.categoryId === 'object' ? section.categoryId.name : section.categoryId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}