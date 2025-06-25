"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { IWebsiteSection } from "@/lib/database/models/website.section.model";
import { createWebsiteSection } from "@/lib/database/actions/website.section.actions";
import { availableSections, addDynamicHeroSectionsToAvailable } from "./section-data";
import { getAllHeroSections } from "@/lib/database/actions/hero-section.actions";

// Form schema for validation
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  sectionId: z.string().min(1, { message: "Section ID is required" }),
  description: z.string().optional(),
  order: z.coerce.number().int().min(0),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionCreated: () => void;
}

export default function CreateSectionDialog({
  open,
  onOpenChange,
  onSectionCreated,
}: CreateSectionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [heroSections, setHeroSections] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingHeroSections, setIsLoadingHeroSections] = useState(false);
  const [availableSectionOptions, setAvailableSectionOptions] = useState<any[]>(availableSections);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sectionId: "",
      description: "",
      order: 999, // Default to end of list
      categoryId: "",
    },
  });

  // Fetch categories and hero sections for the dropdowns
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;

      setIsLoadingCategories(true);
      setIsLoadingHeroSections(true);
      
      try {
        // Fetch categories
        const categoryResponse = await fetch("/api/admin/categories");
        const categoryData = await categoryResponse.json();
        
        if (categoryData.success) {
          setCategories(categoryData.categories || []);
        } else {
          console.error("Failed to fetch categories:", categoryData.message);
          toast({
            title: "Warning",
            description: "Could not load categories. Some features may be limited.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching categories:", 
          error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoadingCategories(false);
      }

      // Fetch hero sections using the new API endpoint instead of server action
      try {
        const response = await fetch("/api/admin/hero-sections");
        const data = await response.json();
        
        if (data.success && Array.isArray(data.sections)) {
          setHeroSections(data.sections);
          
          // Update available sections with hero sections
          const updatedOptions = [
            ...availableSections,
            ...data.sections.map(section => ({
              id: `dynamic-hero-section-${section._id}`,
              name: `Hero: ${(section.title || "").substring(0, 20)}${(section.title || "").length > 20 ? '...' : ''}`,
              description: (section.subtitle || "").substring(0, 40) + ((section.subtitle || "").length > 40 ? '...' : '')
            }))
          ];
          
          setAvailableSectionOptions(updatedOptions);
        } else {
          console.error("Failed to fetch hero sections:", data.message || "Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching hero sections:", 
          error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoadingHeroSections(false);
      }
    };

    fetchData();
  }, [open, toast]);

  // Auto-fill form based on section selection
  const handleSectionSelect = (sectionId: string) => {
    const selectedSection = availableSectionOptions.find(section => section.id === sectionId);
    
    if (selectedSection) {
      form.setValue("name", selectedSection.name);
      form.setValue("sectionId", selectedSection.id);
      form.setValue("description", selectedSection.description || "");
    }
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Check if this is a dynamic hero section and extract the hero section ID
      const heroSectionId = values.sectionId.startsWith('dynamic-hero-section-') 
        ? values.sectionId.replace('dynamic-hero-section-', '')
        : undefined;
      
      const sectionData: IWebsiteSection = {
        name: values.name,
        sectionId: values.sectionId,
        isVisible: true,
        order: values.order,
        description: values.description,
        categoryId: values.categoryId || undefined,
        heroSectionId: heroSectionId, // Store the hero section ID if this is a dynamic hero section
      };

      const result = await createWebsiteSection(sectionData);
      
      if (result.success) {
        form.reset();
        onSectionCreated();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create section",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating section:", error);
      toast({
        title: "Error",
        description: "Failed to create section",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Website Section</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Hero Banner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. heroBanner" 
                      {...field} 
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this section" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isLoadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category (optional)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Sections</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleSectionSelect(value);
                    }} 
                    value={field.value}
                    disabled={isLoadingHeroSections}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingHeroSections ? "Loading sections..." : "Select an available section"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableSectionOptions.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Section"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}