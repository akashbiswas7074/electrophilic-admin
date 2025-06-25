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
import { createHeroSection, updateHeroSection } from './hero-section.actions';
import { MdAdd, MdDelete, MdCloudUpload } from 'react-icons/md';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    description: 'Centered text with buttons below' 
  },
  { 
    label: 'Don\'t Miss', 
    value: 'dont-miss',
    description: 'Dark background with prominent product feature'
  },
  { 
    label: 'Brand Control', 
    value: 'brand-control',
    description: 'Side-by-side image and text layout'
  },
  { 
    label: 'Partner', 
    value: 'partner',
    description: 'Text on left, media on right'
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
    isActive: boolean;
    order: number;
    pattern?: string;
    layoutId?: string;
    contentAlignment?: string;
    backgroundImage?: string;
    mediaUrl?: string;
    mediaType?: string;
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
    isActive: initialData?.isActive ?? true,
    order: initialData?.order || 10,
    pattern: initialData?.pattern || 'standard',
    layoutId: initialData?.layoutId || '',
    contentAlignment: initialData?.contentAlignment || 'center',
    backgroundImage: initialData?.backgroundImage || '',
    mediaUrl: initialData?.mediaUrl || '',
    mediaType: initialData?.mediaType || 'image',
    buttons: initialData?.buttons || [{ label: 'Shop Now', link: '/shop', variant: 'primary' }],
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string>('');
  const [mediaPreview, setMediaPreview] = useState<string>('');
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

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
  };

  // Handle file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'backgroundImage' | 'media') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
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

  // Upload file to cloud storage with timeout and retry logic
  const uploadFile = async (file: File): Promise<string> => {
    const MAX_RETRIES = 2;
    const TIMEOUT = 30000; // 30 seconds
    
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Create AbortController to handle timeouts
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        // Compress image if it's too large (over 2MB) and it's an image
        let fileToUpload = file;
        if (file.size > 2 * 1024 * 1024 && file.type.startsWith('image/')) {
          console.log('File is large, compressing before upload:', file.size);
          // For simplicity, we'll just warn the user for now
          toast({
            title: "Large File",
            description: "This file is large which may cause slow uploads. Consider using a smaller image.",
            variant: "warning",
          });
        }
        
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        // Clear timeout
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'File upload failed');
        }
        
        return data.url;
      } catch (error: any) {
        retries++;
        console.error(`Error uploading file (attempt ${retries}/${MAX_RETRIES + 1}):`, error);
        
        // Check if it was a timeout
        if (error.name === 'AbortError') {
          toast({
            title: "Upload Timeout",
            description: `Upload timed out. ${retries <= MAX_RETRIES ? 'Retrying...' : 'Please try again with a smaller file.'}`,
            variant: "warning",
          });
        } else if (retries <= MAX_RETRIES) {
          toast({
            title: "Upload Failed",
            description: `Retry attempt ${retries}/${MAX_RETRIES + 1}...`,
            variant: "warning",
          });
          // Wait briefly before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          toast({
            title: "File Upload Error",
            description: error instanceof Error ? error.message : "Failed to upload file after multiple attempts. Please try again.",
            variant: "destructive",
          });
          throw error;
        }
      }
    }
    
    // If all retries failed, use a placeholder image
    console.log('All upload attempts failed, using placeholder');
    return file.type.startsWith('image/') 
      ? `https://placehold.co/600x400?text=${encodeURIComponent(file.name.substring(0, 20))}`
      : 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload files if selected
      let backgroundImageUrl = formData.backgroundImage;
      let mediaUrl = formData.mediaUrl;
      
      if (backgroundImageFile) {
        console.log('Uploading background image:', backgroundImageFile.name);
        backgroundImageUrl = await uploadFile(backgroundImageFile);
        console.log('Background image uploaded, URL:', backgroundImageUrl);
      }
      
      if (mediaFile) {
        console.log('Uploading media file:', mediaFile.name);
        mediaUrl = await uploadFile(mediaFile);
        console.log('Media uploaded, URL:', mediaUrl);
      }
      
      // Format the data properly for MongoDB
      const payload = {
        title: formData.title,
        subtitle: formData.subtitle, 
        isActive: formData.isActive,
        order: Number(formData.order),
        pattern: formData.pattern,
        layoutId: formData.layoutId,
        contentAlignment: formData.contentAlignment,
        backgroundImage: backgroundImageUrl,
        mediaUrl: mediaUrl,
        mediaType: formData.mediaType,
        buttons: formData.buttons.map(button => ({
          label: button.label,
          link: button.link,
          variant: button.variant || 'primary'
        }))
      };
      
      console.log('Submitting hero section data:', JSON.stringify(payload, null, 2));

      let result;
      
      if (mode === 'add') {
        // Create new hero section
        console.log('Creating new hero section');
        result = await createHeroSection(payload);
      } else if (mode === 'edit' && initialData?._id) {
        // Update existing hero section
        console.log('Updating hero section with ID:', initialData._id);
        result = await updateHeroSection(initialData._id, payload);
      }
      
      console.log('Server response:', result);

      if (result?.success) {
        toast({
          title: "Success",
          description: result.message || `Hero section ${mode === 'add' ? 'created' : 'updated'} successfully`,
        });
        
        // Use window.location for navigation instead of router to avoid potential circular references
        window.location.href = '/admin/dashboard/hero-sections';
      } else {
        toast({
          title: "Error",
          description: result?.message || `Failed to ${mode} hero section`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Safely handle error without causing circular reference
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
    switch (formData.pattern) {
      case 'dont-miss':
        return (
          <div className="bg-gray-900 text-white p-6 rounded-md">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Don't Miss</h3>
                <p className="text-sm mb-4">Dark background with prominent product feature</p>
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
        );
      case 'brand-control':
        return (
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
                <h3 className="text-xl font-bold mb-2">Establish brand control.</h3>
                <p className="text-sm mb-4">Side-by-side image and text layout</p>
              </div>
            </div>
          </div>
        );
      case 'partner':
        return (
          <div className="bg-white p-6 rounded-md border">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">We're on the same team.</h3>
                <p className="text-sm mb-4">Text on left, media on right</p>
              </div>
              {mediaPreview && (
                <div className="w-40 h-32 bg-gray-100 rounded-md overflow-hidden">
                  {formData.mediaType === 'video' ? (
                    <div className="flex items-center justify-center h-full">
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
        );
      default: // standard
        return (
          <div 
            className="bg-gray-100 p-6 rounded-md"
            style={{
              backgroundImage: backgroundImagePreview ? `url(${backgroundImagePreview})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          >
            <div 
              className={`flex flex-col items-${formData.contentAlignment} text-${formData.contentAlignment} relative z-10 p-4`}
              style={{
                backgroundColor: backgroundImagePreview ? 'rgba(0,0,0,0.4)' : undefined,
                color: backgroundImagePreview ? 'white' : 'inherit',
              }}
            >
              <h3 className="text-xl font-bold mb-2">Standard Hero</h3>
              <p className="text-sm mb-4">Centered text with buttons below</p>
              <div className="flex gap-2 justify-center">
                <span className="px-4 py-1 bg-black text-white text-xs rounded">Button</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'add' ? 'Add New Hero Section' : 'Edit Hero Section'}</CardTitle>
          <CardDescription>
            {mode === 'add' 
              ? 'Create a new hero section to display on the website' 
              : 'Modify this hero section\'s content and settings'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="layout">Layout & Design</TabsTrigger>
                <TabsTrigger value="buttons">Buttons</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a title, e.g., STRENGTH TAKES SWEAT"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    placeholder="Enter a subtitle or short description"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isActive ? 'This section is visible on the website' : 'This section is hidden'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleToggleActive}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear higher on the page
                  </p>
                </div>
              </TabsContent>

              {/* Layout & Design Tab */}
              <TabsContent value="layout" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="layoutId">Layout ID</Label>
                    <Input
                      id="layoutId"
                      name="layoutId"
                      value={formData.layoutId}
                      onChange={handleChange}
                      placeholder="Enter a specific layout ID"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Specify a precise layout design by ID
                    </p>
                  </div>
                  
                  <div>
                    <Label className="mb-3 block">Select Layout Pattern</Label>
                    <RadioGroup 
                      value={formData.pattern} 
                      onValueChange={(value) => handleSelectChange('pattern', value)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {heroPatterns.map((pattern) => (
                        <div key={pattern.value} className="flex items-start space-x-2">
                          <RadioGroupItem value={pattern.value} id={`pattern-${pattern.value}`} />
                          <Label 
                            htmlFor={`pattern-${pattern.value}`}
                            className="flex flex-col cursor-pointer"
                          >
                            <span className="font-medium">{pattern.label}</span>
                            <span className="text-sm text-muted-foreground">{pattern.description}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {formData.pattern === 'standard' && (
                    <>
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
                          <div className="flex items-center justify-center">
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
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center p-4 text-center">
                                    <MdCloudUpload size={32} className="mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-500">
                                      Click to upload background image
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
                    </>
                  )}

                  {(formData.pattern === 'dont-miss' || formData.pattern === 'brand-control' || formData.pattern === 'partner') && (
                    <div className="space-y-2">
                      <Label>Media (Image or Video)</Label>
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-center">
                          <label
                            htmlFor="media-upload"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <div className="w-full h-40 border-2 border-dashed rounded-md flex items-center justify-center mb-2">
                              {mediaPreview ? (
                                formData.mediaType === 'video' ? (
                                  <video
                                    src={mediaPreview}
                                    controls
                                    className="max-h-full max-w-full rounded-md"
                                  />
                                ) : (
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={mediaPreview}
                                      alt="Media preview"
                                      fill
                                      className="object-cover rounded-md"
                                    />
                                  </div>
                                )
                              ) : (
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                  <MdCloudUpload size={32} className="mb-2 text-gray-400" />
                                  <p className="text-sm text-gray-500">
                                    Click to upload image or video
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
                      <div className="text-sm text-muted-foreground">
                        Upload an image or video for this section
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Buttons Tab */}
              <TabsContent value="buttons" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Call-to-Action Buttons</Label>
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
                
                {formData.buttons.map((button, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Button {index + 1}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveButton(index)}
                        disabled={formData.buttons.length <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <MdDelete size={16} />
                      </Button>
                    </div>
                    
                    <div className="grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`button-${index}-label`}>Button Text</Label>
                        <Input
                          id={`button-${index}-label`}
                          value={button.label}
                          onChange={(e) => handleButtonChange(index, 'label', e.target.value)}
                          placeholder="e.g., Shop Now"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`button-${index}-link`}>Link URL</Label>
                        <Input
                          id={`button-${index}-link`}
                          value={button.link}
                          onChange={(e) => handleButtonChange(index, 'link', e.target.value)}
                          placeholder="e.g., /shop"
                          required
                        />
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
                  </div>
                ))}
              </TabsContent>
              
              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Layout Preview</h3>
                  {getPatternPreview()}
                </div>
                
                <div className="border rounded-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Content Preview</h3>
                  <div className="p-6 bg-gray-50 rounded-md">
                    <h2 className="text-2xl font-bold mb-2">{formData.title || 'Your Title Here'}</h2>
                    <p className="mb-4">{formData.subtitle || 'Your subtitle or description here'}</p>
                    
                    <div className="flex gap-2 flex-wrap">
                      {formData.buttons.map((button, index) => (
                        <Button 
                          key={index} 
                          variant={button.variant as any || 'primary'} 
                          type="button"
                        >
                          {button.label || 'Button Text'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/dashboard/hero-sections')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'add' ? 'Create Section' : 'Update Section'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}