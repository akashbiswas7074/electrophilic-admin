"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Eye, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { 
  getReturnPolicy, 
  upsertReturnPolicy, 
  getAllReturnPolicies,
  deleteReturnPolicy,
  activateReturnPolicy 
} from "@/lib/database/actions/admin/return-policy/return-policy.actions";

interface PolicySection {
  title: string;
  content: string;
  icon: string;
  order: number;
  isActive: boolean;
}

interface PolicyData {
  _id?: string;
  title: string;
  subtitle: string;
  heroIcon: string;
  sections: PolicySection[];
  metaTitle: string;
  metaDescription: string;
  customCSS: string;
  isActive?: boolean;
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export default function ReturnPolicyManager() {
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [activePolicy, setActivePolicy] = useState<PolicyData>({
    title: "Return & Exchange Policy",
    subtitle: "We've got your back—on and off the track.",
    heroIcon: "🏃‍♂️",
    sections: [],
    metaTitle: "",
    metaDescription: "",
    customCSS: "",
  });
  const [previewMode, setPreviewMode] = useState(false);

  // Load active policy on component mount
  useEffect(() => {
    loadActivePolicy();
    loadAllPolicies();
  }, []);

  const loadActivePolicy = async () => {
    try {
      const result = await getReturnPolicy();
      if (result.success && result.policy) {
        setActivePolicy(result.policy);
      }
    } catch (error) {
      console.error("Error loading policy:", error);
      toast({
        title: "Error",
        description: "Failed to load return policy",
        variant: "destructive",
      });
    }
  };

  const loadAllPolicies = async () => {
    try {
      const result = await getAllReturnPolicies();
      if (result.success) {
        setPolicies(result.policies);
      }
    } catch (error) {
      console.error("Error loading policies:", error);
    }
  };

  const handleSavePolicy = async () => {
    setLoading(true);
    try {
      const result = await upsertReturnPolicy(activePolicy);
      if (result.success) {
        toast({
          title: "Success",
          description: "Return policy saved successfully",
        });
        setActivePolicy(result.policy);
        loadAllPolicies();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newSection: PolicySection = {
      title: "",
      content: "",
      icon: "📝",
      order: activePolicy.sections.length,
      isActive: true,
    };
    setActivePolicy({
      ...activePolicy,
      sections: [...activePolicy.sections, newSection],
    });
  };

  const updateSection = (index: number, field: keyof PolicySection, value: any) => {
    const updatedSections = [...activePolicy.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setActivePolicy({ ...activePolicy, sections: updatedSections });
  };

  const removeSection = (index: number) => {
    const updatedSections = activePolicy.sections.filter((_, i) => i !== index);
    // Reorder sections
    const reorderedSections = updatedSections.map((section, i) => ({
      ...section,
      order: i,
    }));
    setActivePolicy({ ...activePolicy, sections: reorderedSections });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...activePolicy.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      
      // Update order numbers
      newSections.forEach((section, i) => {
        section.order = i;
      });
      
      setActivePolicy({ ...activePolicy, sections: newSections });
    }
  };

  const activatePolicy = async (policyId: string) => {
    try {
      const result = await activateReturnPolicy(policyId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Policy activated successfully",
        });
        loadActivePolicy();
        loadAllPolicies();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to activate policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while activating policy",
        variant: "destructive",
      });
    }
  };

  const deletePolicy = async (policyId: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    
    try {
      const result = await deleteReturnPolicy(policyId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Policy deleted successfully",
        });
        loadAllPolicies();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting policy",
        variant: "destructive",
      });
    }
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Policy Preview</h2>
            <Button onClick={() => setPreviewMode(false)} variant="outline">
              Back to Editor
            </Button>
          </div>
          
          {/* Preview Content */}
          <div className="w-full py-8 md:py-12 lg:py-16 bg-white rounded-lg shadow">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="mb-6 text-sm breadcrumbs">
                <ol className="flex items-center space-x-1">
                  <li><span className="text-gray-500">Home</span></li>
                  <li className="text-gray-400">/</li>
                  <li><span className="text-gray-900 font-medium">Return Policy</span></li>
                </ol>
              </div>

              <div className="prose prose-slate max-w-none">
                <h1 className="text-3xl font-bold mb-6 flex items-center">
                  <span className="mr-2">{activePolicy.heroIcon}</span>
                  {activePolicy.title}
                </h1>

                <p className="text-lg mb-6">{activePolicy.subtitle}</p>

                {activePolicy.sections
                  .filter(section => section.isActive)
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 mb-8">
                      <h2 className="text-xl font-semibold mb-3 flex items-center">
                        <span className="mr-2">{section.icon}</span>
                        {section.title}
                      </h2>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: section.content }} 
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Return Policy Manager</h1>
          <p className="text-muted-foreground">Manage your website's return and exchange policy</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPreviewMode(true)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSavePolicy} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Policy"}
          </Button>
        </div>
      </div>

      {/* Policy Versions */}
      {policies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Policy Versions</CardTitle>
            <CardDescription>Manage different versions of your return policy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {policies.map((policy) => (
                <div key={policy._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{policy.title}</h3>
                      {policy.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Updated {policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : 'Unknown'} 
                      {policy.lastUpdatedBy && ` by ${policy.lastUpdatedBy}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!policy.isActive && (
                      <Button
                        onClick={() => activatePolicy(policy._id!)}
                        size="sm"
                        variant="outline"
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      onClick={() => deletePolicy(policy._id!)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Editor */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Configure the main policy details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Policy Title</Label>
              <Input
                id="title"
                value={activePolicy.title}
                onChange={(e) => setActivePolicy({ ...activePolicy, title: e.target.value })}
                placeholder="Return & Exchange Policy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={activePolicy.subtitle}
                onChange={(e) => setActivePolicy({ ...activePolicy, subtitle: e.target.value })}
                placeholder="Brief description or tagline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroIcon">Hero Icon</Label>
              <Input
                id="heroIcon"
                value={activePolicy.heroIcon}
                onChange={(e) => setActivePolicy({ ...activePolicy, heroIcon: e.target.value })}
                placeholder="🏃‍♂️"
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize for search engines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={activePolicy.metaTitle}
                onChange={(e) => setActivePolicy({ ...activePolicy, metaTitle: e.target.value })}
                placeholder="Return Policy - Your Store"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={activePolicy.metaDescription}
                onChange={(e) => setActivePolicy({ ...activePolicy, metaDescription: e.target.value })}
                placeholder="Learn about our return and exchange policy..."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Sections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Policy Sections</CardTitle>
            <CardDescription>Add and manage different sections of your policy</CardDescription>
          </div>
          <Button onClick={addSection} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activePolicy.sections.map((section, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === activePolicy.sections.length - 1}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Section {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={section.isActive}
                        onCheckedChange={(checked) => updateSection(index, 'isActive', checked)}
                      />
                      <Button
                        onClick={() => removeSection(index)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Section Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(index, 'title', e.target.value)}
                        placeholder="Section title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Input
                        value={section.icon}
                        onChange={(e) => updateSection(index, 'icon', e.target.value)}
                        placeholder="📝"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <RichTextEditor
                      value={section.content}
                      onChange={(content) => updateSection(index, 'content', content)}
                      className="min-h-[200px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {activePolicy.sections.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No sections added yet. Click "Add Section" to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Styling</CardTitle>
          <CardDescription>Add custom CSS for advanced styling</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={activePolicy.customCSS}
            onChange={(e) => setActivePolicy({ ...activePolicy, customCSS: e.target.value })}
            placeholder="/* Custom CSS styles */"
            className="min-h-[120px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}