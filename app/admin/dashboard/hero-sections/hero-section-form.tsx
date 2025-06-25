"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MdAdd, MdDelete, MdCloudUpload, MdPreview } from 'react-icons/md';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

// Define the button variants available
const buttonVariants = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Outline', value: 'outline' },
  { label: 'Ghost', value: 'ghost' },
];

// Define the hero section pattern options
const heroPatterns = [
  { 
    label: 'Standard', 
    value: 'standard',
    description: 'Centered text with buttons below',
    icon: '📄'
  },
  { 
    label: 'Don\'t Miss', 
    value: 'dont-miss',
    description: 'Dark background with prominent product feature',
    icon: '🎯'
  },
  { 
    label: 'Brand Control', 
    value: 'brand-control',
    description: 'Side-by-side image and text layout',
    icon: '🏢'
  },
  { 
    label: 'Partner', 
    value: 'partner',
    description: 'Text on left, media on right',
    icon: '🤝'
  },
];

// Define content alignment options
const contentAlignments = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

// Define the hero section form interface
interface HeroSectionFormProps {
  initialData?: {
    _id: string;
    title: string;
    subtitle: string;
    longDescription?: string;
    isActive: boolean;
    order: number;
    pattern?: string;
    layoutId?: string;
    contentAlignment?: string;
    backgroundImage?: string;
    mediaUrl?: string;
    mediaType?: string;
    titleColor?: string;
    descriptionColor?: string;
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    buttons: Array<{
      label: string;
      link: string;
      variant: string;
    }>;
  };
  mode: 'add' | 'edit';
}

export default function HeroSectionForm({ initialData, mode }: HeroSectionFormProps) {
  // Initialize form state
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    longDescription: initialData?.longDescription || '',
    isActive: initialData?.isActive ?? true,
    order: initialData?.order || 10,
    pattern: initialData?.pattern || 'standard',
    layoutId: initialData?.layoutId || '',
    contentAlignment: initialData?.contentAlignment || 'center',
    backgroundImage: initialData?.backgroundImage || '',
    mediaUrl: initialData?.mediaUrl || '',
    mediaType: initialData?.mediaType || 'image',
    titleColor: initialData?.titleColor || '',
    descriptionColor: initialData?.descriptionColor || '',
    buttonTextColor: initialData?.buttonTextColor || '',
    buttonBackgroundColor: initialData?.buttonBackgroundColor || '',
    buttons: initialData?.buttons || [], // Empty array by default instead of having a default button
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string>('');
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [activeTab, setActiveTab] = useState('content');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();

  // Set previews if initial data has images
  useEffect(() => {
    if (initialData?.backgroundImage) {
      setBackgroundImagePreview(initialData.backgroundImage);
    }
    if (initialData?.mediaUrl) {
      setMediaPreview(initialData.mediaUrl);
    }
  }, [initialData]);

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Remove title and subtitle mandatory validation
    // Only validate order
    if (formData.order < 1) {
      errors.order = 'Order must be at least 1';
    }
    
    // Only validate buttons if they exist and have content
    formData.buttons.forEach((button, index) => {
      // Only validate if the button has either label or link filled
      if (button.label.trim() || button.link.trim()) {
        if (!button.label.trim()) {
          errors[`button_${index}_label`] = `Button ${index + 1} label is required when link is provided`;
        }
        if (!button.link.trim()) {
          errors[`button_${index}_link`] = `Button ${index + 1} link is required when label is provided`;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Handle select/dropdown changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch toggle for active status
  const handleToggleActive = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  // Handle button input changes
  const handleButtonChange = (index: number, field: string, value: string) => {
    const updatedButtons = [...formData.buttons];
    updatedButtons[index] = { ...updatedButtons[index], [field]: value };
    setFormData(prev => ({ ...prev, buttons: updatedButtons }));
    
    // Clear validation error for this button field
    const errorKey = `button_${index}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };

  // Add a new button
  const handleAddButton = () => {
    setFormData(prev => ({
      ...prev,
      buttons: [...prev.buttons, { label: 'Button', link: '/', variant: 'secondary' }],
    }));
  };

  // Remove a button
  const handleRemoveButton = (index: number) => {
    const updatedButtons = [...formData.buttons];
    updatedButtons.splice(index, 1);
    setFormData(prev => ({ ...prev, buttons: updatedButtons }));
    
    // Clear any validation errors for all buttons since indices will shift
    setValidationErrors(prev => {
      const updated = { ...prev };
      // Remove all button-related validation errors
      Object.keys(updated).forEach(key => {
        if (key.startsWith('button_')) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  // Handle file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'backgroundImage' | 'media') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      if (fileType === 'backgroundImage') {
        setBackgroundImageFile(file);
        setBackgroundImagePreview(previewUrl);
      } else {
        setMediaFile(file);
        setMediaPreview(previewUrl);
        // Set media type based on file
        const isVideo = file.type.startsWith('video/');
        setFormData(prev => ({ ...prev, mediaType: isVideo ? 'video' : 'image' }));
      }
    }
  };

  // Upload file to cloud storage
  const uploadFile = async (file: File): Promise<string> => {
    const MAX_RETRIES = 2;
    const TIMEOUT = 30000; // 30 seconds
    
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'File upload failed');
        }
        
        return data.url;
      } catch (error: any) {
        retries++;
        console.error(`Error uploading file (attempt ${retries}/${MAX_RETRIES + 1}):`, error);
        
        if (error.name === 'AbortError') {
          toast({
            title: "Upload Timeout",
            description: `Upload timed out. ${retries <= MAX_RETRIES ? 'Retrying...' : 'Please try again with a smaller file.'}`,
            variant: "destructive",
          });
        } else if (retries <= MAX_RETRIES) {
          toast({
            title: "Upload Failed",
            description: `Retry attempt ${retries}/${MAX_RETRIES}...`,
            variant: "destructive",
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }
    
    // If all retries failed, return a fallback URL
    return file.type.startsWith('image/') 
      ? `https://placehold.co/600x400?text=${encodeURIComponent(file.name.substring(0, 20))}`
      : 'https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);

    try {
      // Upload files if selected
      let backgroundImageUrl = formData.backgroundImage;
      let mediaUrl = formData.mediaUrl;
      
      if (backgroundImageFile) {
        backgroundImageUrl = await uploadFile(backgroundImageFile);
      }
      
      if (mediaFile) {
        mediaUrl = await uploadFile(mediaFile);
      }
      
      // Prepare payload
      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        longDescription: formData.longDescription.trim(),
        isActive: formData.isActive,
        order: Number(formData.order),
        pattern: formData.pattern,
        layoutId: formData.layoutId.trim(),
        contentAlignment: formData.contentAlignment,
        backgroundImage: backgroundImageUrl,
        mediaUrl: mediaUrl,
        mediaType: formData.mediaType,
        titleColor: formData.titleColor,
        descriptionColor: formData.descriptionColor,
        buttonTextColor: formData.buttonTextColor,
        buttonBackgroundColor: formData.buttonBackgroundColor,
        buttons: formData.buttons.map(button => ({
          label: button.label.trim(),
          link: button.link.trim(),
          variant: button.variant || 'primary'
        }))
      };

      let response;
      
      if (mode === 'add') {
        response = await fetch('/api/admin/hero-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (mode === 'edit' && initialData?._id) {
        response = await fetch(`/api/admin/hero-sections/${initialData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      const result = await response?.json();

      if (result?.success) {
        toast({
          title: "Success",
          description: result.message || `Hero section ${mode === 'add' ? 'created' : 'updated'} successfully`,
        });
        
        router.push('/admin/dashboard/hero-sections');
      } else {
        toast({
          title: "Error",
          description: result?.message || `Failed to ${mode} hero section`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the hero section",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Function to get preview component based on selected pattern
  const getPatternPreview = () => {
    const selectedPattern = heroPatterns.find(p => p.value === formData.pattern);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{selectedPattern?.icon}</span>
          <div>
            <h4 className="font-semibold">{selectedPattern?.label}</h4>
            <p className="text-sm text-muted-foreground">{selectedPattern?.description}</p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          {formData.pattern === 'dont-miss' && (
            <div className="bg-gray-900 text-white p-6 rounded-md">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{formData.title || "Don't Miss"}</h3>
                  <p className="text-sm mb-4">{formData.subtitle || "Dark background with prominent product feature"}</p>
                </div>
                {mediaPreview && (
                  <div className="w-32 h-32 bg-gray-800 rounded-md overflow-hidden">
                    <Image 
                      src={mediaPreview} 
                      alt="Media preview" 
                      width={128} 
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {formData.pattern === 'brand-control' && (
            <div className="bg-white p-6 rounded-md border">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {mediaPreview && (
                  <div className="w-40 h-32 bg-gray-100 rounded-md overflow-hidden">
                    <Image 
                      src={mediaPreview} 
                      alt="Media preview" 
                      width={160} 
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{formData.title || "Establish brand control."}</h3>
                  <p className="text-sm mb-4">{formData.subtitle || "Side-by-side image and text layout"}</p>
                </div>
              </div>
            </div>
          )}
          
          {formData.pattern === 'partner' && (
            <div className="bg-white p-6 rounded-md border">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{formData.title || "We're on the same team."}</h3>
                  <p className="text-sm mb-4">{formData.subtitle || "Text on left, media on right"}</p>
                </div>
                {mediaPreview && (
                  <div className="w-40 h-32 bg-gray-100 rounded-md overflow-hidden">
                    {formData.mediaType === 'video' ? (
                      <div className="flex items-center justify-center h-full bg-black/10">
                        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                          <div className="ml-1 w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent"></div>
                        </div>
                      </div>
                    ) : (
                      <Image 
                        src={mediaPreview} 
                        alt="Media preview" 
                        width={160} 
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {formData.pattern === 'standard' && (
            <div 
              className="bg-gray-100 p-6 rounded-md relative overflow-hidden"
              style={{
                backgroundImage: backgroundImagePreview ? `url(${backgroundImagePreview})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div 
                className={`flex flex-col items-${formData.contentAlignment} text-${formData.contentAlignment} relative z-10 p-4 rounded`}
                style={{
                  backgroundColor: backgroundImagePreview ? 'rgba(0,0,0,0.5)' : undefined,
                  color: backgroundImagePreview ? 'white' : 'inherit',
                }}
              >
                <h3 className="text-xl font-bold mb-2" style={{ color: formData.titleColor || undefined }}>
                  {formData.title || "Your Hero Title"}
                </h3>
                <p className="text-sm mb-4" style={{ color: formData.descriptionColor || undefined }}>
                  {formData.subtitle || "Your hero subtitle goes here"}
                </p>
                <div className="flex gap-2 justify-center">
                  {formData.buttons.map((button, index) => (
                    <span 
                      key={index}
                      className="px-4 py-1 text-xs rounded"
                      style={{
                        backgroundColor: formData.buttonBackgroundColor || '#000',
                        color: formData.buttonTextColor || '#fff'
                      }}
                    >
                      {button.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              {mode === 'add' ? 'Add New Hero Section' : 'Edit Hero Section'}
              <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <div className="ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('preview')}
                className="flex items-center gap-1"
              >
                <MdPreview size={16} />
                Preview
              </Button>
            </div>
          </div>
          <CardDescription>
            {mode === 'add' 
              ? 'Create a new hero section to display on the website' 
              : 'Modify this hero section\'s content and settings'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="layout">Layout & Design</TabsTrigger>
                <TabsTrigger value="styling">Styling</TabsTrigger>
                <TabsTrigger value="buttons">Buttons</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter a compelling title (optional)"
                        className={validationErrors.title ? 'border-red-500' : ''}
                      />
                      {validationErrors.title && (
                        <p className="text-sm text-red-500">{validationErrors.title}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Textarea
                        id="subtitle"
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleChange}
                        placeholder="Enter a descriptive subtitle (optional)"
                        rows={3}
                        className={validationErrors.subtitle ? 'border-red-500' : ''}
                      />
                      {validationErrors.subtitle && (
                        <p className="text-sm text-red-500">{validationErrors.subtitle}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="longDescription">Long Description</Label>
                      <Textarea
                        id="longDescription"
                        name="longDescription"
                        value={formData.longDescription}
                        onChange={handleChange}
                        placeholder="Optional detailed description"
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="isActive">Active Status</Label>
                        <p className="text-sm text-muted-foreground">
                          {formData.isActive ? 'Visible on website' : 'Hidden from website'}
                        </p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={handleToggleActive}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="order">Display Order *</Label>
                      <Input
                        id="order"
                        name="order"
                        type="number"
                        value={formData.order}
                        onChange={handleChange}
                        min={1}
                        required
                        className={validationErrors.order ? 'border-red-500' : ''}
                      />
                      {validationErrors.order && (
                        <p className="text-sm text-red-500">{validationErrors.order}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Lower numbers appear higher on the page
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="layoutId">Layout ID</Label>
                      <Input
                        id="layoutId"
                        name="layoutId"
                        value={formData.layoutId}
                        onChange={handleChange}
                        placeholder="Optional specific layout identifier"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Layout & Design Tab */}
              <TabsContent value="layout" className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Select Layout Pattern</Label>
                    <RadioGroup 
                      value={formData.pattern} 
                      onValueChange={(value) => handleSelectChange('pattern', value)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {heroPatterns.map((pattern) => (
                        <div key={pattern.value} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value={pattern.value} id={`pattern-${pattern.value}`} className="mt-1" />
                          <Label 
                            htmlFor={`pattern-${pattern.value}`}
                            className="flex flex-col cursor-pointer flex-1"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{pattern.icon}</span>
                              <span className="font-medium">{pattern.label}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{pattern.description}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator />

                  {formData.pattern === 'standard' && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Standard Pattern Options</h4>
                      
                      <div className="space-y-2">
                        <Label>Content Alignment</Label>
                        <Select
                          value={formData.contentAlignment}
                          onValueChange={(value) => handleSelectChange('contentAlignment', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select alignment" />
                          </SelectTrigger>
                          <SelectContent>
                            {contentAlignments.map((alignment) => (
                              <SelectItem key={alignment.value} value={alignment.value}>
                                {alignment.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Background Image</Label>
                        <div className="border rounded-md p-4">
                          <label
                            htmlFor="background-image-upload"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <div className="w-full h-40 border-2 border-dashed rounded-md flex items-center justify-center mb-2">
                              {backgroundImagePreview ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={backgroundImagePreview}
                                    alt="Background preview"
                                    fill
                                    className="object-cover rounded-md"
                                  />
                                  <div className="absolute inset-0 bg-black/20 rounded-md flex items-center justify-center">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setBackgroundImagePreview('');
                                        setBackgroundImageFile(null);
                                        setFormData(prev => ({ ...prev, backgroundImage: '' }));
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                  <MdCloudUpload size={32} className="mb-2 text-gray-400" />
                                  <p className="text-sm text-gray-500">
                                    Click to upload background image
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Max 5MB • JPG, PNG, WebP
                                  </p>
                                </div>
                              )}
                            </div>
                          </label>
                          <input
                            id="background-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'backgroundImage')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(formData.pattern === 'dont-miss' || formData.pattern === 'brand-control' || formData.pattern === 'partner') && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Media Options</h4>
                      
                      <div className="space-y-2">
                        <Label>Media (Image or Video)</Label>
                        <div className="border rounded-md p-4">
                          <label
                            htmlFor="media-upload"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <div className="w-full h-40 border-2 border-dashed rounded-md flex items-center justify-center mb-2">
                              {mediaPreview ? (
                                <div className="relative w-full h-full">
                                  {formData.mediaType === 'video' ? (
                                    <video
                                      src={mediaPreview}
                                      controls
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  ) : (
                                    <Image
                                      src={mediaPreview}
                                      alt="Media preview"
                                      fill
                                      className="object-cover rounded-md"
                                    />
                                  )}
                                  <div className="absolute top-2 right-2">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setMediaPreview('');
                                        setMediaFile(null);
                                        setFormData(prev => ({ ...prev, mediaUrl: '', mediaType: 'image' }));
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                  <MdCloudUpload size={32} className="mb-2 text-gray-400" />
                                  <p className="text-sm text-gray-500">
                                    Click to upload image or video
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Max 5MB • Images: JPG, PNG, WebP • Videos: MP4, WebM
                                  </p>
                                </div>
                              )}
                            </div>
                          </label>
                          <input
                            id="media-upload"
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'media')}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Styling Tab */}
              <TabsContent value="styling" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Text Colors</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="titleColor">Title Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="titleColor"
                          name="titleColor"
                          type="color"
                          value={formData.titleColor}
                          onChange={handleChange}
                          className="w-20 h-10"
                        />
                        <Input
                          value={formData.titleColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, titleColor: e.target.value }))}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="descriptionColor">Description Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="descriptionColor"
                          name="descriptionColor"
                          type="color"
                          value={formData.descriptionColor}
                          onChange={handleChange}
                          className="w-20 h-10"
                        />
                        <Input
                          value={formData.descriptionColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, descriptionColor: e.target.value }))}
                          placeholder="#666666"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Button Colors</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="buttonTextColor">Button Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="buttonTextColor"
                          name="buttonTextColor"
                          type="color"
                          value={formData.buttonTextColor}
                          onChange={handleChange}
                          className="w-20 h-10"
                        />
                        <Input
                          value={formData.buttonTextColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, buttonTextColor: e.target.value }))}
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="buttonBackgroundColor">Button Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="buttonBackgroundColor"
                          name="buttonBackgroundColor"
                          type="color"
                          value={formData.buttonBackgroundColor}
                          onChange={handleChange}
                          className="w-20 h-10"
                        />
                        <Input
                          value={formData.buttonBackgroundColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, buttonBackgroundColor: e.target.value }))}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Buttons Tab */}
              <TabsContent value="buttons" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Call-to-Action Buttons</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add buttons that will appear in your hero section
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddButton}
                    className="flex items-center gap-1"
                  >
                    <MdAdd size={16} />
                    Add Button
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.buttons.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">No buttons added yet</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddButton}
                        className="flex items-center gap-1"
                      >
                        <MdAdd size={16} />
                        Add Your First Button
                      </Button>
                    </div>
                  ) : (
                    formData.buttons.map((button, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Button {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveButton(index)}
                            className="h-8 w-8 p-0"
                          >
                            <MdDelete size={16} />
                          </Button>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`button-${index}-label`}>Button Text</Label>
                            <Input
                              id={`button-${index}-label`}
                              value={button.label}
                              onChange={(e) => handleButtonChange(index, 'label', e.target.value)}
                              placeholder="e.g., Shop Now"
                              className={validationErrors[`button_${index}_label`] ? 'border-red-500' : ''}
                            />
                            {validationErrors[`button_${index}_label`] && (
                              <p className="text-sm text-red-500">{validationErrors[`button_${index}_label`]}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`button-${index}-link`}>Link URL</Label>
                            <Input
                              id={`button-${index}-link`}
                              value={button.link}
                              onChange={(e) => handleButtonChange(index, 'link', e.target.value)}
                              placeholder="e.g., /shop"
                              className={validationErrors[`button_${index}_link`] ? 'border-red-500' : ''}
                            />
                            {validationErrors[`button_${index}_link`] && (
                              <p className="text-sm text-red-500">{validationErrors[`button_${index}_link`]}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`button-${index}-variant`}>Button Style</Label>
                            <Select
                              value={button.variant}
                              onValueChange={(value) => handleButtonChange(index, 'variant', value)}
                            >
                              <SelectTrigger id={`button-${index}-variant`}>
                                <SelectValue placeholder="Select a style" />
                              </SelectTrigger>
                              <SelectContent>
                                {buttonVariants.map((variant) => (
                                  <SelectItem key={variant.value} value={variant.value}>
                                    {variant.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Button Preview */}
                        <div className="pt-2 border-t">
                          <Label className="text-sm text-muted-foreground">Preview:</Label>
                          <div className="mt-2">
                            <Button 
                              type="button"
                              variant={button.variant as any || 'default'} 
                              disabled
                              style={{
                                backgroundColor: formData.buttonBackgroundColor || undefined,
                                color: formData.buttonTextColor || undefined
                              }}
                            >
                              {button.label || 'Button Text'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MdPreview />
                    Live Preview
                  </h3>
                  {getPatternPreview()}
                </div>
                
                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Content Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {formData.title || 'Not set'}</div>
                    <div><strong>Subtitle:</strong> {formData.subtitle || 'Not set'}</div>
                    <div><strong>Pattern:</strong> {heroPatterns.find(p => p.value === formData.pattern)?.label}</div>
                    <div><strong>Status:</strong> {formData.isActive ? 'Active' : 'Inactive'}</div>
                    <div><strong>Order:</strong> {formData.order}</div>
                    <div><strong>Buttons:</strong> {formData.buttons.length}</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/dashboard/hero-sections')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                mode === 'add' ? 'Create Section' : 'Update Section'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}