"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MdAdd, MdDelete, MdEdit, MdExpandMore, MdExpandLess } from 'react-icons/md';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getAllHeroSections, toggleHeroSectionActive, deleteHeroSection, updateHeroSectionOrder } from './hero-section.actions';
import HeroSectionPreview from './hero-section-preview';

export default function HeroSectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch hero sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const result = await getAllHeroSections();
      if (result.success && result.sections) {
        setSections(result.sections);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch hero sections",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Handle toggling section active status
  const handleToggleActive = async (id: string) => {
    try {
      const result = await toggleHeroSectionActive(id);
      if (result.success) {
        // Update the local state
        setSections(sections.map(section => 
          section._id === id ? { ...section, isActive: !section.isActive } : section
        ));
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to toggle section status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a section
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this hero section? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await deleteHeroSection(id);
      if (result.success) {
        // Remove the deleted section from local state
        setSections(sections.filter(section => section._id !== id));
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
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle changing the order of sections
  const handleMoveUp = async (index: number) => {
    if (index === 0) return; // Already at the top
    
    const updatedSections = [...sections];
    [updatedSections[index - 1], updatedSections[index]] = [updatedSections[index], updatedSections[index - 1]];
    setSections(updatedSections);
    
    // Update order in backend
    const orderedIds = updatedSections.map(section => section._id);
    await updateHeroSectionOrder(orderedIds);
  };

  const handleMoveDown = async (index: number) => {
    if (index === sections.length - 1) return; // Already at the bottom
    
    const updatedSections = [...sections];
    [updatedSections[index], updatedSections[index + 1]] = [updatedSections[index + 1], updatedSections[index]];
    setSections(updatedSections);
    
    // Update order in backend
    const orderedIds = updatedSections.map(section => section._id);
    await updateHeroSectionOrder(orderedIds);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hero Sections</h1>
        <Link href="/admin/dashboard/hero-sections/add">
          <Button className="flex items-center gap-2">
            <MdAdd size={20} />
            Add New Section
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading hero sections...</div>
      ) : sections.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <p className="mb-4">No hero sections found. Create your first one!</p>
            <Link href="/admin/dashboard/hero-sections/add">
              <Button className="flex items-center gap-2">
                <MdAdd size={20} />
                Add Hero Section
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {sections.map((section, index) => (
            <Card key={section._id} className="overflow-hidden">
              <CardHeader className="p-4 bg-muted/50">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>Order: {section.order}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={section.isActive} 
                        onCheckedChange={() => handleToggleActive(section._id)}
                      />
                      <span className="text-sm">{section.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <MdExpandLess size={20} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sections.length - 1}
                    >
                      <MdExpandMore size={20} />
                    </Button>
                    <Link href={`/admin/dashboard/hero-sections/edit/${section._id}`}>
                      <Button variant="outline" size="icon">
                        <MdEdit size={20} />
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => handleDelete(section._id)}
                    >
                      <MdDelete size={20} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <HeroSectionPreview data={section} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}