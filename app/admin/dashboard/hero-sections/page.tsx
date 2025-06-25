"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MdAdd, MdDelete, MdEdit, MdExpandMore, MdExpandLess, MdSearch, MdRefresh, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import HeroSectionPreview from './hero-section-preview';
import { Loader2 } from 'lucide-react';

export default function HeroSectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { toast } = useToast();
  const router = useRouter();

  // Fetch hero sections using the new API
  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/hero-sections');
      const result = await response.json();
      
      if (result.success && result.sections) {
        setSections(result.sections);
        setFilteredSections(result.sections);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch hero sections",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching hero sections:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading sections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Filter sections based on search and status
  useEffect(() => {
    let filtered = [...sections];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(section => 
        statusFilter === 'active' ? section.isActive : !section.isActive
      );
    }
    
    setFilteredSections(filtered);
  }, [sections, searchTerm, statusFilter]);

  // Handle toggling section active status
  const handleToggleActive = async (id: string) => {
    try {
      const section = sections.find(s => s._id === id);
      if (!section) return;

      const response = await fetch(`/api/admin/hero-sections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...section,
          isActive: !section.isActive
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the local state
        setSections(prev => prev.map(s => 
          s._id === id ? { ...s, isActive: !s.isActive } : s
        ));
        toast({
          title: "Success",
          description: `Hero section ${!section.isActive ? "activated" : "deactivated"} successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to toggle section status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling section status:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a section
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/hero-sections/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove the deleted section from local state
        setSections(prev => prev.filter(s => s._id !== id));
        toast({
          title: "Success",
          description: "Hero section deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete section",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting section:', error);
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
    
    const updatedSections = [...filteredSections];
    [updatedSections[index - 1], updatedSections[index]] = [updatedSections[index], updatedSections[index - 1]];
    
    // Update order values
    updatedSections.forEach((section, idx) => {
      section.order = idx + 1;
    });
    
    setFilteredSections(updatedSections);
    setSections(prev => {
      const updated = [...prev];
      // Find and update the sections in the main array
      updatedSections.forEach(section => {
        const mainIndex = updated.findIndex(s => s._id === section._id);
        if (mainIndex !== -1) {
          updated[mainIndex] = section;
        }
      });
      return updated;
    });
    
    // Update order in backend
    try {
      const promises = updatedSections.map(section => 
        fetch(`/api/admin/hero-sections/${section._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...section, order: section.order })
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Warning",
        description: "Order updated locally but may not be saved. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === filteredSections.length - 1) return; // Already at the bottom
    
    const updatedSections = [...filteredSections];
    [updatedSections[index], updatedSections[index + 1]] = [updatedSections[index + 1], updatedSections[index]];
    
    // Update order values
    updatedSections.forEach((section, idx) => {
      section.order = idx + 1;
    });
    
    setFilteredSections(updatedSections);
    setSections(prev => {
      const updated = [...prev];
      // Find and update the sections in the main array
      updatedSections.forEach(section => {
        const mainIndex = updated.findIndex(s => s._id === section._id);
        if (mainIndex !== -1) {
          updated[mainIndex] = section;
        }
      });
      return updated;
    });
    
    // Update order in backend
    try {
      const promises = updatedSections.map(section => 
        fetch(`/api/admin/hero-sections/${section._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...section, order: section.order })
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Warning",
        description: "Order updated locally but may not be saved. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Get statistics
  const stats = {
    total: sections.length,
    active: sections.filter(s => s.isActive).length,
    inactive: sections.filter(s => !s.isActive).length
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Hero Sections</h1>
            <p className="text-muted-foreground">
              Manage hero sections displayed on your website
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchSections}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <MdRefresh size={16} />
              Refresh
            </Button>
            <Link href="/admin/dashboard/hero-sections/add">
              <Button className="flex items-center gap-2">
                <MdAdd size={20} />
                Add New Section
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by title or subtitle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
              className="flex items-center gap-1"
            >
              <MdVisibility size={14} />
              Active ({stats.active})
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
              className="flex items-center gap-1"
            >
              <MdVisibilityOff size={14} />
              Inactive ({stats.inactive})
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading hero sections...</p>
          </div>
        </div>
      ) : filteredSections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {sections.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No hero sections found</h3>
                <p className="text-muted-foreground mb-4">Create your first hero section to get started!</p>
                <Link href="/admin/dashboard/hero-sections/add">
                  <Button className="flex items-center gap-2">
                    <MdAdd size={20} />
                    Add Hero Section
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No sections match your filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search term or status filter.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredSections.map((section, index) => (
            <Card key={section._id} className="overflow-hidden">
              <CardHeader className="p-4 bg-muted/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {section.title}
                        <Badge variant={section.isActive ? 'default' : 'secondary'} className="text-xs">
                          {section.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {section.pattern || 'standard'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span>Order: {section.order}</span>
                        <span>•</span>
                        <span>{section.buttons?.length || 0} buttons</span>
                        {section.mediaUrl && (
                          <>
                            <span>•</span>
                            <span>{section.mediaType || 'image'} media</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                      <Switch 
                        checked={section.isActive} 
                        onCheckedChange={() => handleToggleActive(section._id)}
                      />
                      <span className="text-sm hidden sm:inline">
                        {section.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <MdExpandLess size={20} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === filteredSections.length - 1}
                      title="Move down"
                    >
                      <MdExpandMore size={20} />
                    </Button>
                    <Link href={`/admin/dashboard/hero-sections/view/${section._id}`}>
                      <Button variant="outline" size="icon" title="View details">
                        <MdVisibility size={20} />
                      </Button>
                    </Link>
                    <Link href={`/admin/dashboard/hero-sections/edit/${section._id}`}>
                      <Button variant="outline" size="icon" title="Edit">
                        <MdEdit size={20} />
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => handleDelete(section._id, section.title)}
                      title="Delete"
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