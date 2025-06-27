"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown,
  Table,
  Ruler,
  Lightbulb,
  FileText,
  Settings,
  Globe,
  Code,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink
} from "lucide-react";
import {
  getSizeGuide,
  getAllSizeGuides,
  upsertSizeGuide,
  deleteSizeGuide,
  activateSizeGuide,
  type SizeGuideConfig
} from "@/lib/database/actions/admin/size-guide/size-guide.actions";

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'color', 'background', 'link', 'image'
];

interface SizeChartEntry {
  size: string;
  measurements: { [key: string]: string };
  order: number;
}

interface Section {
  title: string;
  content: string;
  icon: string;
  isActive: boolean;
  order: number;
}

export default function SizeGuideManager() {
  const { toast } = useToast();
  const [config, setConfig] = useState<SizeGuideConfig | null>(null);
  const [allConfigs, setAllConfigs] = useState<SizeGuideConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Preview management
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Section management
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  
  // Size chart management
  const [editingEntry, setEditingEntry] = useState<SizeChartEntry | null>(null);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [newMeasurementLabel, setNewMeasurementLabel] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configResult, allConfigsResult] = await Promise.all([
        getSizeGuide(),
        getAllSizeGuides()
      ]);
      
      if (configResult.success && configResult.config) {
        setConfig(configResult.config);
      }
      
      if (allConfigsResult.success) {
        setAllConfigs(allConfigsResult.configs);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load size guide configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      const result = await upsertSizeGuide(config);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Size guide saved successfully",
        });
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save size guide",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save size guide",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateConfig = async (configId: string) => {
    try {
      const result = await activateSizeGuide(configId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error activating config:", error);
      toast({
        title: "Error",
        description: "Failed to activate configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    
    try {
      const result = await deleteSizeGuide(configId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting config:", error);
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive",
      });
    }
  };

  // Section management functions
  const addSection = () => {
    setEditingSection({
      title: "",
      content: "",
      icon: "📏",
      isActive: true,
      order: config?.sections.length || 0
    });
    setSectionDialogOpen(true);
  };

  const editSection = (index: number) => {
    if (config?.sections[index]) {
      setEditingSection({ ...config.sections[index] });
      setSectionDialogOpen(true);
    }
  };

  const saveSection = () => {
    if (!config || !editingSection) return;
    
    const existingIndex = config.sections.findIndex(s => 
      s.title === editingSection.title && s.order === editingSection.order
    );
    
    const newSections = [...config.sections];
    
    if (existingIndex >= 0) {
      newSections[existingIndex] = editingSection;
    } else {
      newSections.push(editingSection);
    }
    
    setConfig({ ...config, sections: newSections });
    setSectionDialogOpen(false);
    setEditingSection(null);
  };

  const deleteSection = (index: number) => {
    if (!config) return;
    
    const newSections = config.sections.filter((_, i) => i !== index);
    setConfig({ ...config, sections: newSections });
  };

  const moveSectionUp = (index: number) => {
    if (!config || index === 0) return;
    
    const newSections = [...config.sections];
    [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    
    // Update order values
    newSections.forEach((section, i) => {
      section.order = i;
    });
    
    setConfig({ ...config, sections: newSections });
  };

  const moveSectionDown = (index: number) => {
    if (!config || index === config.sections.length - 1) return;
    
    const newSections = [...config.sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    
    // Update order values
    newSections.forEach((section, i) => {
      section.order = i;
    });
    
    setConfig({ ...config, sections: newSections });
  };

  // Size chart management functions
  const addMeasurementLabel = () => {
    if (!config || !newMeasurementLabel.trim()) return;
    
    const labels = [...(config.sizeChart?.measurementLabels || [])];
    if (!labels.includes(newMeasurementLabel.trim())) {
      labels.push(newMeasurementLabel.trim());
      setConfig({
        ...config,
        sizeChart: {
          ...config.sizeChart,
          enabled: config.sizeChart?.enabled ?? true,
          measurementLabels: labels,
          entries: config.sizeChart?.entries || []
        }
      });
    }
    setNewMeasurementLabel("");
  };

  const removeMeasurementLabel = (label: string) => {
    if (!config) return;
    
    const labels = (config.sizeChart?.measurementLabels || []).filter(l => l !== label);
    const entries = (config.sizeChart?.entries || []).map(entry => ({
      ...entry,
      measurements: Object.fromEntries(
        Object.entries(entry.measurements).filter(([key]) => labels.includes(key))
      )
    }));
    
    setConfig({
      ...config,
      sizeChart: {
        ...config.sizeChart,
        enabled: config.sizeChart?.enabled ?? true,
        measurementLabels: labels,
        entries
      }
    });
  };

  const addSizeEntry = () => {
    setEditingEntry({
      size: "",
      measurements: {},
      order: config?.sizeChart?.entries.length || 0
    });
    setEntryDialogOpen(true);
  };

  const editSizeEntry = (index: number) => {
    if (config?.sizeChart?.entries[index]) {
      setEditingEntry({ ...config.sizeChart.entries[index] });
      setEntryDialogOpen(true);
    }
  };

  const saveSizeEntry = () => {
    if (!config || !editingEntry) return;
    
    const existingIndex = config.sizeChart?.entries.findIndex(e => 
      e.size === editingEntry.size
    ) ?? -1;
    
    const newEntries = [...(config.sizeChart?.entries || [])];
    
    if (existingIndex >= 0) {
      newEntries[existingIndex] = editingEntry;
    } else {
      newEntries.push(editingEntry);
    }
    
    setConfig({
      ...config,
      sizeChart: {
        ...config.sizeChart,
        enabled: config.sizeChart?.enabled ?? true,
        measurementLabels: config.sizeChart?.measurementLabels || [],
        entries: newEntries
      }
    });
    
    setEntryDialogOpen(false);
    setEditingEntry(null);
  };

  const deleteSizeEntry = (index: number) => {
    if (!config) return;
    
    const newEntries = (config.sizeChart?.entries || []).filter((_, i) => i !== index);
    setConfig({
      ...config,
      sizeChart: {
        ...config.sizeChart,
        enabled: config.sizeChart?.enabled ?? true,
        measurementLabels: config.sizeChart?.measurementLabels || [],
        entries: newEntries
      }
    });
  };

  // Preview component
  const SizeGuidePreview = () => {
    if (!config) return null;

    const deviceStyles = {
      desktop: { width: '100%', height: '600px' },
      tablet: { width: '768px', height: '1024px', maxWidth: '100%' },
      mobile: { width: '375px', height: '667px', maxWidth: '100%' }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Preview Mode:</span>
            <Select value={previewMode} onValueChange={(value: 'desktop' | 'tablet' | 'mobile') => setPreviewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </div>
                </SelectItem>
                <SelectItem value="tablet">
                  <div className="flex items-center gap-2">
                    <Tablet className="h-4 w-4" />
                    Tablet
                  </div>
                </SelectItem>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/size-guide', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-white">
          <div 
            className="mx-auto transition-all duration-300"
            style={deviceStyles[previewMode]}
          >
            <div className="h-full overflow-auto bg-gray-50">
              {/* Preview Content */}
              <div className={`${previewMode === 'mobile' ? 'px-4' : 'container mx-auto px-4'} py-8 ${previewMode === 'desktop' ? 'max-w-6xl' : ''}`}>
                {/* Hero Section */}
                <div className="text-center mb-8">
                  <div className={`${previewMode === 'mobile' ? 'text-4xl' : 'text-6xl'} mb-4`}>
                    {config.heroIcon}
                  </div>
                  <h1 className={`${previewMode === 'mobile' ? 'text-2xl' : 'text-4xl'} font-bold text-gray-900 mb-4`}>
                    {config.title}
                  </h1>
                  {config.subtitle && (
                    <p className={`${previewMode === 'mobile' ? 'text-base' : 'text-xl'} text-gray-600 max-w-2xl mx-auto`}>
                      {config.subtitle}
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className={`${previewMode === 'mobile' ? 'p-4' : 'p-8'} space-y-8`}>
                    {/* Content Sections */}
                    {config.sections
                      .filter(section => section.isActive)
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => (
                        <section key={index} className="space-y-4">
                          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                            <span className={previewMode === 'mobile' ? 'text-xl' : 'text-2xl'}>
                              {section.icon}
                            </span>
                            <h2 className={`${previewMode === 'mobile' ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                              {section.title}
                            </h2>
                          </div>
                          <div 
                            className={`prose ${previewMode === 'mobile' ? 'prose-sm' : 'prose-lg'} max-w-none text-gray-700`}
                            dangerouslySetInnerHTML={{ __html: section.content }}
                          />
                        </section>
                      ))}

                    {/* Size Chart */}
                    {config.sizeChart?.enabled && config.sizeChart.entries.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                          <Table className={`${previewMode === 'mobile' ? 'h-5 w-5' : 'h-8 w-8'} text-blue-600`} />
                          <h2 className={`${previewMode === 'mobile' ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                            Size Chart
                          </h2>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <th className={`border border-gray-200 ${previewMode === 'mobile' ? 'px-3 py-2 text-sm' : 'px-6 py-4'} text-left font-bold text-gray-900`}>
                                  Size
                                </th>
                                {config.sizeChart.measurementLabels.map((label, index) => (
                                  <th key={index} className={`border border-gray-200 ${previewMode === 'mobile' ? 'px-3 py-2 text-sm' : 'px-6 py-4'} text-left font-bold text-gray-900`}>
                                    {label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {config.sizeChart.entries
                                .sort((a, b) => a.order - b.order)
                                .map((entry, index) => (
                                  <tr key={index} className={`transition-colors hover:bg-gray-50 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                                  }`}>
                                    <td className={`border border-gray-200 ${previewMode === 'mobile' ? 'px-3 py-2 text-sm' : 'px-6 py-4'} font-bold text-gray-900`}>
                                      {entry.size}
                                    </td>
                                    {config.sizeChart.measurementLabels.map((label, labelIndex) => (
                                      <td key={labelIndex} className={`border border-gray-200 ${previewMode === 'mobile' ? 'px-3 py-2 text-sm' : 'px-6 py-4'} text-gray-700`}>
                                        {entry.measurements[label] || "-"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* How to Measure */}
                    {config.howToMeasure?.enabled && config.howToMeasure.content && (
                      <section className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                          <Ruler className={`${previewMode === 'mobile' ? 'h-5 w-5' : 'h-8 w-8'} text-green-600`} />
                          <h2 className={`${previewMode === 'mobile' ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                            How to Measure
                          </h2>
                        </div>
                        <div 
                          className={`prose ${previewMode === 'mobile' ? 'prose-sm' : 'prose-lg'} max-w-none text-gray-700`}
                          dangerouslySetInnerHTML={{ __html: config.howToMeasure.content }}
                        />
                      </section>
                    )}

                    {/* Fit Tips */}
                    {config.fitTips?.enabled && config.fitTips.content && (
                      <section className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                          <Lightbulb className={`${previewMode === 'mobile' ? 'h-5 w-5' : 'h-8 w-8'} text-yellow-600`} />
                          <h2 className={`${previewMode === 'mobile' ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                            Fit Tips
                          </h2>
                        </div>
                        <div 
                          className={`prose ${previewMode === 'mobile' ? 'prose-sm' : 'prose-lg'} max-w-none text-gray-700`}
                          dangerouslySetInnerHTML={{ __html: config.fitTips.content }}
                        />
                      </section>
                    )}
                  </div>
                </div>

                {/* Contact Section */}
                <div className="mt-8 text-center">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className={`${previewMode === 'mobile' ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-2`}>
                      Still Need Help?
                    </h3>
                    <p className={`text-gray-600 mb-4 ${previewMode === 'mobile' ? 'text-sm' : ''}`}>
                      If you're unsure about sizing, our customer service team is here to help!
                    </p>
                    <div className={`flex ${previewMode === 'mobile' ? 'flex-col' : 'flex-col sm:flex-row'} gap-3 justify-center`}>
                      <button className={`inline-flex items-center justify-center ${previewMode === 'mobile' ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors`}>
                        Contact Support
                      </button>
                      <button className={`inline-flex items-center justify-center ${previewMode === 'mobile' ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors`}>
                        View Full Guide
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center p-12">
            <h2 className="text-xl font-bold mb-4">No Size Guide Configuration Found</h2>
            <p className="text-gray-600 mb-6">Create your first size guide configuration to get started.</p>
            <Button onClick={() => {
              setConfig({
                title: "Size Guide",
                subtitle: "Find your perfect fit",
                heroIcon: "📐",
                sections: [],
                sizeChart: {
                  enabled: true,
                  measurementLabels: ["Chest", "Waist", "Length"],
                  entries: []
                },
                howToMeasure: {
                  enabled: true,
                  content: "",
                  images: []
                },
                fitTips: {
                  enabled: true,
                  content: ""
                },
                metaTitle: "",
                metaDescription: "",
                customCSS: ""
              });
            }}>
              Create New Configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Size Guide Manager</h1>
          <p className="text-gray-600 mt-2">Manage your website's size guide content and configurations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          
          {/* Enhanced Preview Button */}
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-[95vw] h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Size Guide Preview
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                <SizeGuidePreview />
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={() => window.open('/size-guide', '_blank')}
            className="hidden sm:flex"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Live
          </Button>
        </div>
      </div>

      {/* Configurations List */}
      {allConfigs.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              All Configurations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allConfigs.map((cfg) => (
                <div key={cfg._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cfg.heroIcon}</span>
                    <div>
                      <h3 className="font-medium">{cfg.title}</h3>
                      <p className="text-sm text-gray-600">{cfg.subtitle}</p>
                    </div>
                    {cfg.isActive && (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!cfg.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateConfig(cfg._id!)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfig(cfg)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!cfg.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfig(cfg._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="size-chart" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Size Chart
          </TabsTrigger>
          <TabsTrigger value="how-to-measure" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            How to Measure
          </TabsTrigger>
          <TabsTrigger value="fit-tips" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Fit Tips
          </TabsTrigger>
          <TabsTrigger value="seo-css" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SEO & CSS
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    placeholder="Size Guide"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroIcon">Hero Icon (Emoji)</Label>
                  <Input
                    id="heroIcon"
                    value={config.heroIcon}
                    onChange={(e) => setConfig({ ...config, heroIcon: e.target.value })}
                    placeholder="📐"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  placeholder="Find your perfect fit"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Sections */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content Sections</CardTitle>
                <Button onClick={addSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {config.sections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sections added yet. Click "Add Section" to create your first section.
                </div>
              ) : (
                <div className="space-y-4">
                  {config.sections.map((section, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{section.icon}</span>
                          <div>
                            <h3 className="font-medium">{section.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={section.isActive ? "default" : "secondary"}>
                                {section.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-sm text-gray-500">Order: {section.order}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveSectionUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveSectionDown(index)}
                            disabled={index === config.sections.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editSection(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSection(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600 line-clamp-2">
                        <div dangerouslySetInnerHTML={{ __html: section.content.substring(0, 150) + '...' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Size Chart */}
        <TabsContent value="size-chart">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Size Chart</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.sizeChart?.enabled ?? true}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        sizeChart: {
                          ...config.sizeChart,
                          enabled: checked,
                          measurementLabels: config.sizeChart?.measurementLabels || [],
                          entries: config.sizeChart?.entries || []
                        }
                      })}
                    />
                    <Label>Enable Size Chart</Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Measurement Labels */}
              <div>
                <Label className="text-base font-medium mb-3 block">Measurement Labels</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(config.sizeChart?.measurementLabels || []).map((label, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {label}
                      <button
                        onClick={() => removeMeasurementLabel(label)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newMeasurementLabel}
                    onChange={(e) => setNewMeasurementLabel(e.target.value)}
                    placeholder="Add measurement label (e.g., Chest, Waist)"
                    onKeyPress={(e) => e.key === 'Enter' && addMeasurementLabel()}
                  />
                  <Button onClick={addMeasurementLabel} disabled={!newMeasurementLabel.trim()}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Size Entries */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium">Size Entries</Label>
                  <Button onClick={addSizeEntry} disabled={!config.sizeChart?.measurementLabels?.length}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Size
                  </Button>
                </div>
                
                {(config.sizeChart?.entries || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No size entries added yet. Add measurement labels first, then add size entries.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Size</th>
                          {(config.sizeChart?.measurementLabels || []).map((label, index) => (
                            <th key={index} className="px-4 py-2 text-left font-medium">{label}</th>
                          ))}
                          <th className="px-4 py-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(config.sizeChart?.entries || []).map((entry, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 font-medium">{entry.size}</td>
                            {(config.sizeChart?.measurementLabels || []).map((label, labelIndex) => (
                              <td key={labelIndex} className="px-4 py-2">
                                {entry.measurements[label] || "-"}
                              </td>
                            ))}
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editSizeEntry(index)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteSizeEntry(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* How to Measure */}
        <TabsContent value="how-to-measure">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>How to Measure</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.howToMeasure?.enabled ?? true}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      howToMeasure: {
                        ...config.howToMeasure,
                        enabled: checked,
                        content: config.howToMeasure?.content || "",
                        images: config.howToMeasure?.images || []
                      }
                    })}
                  />
                  <Label>Enable How to Measure</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={config.howToMeasure?.content || ""}
                  onChange={(content) => setConfig({
                    ...config,
                    howToMeasure: {
                      ...config.howToMeasure,
                      enabled: config.howToMeasure?.enabled ?? true,
                      content,
                      images: config.howToMeasure?.images || []
                    }
                  })}
                  className="h-32 mb-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Images (URLs)</Label>
                <div className="space-y-2">
                  {(config.howToMeasure?.images || []).map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={image}
                        onChange={(e) => {
                          const newImages = [...(config.howToMeasure?.images || [])];
                          newImages[index] = e.target.value;
                          setConfig({
                            ...config,
                            howToMeasure: {
                              ...config.howToMeasure,
                              enabled: config.howToMeasure?.enabled ?? true,
                              content: config.howToMeasure?.content || "",
                              images: newImages
                            }
                          });
                        }}
                        placeholder="Image URL"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newImages = (config.howToMeasure?.images || []).filter((_, i) => i !== index);
                          setConfig({
                            ...config,
                            howToMeasure: {
                              ...config.howToMeasure,
                              enabled: config.howToMeasure?.enabled ?? true,
                              content: config.howToMeasure?.content || "",
                              images: newImages
                            }
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newImages = [...(config.howToMeasure?.images || []), ""];
                      setConfig({
                        ...config,
                        howToMeasure: {
                          ...config.howToMeasure,
                          enabled: config.howToMeasure?.enabled ?? true,
                          content: config.howToMeasure?.content || "",
                          images: newImages
                        }
                      });
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fit Tips */}
        <TabsContent value="fit-tips">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fit Tips</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.fitTips?.enabled ?? true}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      fitTips: {
                        ...config.fitTips,
                        enabled: checked,
                        content: config.fitTips?.content || ""
                      }
                    })}
                  />
                  <Label>Enable Fit Tips</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={config.fitTips?.content || ""}
                  onChange={(content) => setConfig({
                    ...config,
                    fitTips: {
                      ...config.fitTips,
                      enabled: config.fitTips?.enabled ?? true,
                      content
                    }
                  })}
                  className="h-32 mb-12"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO & CSS */}
        <TabsContent value="seo-css">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={config.metaTitle}
                    onChange={(e) => setConfig({ ...config, metaTitle: e.target.value })}
                    placeholder="Size Guide - Find Your Perfect Fit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={config.metaDescription}
                    onChange={(e) => setConfig({ ...config, metaDescription: e.target.value })}
                    placeholder="Find your perfect fit with our comprehensive size guide..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Custom CSS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="customCSS">Custom CSS (Optional)</Label>
                  <Textarea
                    id="customCSS"
                    value={config.customCSS}
                    onChange={(e) => setConfig({ ...config, customCSS: e.target.value })}
                    placeholder=".size-guide { ... }"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-600">
                    Add custom CSS to style your size guide page.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection?.title ? "Edit Section" : "Add Section"}
            </DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sectionTitle">Title</Label>
                  <Input
                    id="sectionTitle"
                    value={editingSection.title}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      title: e.target.value
                    })}
                    placeholder="Section title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sectionIcon">Icon (Emoji)</Label>
                  <Input
                    id="sectionIcon"
                    value={editingSection.icon}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      icon: e.target.value
                    })}
                    placeholder="📏"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSection.isActive}
                  onCheckedChange={(checked) => setEditingSection({
                    ...editingSection,
                    isActive: checked
                  })}
                />
                <Label>Active</Label>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={editingSection.content}
                  onChange={(content) => setEditingSection({
                    ...editingSection,
                    content
                  })}
                  className="h-48 mb-12"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSectionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveSection}>
                  Save Section
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Size Entry Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry?.size ? "Edit Size Entry" : "Add Size Entry"}
            </DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entrySize">Size</Label>
                <Input
                  id="entrySize"
                  value={editingEntry.size}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    size: e.target.value
                  })}
                  placeholder="XS, S, M, L, XL, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Measurements</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(config.sizeChart?.measurementLabels || []).map((label) => (
                    <div key={label} className="space-y-1">
                      <Label className="text-sm">{label}</Label>
                      <Input
                        value={editingEntry.measurements[label] || ""}
                        onChange={(e) => setEditingEntry({
                          ...editingEntry,
                          measurements: {
                            ...editingEntry.measurements,
                            [label]: e.target.value
                          }
                        })}
                        placeholder="e.g., 36-38"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEntryDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveSizeEntry}>
                  Save Entry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}