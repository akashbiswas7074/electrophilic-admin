"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, Trash2, Eye, Settings, Globe, Search, BarChart } from "lucide-react";
import {
  getAllWebsiteSettings,
  createOrUpdateWebsiteSettings,
  activateWebsiteSettings,
  deleteWebsiteSettings
} from "@/lib/database/actions/website.settings.actions";

// Form validation schema
const websiteSettingsSchema = z.object({
  // Basic SEO
  siteName: z.string().min(1, "Site name is required").max(100, "Site name cannot exceed 100 characters"),
  siteDescription: z.string().min(1, "Site description is required").max(160, "Description cannot exceed 160 characters"),
  siteKeywords: z.array(z.string()).optional(),
  defaultTitle: z.string().min(1, "Default title is required").max(60, "Title cannot exceed 60 characters"),
  titleSeparator: z.string().default(" | "),
  
  // Open Graph
  ogTitle: z.string().max(40, "OG title cannot exceed 40 characters").optional(),
  ogDescription: z.string().max(300, "OG description cannot exceed 300 characters").optional(),
  ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ogType: z.enum(["website", "article", "product", "profile"]).default("website"),
  
  // Twitter Card
  twitterTitle: z.string().max(70, "Twitter title cannot exceed 70 characters").optional(),
  twitterDescription: z.string().max(200, "Twitter description cannot exceed 200 characters").optional(),
  twitterImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image", "app", "player"]).default("summary_large_image"),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),
  
  // Favicons
  favicon: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  favicon16: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  favicon32: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  appleTouchIcon: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  androidChrome192: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  androidChrome512: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  safariPinnedTab: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  msTileColor: z.string().default("#da532c"),
  themeColor: z.string().default("#ffffff"),
  
  // Additional Meta
  author: z.string().optional(),
  robots: z.string().default("index, follow"),
  canonical: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  
  // Analytics
  googleAnalyticsId: z.string().optional(),
  googleTagManagerId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  
  // Organization Schema
  organizationName: z.string().optional(),
  organizationUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  organizationLogo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  organizationType: z.enum(["Organization", "Corporation", "EducationalOrganization", "LocalBusiness", "Store"]).default("Organization"),
  
  // Theme Settings
  themeSettings: z.object({
    primaryColor: z.string().default("#2B2B2B"),
    secondaryColor: z.string().default("#6B7280"),
    accentColor: z.string().default("#3B82F6"),
    backgroundColor: z.string().default("#FFFFFF"),
    textColor: z.string().default("#1F2937"),
    borderRadius: z.string().default("0.5rem"),
    fontFamily: z.string().default("Inter"),
    customCSS: z.string().default(""),
    darkMode: z.boolean().default(false),
  }).optional(),
});

type WebsiteSettingsFormValues = z.infer<typeof websiteSettingsSchema>;

export default function WebsiteSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingSettings, setExistingSettings] = useState<any[]>([]);
  const [keywordsInput, setKeywordsInput] = useState("");

  const form = useForm<WebsiteSettingsFormValues>({
    resolver: zodResolver(websiteSettingsSchema),
    defaultValues: {
      siteName: "",
      siteDescription: "",
      siteKeywords: [],
      defaultTitle: "",
      titleSeparator: " | ",
      ogType: "website",
      twitterCard: "summary_large_image",
      msTileColor: "#da532c",
      themeColor: "#ffffff",
      robots: "index, follow",
      organizationType: "Organization",
    },
  });

  // Load existing settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await getAllWebsiteSettings();
      if (result.success) {
        setExistingSettings(result.settings);
        
        // Load active settings into form
        const activeSettings = result.settings.find((s: any) => s.isActive);
        if (activeSettings) {
          form.reset(activeSettings);
          setKeywordsInput(activeSettings.siteKeywords?.join(", ") || "");
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Handle form submission
  const onSubmit = async (data: WebsiteSettingsFormValues) => {
    setSaving(true);
    try {
      // Process keywords
      const keywords = keywordsInput
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const result = await createOrUpdateWebsiteSettings({
        ...data,
        siteKeywords: keywords,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Website settings saved successfully",
        });
        loadSettings(); // Reload settings
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle file upload for favicons
  const handleFaviconUpload = async (file: File, field: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'favicons');

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload favicon');
      }

      // Update form field with the uploaded URL
      form.setValue(field as any, data.url);
      
      toast({
        title: "Success",
        description: "Favicon uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload favicon. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle settings activation
  const handleActivate = async (id: string) => {
    try {
      const result = await activateWebsiteSettings(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Settings activated successfully",
        });
        loadSettings();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to activate settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate settings",
        variant: "destructive",
      });
    }
  };

  // Handle settings deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete these settings?")) return;

    try {
      const result = await deleteWebsiteSettings(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Settings deleted successfully",
        });
        loadSettings();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website Settings</h1>
          <p className="text-muted-foreground">
            Manage SEO metadata, favicons, and analytics for your website
          </p>
        </div>
      </div>

      {/* Existing Settings */}
      {existingSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Existing Settings
            </CardTitle>
            <CardDescription>
              Manage your saved website settings configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {existingSettings.map((setting) => (
                <div
                  key={setting._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{setting.siteName}</h3>
                      {setting.isActive && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {setting.siteDescription}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(setting.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!setting.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(setting._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(setting._id)}
                      className="text-red-600 hover:text-red-700"
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

      {/* Settings Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="seo" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="favicons" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Favicons
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="schema" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Schema
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Theme
              </TabsTrigger>
            </TabsList>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic SEO Settings</CardTitle>
                  <CardDescription>
                    Configure the essential SEO metadata for your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Website Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of your website (max 100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Default page title" {...field} />
                        </FormControl>
                        <FormDescription>
                          Default title for pages (max 60 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="A brief description of your website" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description of your website (max 160 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="text-sm font-medium">Site Keywords</label>
                    <Input
                      placeholder="keyword1, keyword2, keyword3"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Separate keywords with commas
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="titleSeparator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title Separator</FormLabel>
                          <FormControl>
                            <Input placeholder=" | " {...field} />
                          </FormControl>
                          <FormDescription>
                            Separator between page title and site name
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="robots"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Robots Meta</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select robots directive" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="index, follow">Index, Follow</SelectItem>
                              <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
                              <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                              <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="author"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author</FormLabel>
                          <FormControl>
                            <Input placeholder="Website author" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canonical"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canonical URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Default canonical URL for your site
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media Tab */}
            <TabsContent value="social" className="space-y-6">
              {/* Open Graph Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Graph (Facebook)</CardTitle>
                  <CardDescription>
                    Configure how your site appears when shared on Facebook and other platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ogTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Open Graph title" {...field} />
                          </FormControl>
                          <FormDescription>Max 40 characters</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="profile">Profile</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ogDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Open Graph description" {...field} rows={2} />
                        </FormControl>
                        <FormDescription>Max 300 characters</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/og-image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Recommended size: 1200x630 pixels
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Twitter Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Twitter Card</CardTitle>
                  <CardDescription>
                    Configure how your site appears when shared on Twitter
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="twitterCard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Card Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="summary">Summary</SelectItem>
                              <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                              <SelectItem value="app">App</SelectItem>
                              <SelectItem value="player">Player</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterSite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Site</FormLabel>
                          <FormControl>
                            <Input placeholder="@yoursite" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="twitterTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Twitter title" {...field} />
                          </FormControl>
                          <FormDescription>Max 70 characters</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterCreator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Creator</FormLabel>
                          <FormControl>
                            <Input placeholder="@creator" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="twitterDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Twitter description" {...field} rows={2} />
                        </FormControl>
                        <FormDescription>Max 200 characters</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/twitter-image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Recommended size: 1200x675 pixels
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favicons Tab */}
            <TabsContent value="favicons" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Favicon Configuration</CardTitle>
                  <CardDescription>
                    Upload and configure favicons for different devices and browsers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Standard Favicons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Standard Favicons</h4>
                      
                      <FormField
                        control={form.control}
                        name="favicon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favicon (ICO)</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/favicon.ico" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".ico,.png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'favicon');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <FormDescription>Default favicon (16x16 or 32x32)</FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="favicon16"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favicon 16x16</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/favicon-16x16.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'favicon16');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="favicon32"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favicon 32x32</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/favicon-32x32.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'favicon32');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Device-Specific Icons</h4>

                      <FormField
                        control={form.control}
                        name="appleTouchIcon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apple Touch Icon</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/apple-touch-icon.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'appleTouchIcon');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <FormDescription>180x180 PNG for iOS devices</FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="androidChrome192"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Android Chrome 192x192</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/android-chrome-192x192.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'androidChrome192');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="androidChrome512"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Android Chrome 512x512</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/android-chrome-512x512.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'androidChrome512');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Browser-Specific */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="safariPinnedTab"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Safari Pinned Tab</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="https://example.com/safari-pinned-tab.svg" {...field} />
                            </FormControl>
                            <div className="relative">
                              <Input
                                type="file"
                                accept=".svg"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFaviconUpload(file, 'safariPinnedTab');
                                }}
                              />
                              <Button type="button" variant="outline">
                                <Upload className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <FormDescription>SVG icon for Safari pinned tabs</FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="msTileColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MS Tile Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormDescription>Windows tile color</FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormDescription>Browser theme color</FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics & Tracking</CardTitle>
                  <CardDescription>
                    Configure tracking codes for analytics and marketing platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="googleAnalyticsId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Analytics ID</FormLabel>
                        <FormControl>
                          <Input placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Google Analytics tracking ID (GA4 or Universal Analytics)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="googleTagManagerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Tag Manager ID</FormLabel>
                        <FormControl>
                          <Input placeholder="GTM-XXXXXXX" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Google Tag Manager container ID
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebookPixelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Pixel ID</FormLabel>
                        <FormControl>
                          <Input placeholder="XXXXXXXXXXXXXXX" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Facebook Pixel ID for tracking conversions
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema Tab */}
            <TabsContent value="schema" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Schema</CardTitle>
                  <CardDescription>
                    Configure structured data for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company Name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Organization">Organization</SelectItem>
                              <SelectItem value="Corporation">Corporation</SelectItem>
                              <SelectItem value="EducationalOrganization">Educational Organization</SelectItem>
                              <SelectItem value="LocalBusiness">Local Business</SelectItem>
                              <SelectItem value="Store">Store</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="organizationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourcompany.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          The main URL of your organization
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organizationLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourcompany.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL to your organization's logo (recommended: 600x60px)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Theme Tab */}
            <TabsContent value="theme" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>
                    Configure the appearance and branding of your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Color Scheme</h4>
                      
                      <FormField
                        control={form.control}
                        name="themeSettings.primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#2B2B2B" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              The main brand color for buttons, links, and accents
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#6B7280" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Secondary color for subtle elements
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.accentColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#3B82F6" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Accent color for highlights and call-to-actions
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.backgroundColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#FFFFFF" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Main background color of the website
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.textColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#1F2937" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Default text color for content
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Typography & Layout</h4>

                      <FormField
                        control={form.control}
                        name="themeSettings.fontFamily"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Family</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select font family" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                <SelectItem value="Lato">Lato</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                                <SelectItem value="Poppins">Poppins</SelectItem>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="system-ui">System UI</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Primary font family for the website
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.borderRadius"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Radius</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select border radius" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">Sharp (0px)</SelectItem>
                                <SelectItem value="0.25rem">Minimal (4px)</SelectItem>
                                <SelectItem value="0.5rem">Medium (8px)</SelectItem>
                                <SelectItem value="0.75rem">Rounded (12px)</SelectItem>
                                <SelectItem value="1rem">Very Rounded (16px)</SelectItem>
                                <SelectItem value="9999px">Pill Shape</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Default border radius for buttons and cards
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.darkMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Dark Mode
                              </FormLabel>
                              <FormDescription>
                                Enable dark mode as the default theme
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Custom CSS */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Custom CSS</h4>
                    <FormField
                      control={form.control}
                      name="themeSettings.customCSS"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom CSS</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="/* Add your custom CSS here */
.custom-button {
  background: linear-gradient(45deg, #ff6b6b, #ee5a6f);
  border: none;
  color: white;
}" 
                              {...field} 
                              rows={8}
                              className="font-mono text-sm"
                            />
                          </FormControl>
                          <FormDescription>
                            Add custom CSS to override default styles. Use with caution as this can affect site performance and appearance.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Theme Preview */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Theme Preview</h4>
                    <div className="border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="space-y-4">
                        <div 
                          className="p-4 rounded-lg text-white font-medium"
                          style={{ 
                            backgroundColor: form.watch('themeSettings.primaryColor') || '#2B2B2B',
                            borderRadius: form.watch('themeSettings.borderRadius') || '0.5rem'
                          }}
                        >
                          Primary Button Example
                        </div>
                        <div 
                          className="p-4 rounded-lg border"
                          style={{ 
                            backgroundColor: form.watch('themeSettings.backgroundColor') || '#FFFFFF',
                            color: form.watch('themeSettings.textColor') || '#1F2937',
                            borderRadius: form.watch('themeSettings.borderRadius') || '0.5rem',
                            fontFamily: form.watch('themeSettings.fontFamily') || 'Inter'
                          }}
                        >
                          <h5 className="font-semibold mb-2">Sample Content</h5>
                          <p className="text-sm">
                            This is how your content will look with the selected theme settings. 
                            The typography, colors, and border radius will be applied across your website.
                          </p>
                          <button 
                            className="mt-3 px-4 py-2 text-white text-sm rounded"
                            style={{ 
                              backgroundColor: form.watch('themeSettings.accentColor') || '#3B82F6',
                              borderRadius: form.watch('themeSettings.borderRadius') || '0.5rem'
                            }}
                          >
                            Accent Button
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[120px]">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}