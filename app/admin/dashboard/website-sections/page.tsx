"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllWebsiteSections } from "@/lib/database/actions/website.section.actions";
import { IWebsiteSection } from "@/lib/database/models/website.section.model";
import WebsiteSectionsList from "./sections-list";
import { Separator } from "@/components/ui/separator";
import CreateSectionDialog from "./create-section-dialog";
import CategoricalSectionsList from "./categorical-sections-list";
import { Loader2 } from "lucide-react";

export default function WebsiteSectionsPage() {
  const { toast } = useToast();
  const [sections, setSections] = useState<IWebsiteSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Filter sections by type
  const generalSections = sections.filter(section => !section.categoryId);
  const categoricalSections = sections.filter(section => section.categoryId);

  // Fetch all sections
  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const result = await getAllWebsiteSections();
      
      if (result.success) {
        setSections(result.sections);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Handle section creation success
  const handleSectionCreated = () => {
    fetchSections();
    setIsCreateDialogOpen(false);
    toast({
      title: "Success",
      description: "Section created successfully",
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Website Sections Management</h1>
          <p className="text-muted-foreground">
            Manage website sections visibility and order
          </p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle size={16} />
          Add Section
        </Button>
      </div>

      <Separator className="my-6" />

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General Sections</TabsTrigger>
            <TabsTrigger value="categorical">Categorical Sections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <WebsiteSectionsList 
              sections={generalSections} 
              onSectionChanged={fetchSections} 
            />
          </TabsContent>
          
          <TabsContent value="categorical">
            <CategoricalSectionsList 
              sections={categoricalSections} 
              onSectionChanged={fetchSections} 
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Create Section Dialog */}
      <CreateSectionDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSectionCreated={handleSectionCreated}
      />
    </div>
  );
}