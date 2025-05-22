"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useWebsiteFooter } from "@/hooks/use-website-footer";
import { IWebsiteFooter } from "@/lib/database/models/website.footer.model"; 
import { AlertCircle, CheckCircle, Loader2, Plus, Trash2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Schema for a link item
const linkItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().min(1, "URL is required"),
});

// Define schema for footer form
const footerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  contactInfo: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().min(1, { message: "Phone number is required" }),
    address: z.string().min(1, { message: "Address is required" }),
  }),
  socialMedia: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  companyLinks: z.array(linkItemSchema).optional(),
  shopLinks: z.array(linkItemSchema).optional(),
  helpLinks: z.array(linkItemSchema).optional(),
  copyrightText: z.string().min(1, { message: "Copyright text is required" }),
  isActive: z.boolean().default(false),
});

type FooterFormValues = z.infer<typeof footerSchema>;

interface SiteFooterFormProps {
  initialData?: IWebsiteFooter[];
}

export function SiteFooterForm({ initialData = [] }: SiteFooterFormProps) {
  const { toast } = useToast();
  const { refetch } = useWebsiteFooter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedFooterId, setSelectedFooterId] = useState<string | null>(null);
  
  // Set default company links
  const defaultCompanyLinks = [
    { title: "About Us", url: "/about" },
    { title: "Contact Us", url: "/contact" }
  ];
  
  // Set default shop links
  const defaultShopLinks = [
    { title: "All Products", url: "/shop" },
    { title: "New Arrivals", url: "/shop/new-arrivals" }
  ];
  
  // Set default help links
  const defaultHelpLinks = [
    { title: "FAQs", url: "/faqs" },
    { title: "Shipping", url: "/shipping" }
  ];
  
  const [companyLinks, setCompanyLinks] = useState<{ title: string; url: string }[]>(
    initialData.length > 0 && initialData[0]?.companyLinks?.length 
      ? [...initialData[0].companyLinks] 
      : [...defaultCompanyLinks]
  );
  
  const [shopLinks, setShopLinks] = useState<{ title: string; url: string }[]>(
    initialData.length > 0 && initialData[0]?.shopLinks?.length 
      ? [...initialData[0].shopLinks] 
      : [...defaultShopLinks]
  );
  
  const [helpLinks, setHelpLinks] = useState<{ title: string; url: string }[]>(
    initialData.length > 0 && initialData[0]?.helpLinks?.length 
      ? [...initialData[0].helpLinks] 
      : [...defaultHelpLinks]
  );

  // Set default values based on first item in initialData or use empty defaults
  const defaultValues: FooterFormValues = initialData.length > 0 
    ? {
        name: initialData[0]?.name || "Main Footer",
        contactInfo: {
          email: initialData[0]?.contactInfo?.email || "contact@example.com",
          phone: initialData[0]?.contactInfo?.phone || "+1 (123) 456-7890",
          address: initialData[0]?.contactInfo?.address || "123 Street Name, City, State, ZIP",
        },
        socialMedia: {
          facebook: initialData[0]?.socialMedia?.facebook || "",
          twitter: initialData[0]?.socialMedia?.twitter || "",
          instagram: initialData[0]?.socialMedia?.instagram || "",
          youtube: initialData[0]?.socialMedia?.youtube || "",
          linkedin: initialData[0]?.socialMedia?.linkedin || "",
        },
        companyLinks: initialData[0]?.companyLinks || defaultCompanyLinks,
        shopLinks: initialData[0]?.shopLinks || defaultShopLinks,
        helpLinks: initialData[0]?.helpLinks || defaultHelpLinks,
        copyrightText: initialData[0]?.copyrightText || `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
        isActive: initialData[0]?.isActive || false,
      }
    : {
        name: "Main Footer",
        contactInfo: {
          email: "contact@example.com",
          phone: "+1 (123) 456-7890",
          address: "123 Street Name, City, State, ZIP",
        },
        socialMedia: {
          facebook: "",
          twitter: "",
          instagram: "",
          youtube: "",
          linkedin: "",
        },
        companyLinks: defaultCompanyLinks,
        shopLinks: defaultShopLinks,
        helpLinks: defaultHelpLinks,
        copyrightText: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
        isActive: true, // First footer will be active by default
      };

  // Create form with the default values
  const form = useForm<FooterFormValues>({
    resolver: zodResolver(footerSchema),
    defaultValues,
  });
  
  // Set form values when initialData changes
  useEffect(() => {
    if (initialData.length > 0) {
      const activeFooter = initialData.find(footer => footer.isActive) || initialData[0];
      setSelectedFooterId(activeFooter?._id || null);
      
      form.reset({
        name: activeFooter?.name || defaultValues.name,
        contactInfo: {
          email: activeFooter?.contactInfo?.email || defaultValues.contactInfo.email,
          phone: activeFooter?.contactInfo?.phone || defaultValues.contactInfo.phone,
          address: activeFooter?.contactInfo?.address || defaultValues.contactInfo.address,
        },
        socialMedia: {
          facebook: activeFooter?.socialMedia?.facebook || "",
          twitter: activeFooter?.socialMedia?.twitter || "",
          instagram: activeFooter?.socialMedia?.instagram || "",
          youtube: activeFooter?.socialMedia?.youtube || "",
          linkedin: activeFooter?.socialMedia?.linkedin || "",
        },
        copyrightText: activeFooter?.copyrightText || defaultValues.copyrightText,
        isActive: activeFooter?.isActive || defaultValues.isActive,
      });
      
      // Update link arrays if they exist
      if (activeFooter?.companyLinks?.length) {
        setCompanyLinks([...activeFooter.companyLinks]);
      }
      
      if (activeFooter?.shopLinks?.length) {
        setShopLinks([...activeFooter.shopLinks]);
      }
      
      if (activeFooter?.helpLinks?.length) {
        setHelpLinks([...activeFooter.helpLinks]);
      }
    }
  }, [initialData, form]);

  // Select a different footer configuration
  const selectFooter = (footerId: string) => {
    const selectedFooter = initialData.find(footer => footer._id === footerId);
    if (selectedFooter) {
      setSelectedFooterId(footerId);
      
      form.reset({
        name: selectedFooter?.name || "",
        contactInfo: {
          email: selectedFooter?.contactInfo?.email || "",
          phone: selectedFooter?.contactInfo?.phone || "",
          address: selectedFooter?.contactInfo?.address || "",
        },
        socialMedia: {
          facebook: selectedFooter?.socialMedia?.facebook || "",
          twitter: selectedFooter?.socialMedia?.twitter || "",
          instagram: selectedFooter?.socialMedia?.instagram || "",
          youtube: selectedFooter?.socialMedia?.youtube || "",
          linkedin: selectedFooter?.socialMedia?.linkedin || "",
        },
        copyrightText: selectedFooter?.copyrightText || "",
        isActive: selectedFooter?.isActive || false,
      });
      
      // Update link arrays
      if (selectedFooter?.companyLinks?.length) {
        setCompanyLinks([...selectedFooter.companyLinks]);
      } else {
        setCompanyLinks([...defaultCompanyLinks]);
      }
      
      if (selectedFooter?.shopLinks?.length) {
        setShopLinks([...selectedFooter.shopLinks]);
      } else {
        setShopLinks([...defaultShopLinks]);
      }
      
      if (selectedFooter?.helpLinks?.length) {
        setHelpLinks([...selectedFooter.helpLinks]);
      } else {
        setHelpLinks([...defaultHelpLinks]);
      }
    }
  };

  // Delete a footer configuration
  const deleteFooter = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/website/footer?id=${id}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Footer configuration deleted successfully",
          variant: "default",
        });
        
        refetch(); // Refresh footer data
        
        // Reload the page to see the updated data
        window.location.reload();
      } else {
        throw new Error(result.message || "Failed to delete footer configuration");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while deleting the footer",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Create new footer configuration
  const createNewFooter = () => {
    setSelectedFooterId(null);
    
    form.reset({
      name: "Main Footer",
      contactInfo: {
        email: "contact@example.com",
        phone: "+1 (123) 456-7890",
        address: "123 Street Name, City, State, ZIP",
      },
      socialMedia: {
        facebook: "",
        twitter: "",
        instagram: "",
        youtube: "",
        linkedin: "",
      },
      copyrightText: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
      isActive: false,
    });
    
    setCompanyLinks([...defaultCompanyLinks]);
    setShopLinks([...defaultShopLinks]);
    setHelpLinks([...defaultHelpLinks]);
  };

  async function onSubmit(data: FooterFormValues) {
    // Add the links to the data before submission
    const formData = {
      ...data,
      _id: selectedFooterId, // Include ID if editing an existing footer
      companyLinks: companyLinks.filter(link => link.title && link.url),
      shopLinks: shopLinks.filter(link => link.title && link.url),
      helpLinks: helpLinks.filter(link => link.title && link.url),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/website/footer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Footer configuration saved successfully",
          variant: "default",
        });
        
        refetch(); // Refresh footer data
        
        // Reload the page to see the updated data
        window.location.reload();
      } else {
        throw new Error(result.message || "Failed to save footer configuration");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving the footer configuration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Link management functions for company links
  const addCompanyLink = () => {
    setCompanyLinks([...companyLinks, { title: "", url: "" }]);
  };
  
  const updateCompanyLink = (index: number, field: 'title' | 'url', value: string) => {
    const updatedLinks = [...companyLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setCompanyLinks(updatedLinks);
  };
  
  const removeCompanyLink = (index: number) => {
    setCompanyLinks(companyLinks.filter((_, i) => i !== index));
  };
  
  // Link management functions for shop links
  const addShopLink = () => {
    setShopLinks([...shopLinks, { title: "", url: "" }]);
  };
  
  const updateShopLink = (index: number, field: 'title' | 'url', value: string) => {
    const updatedLinks = [...shopLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setShopLinks(updatedLinks);
  };
  
  const removeShopLink = (index: number) => {
    setShopLinks(shopLinks.filter((_, i) => i !== index));
  };
  
  // Link management functions for help links
  const addHelpLink = () => {
    setHelpLinks([...helpLinks, { title: "", url: "" }]);
  };
  
  const updateHelpLink = (index: number, field: 'title' | 'url', value: string) => {
    const updatedLinks = [...helpLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setHelpLinks(updatedLinks);
  };
  
  const removeHelpLink = (index: number) => {
    setHelpLinks(helpLinks.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Footer Configurations List */}
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>Manage Footer Configurations</CardTitle>
          <CardDescription>
            Select a footer to edit or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Existing Footers</h3>
              <Button onClick={createNewFooter} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Footer
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialData.map((footer) => (
                <div 
                  key={footer._id} 
                  className={`p-4 border rounded-lg ${
                    selectedFooterId === footer._id ? 'border-primary bg-primary/5' : 'border-gray-200'
                  } cursor-pointer relative`}
                  onClick={() => selectFooter(footer._id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{footer.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{footer.contactInfo?.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      {footer.isActive && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Footer Configuration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this footer configuration?
                              {footer.isActive && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-yellow-800">
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  This is the active footer currently displayed on your site.
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteFooter(footer._id)}
                              disabled={isDeleting}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {isDeleting && deleteId === footer._id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting
                                </>
                              ) : (
                                "Delete Footer"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
              
              {initialData.length === 0 && (
                <div className="col-span-2 p-8 text-center border border-dashed rounded-lg">
                  <p className="text-gray-500">No footer configurations found. Create your first one.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Editing Form */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {selectedFooterId ? "Edit Footer Configuration" : "Create New Footer"}
          </CardTitle>
          <CardDescription>
            {selectedFooterId 
              ? "Update your selected footer configuration" 
              : "Create a new footer configuration for your website"}
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="general">
              <div className="px-6">
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="contact">Contact Info</TabsTrigger>
                  <TabsTrigger value="social">Social Media</TabsTrigger>
                  <TabsTrigger value="links">Footer Links</TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="space-y-6">
                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Main Footer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="copyrightText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copyright Text</FormLabel>
                        <FormControl>
                          <Input placeholder="© 2025 Your Company. All rights reserved." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Set as Active</FormLabel>
                          <CardDescription>
                            This footer configuration will be displayed on your website
                          </CardDescription>
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
                </TabsContent>

                {/* Contact Info Tab */}
                <TabsContent value="contact" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactInfo.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="123 Street Name, City, State, ZIP" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Social Media Tab */}
                <TabsContent value="social" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="socialMedia.facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/yourpage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialMedia.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/yourhandle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialMedia.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/yourhandle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialMedia.youtube"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/c/yourchannel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialMedia.linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/company/yourcompany" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Links Tab */}
                <TabsContent value="links" className="space-y-6">
                  {/* Company Links */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Company Links</h3>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={addCompanyLink}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                    
                    {companyLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Link Title"
                            value={link.title}
                            onChange={(e) => updateCompanyLink(index, 'title', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="URL (e.g., /about)"
                            value={link.url}
                            onChange={(e) => updateCompanyLink(index, 'url', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCompanyLink(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Shop Links */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Shop Links</h3>
                      <Button 
                        type="button"
                        size="sm" 
                        variant="outline" 
                        onClick={addShopLink}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                    
                    {shopLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Link Title"
                            value={link.title}
                            onChange={(e) => updateShopLink(index, 'title', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="URL (e.g., /shop/category)"
                            value={link.url}
                            onChange={(e) => updateShopLink(index, 'url', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeShopLink(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Help Links */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Help Links</h3>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={addHelpLink}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                    
                    {helpLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Link Title"
                            value={link.title}
                            onChange={(e) => updateHelpLink(index, 'title', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="URL (e.g., /help/faq)"
                            value={link.url}
                            onChange={(e) => updateHelpLink(index, 'url', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeHelpLink(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                    </>
                  ) : (
                    selectedFooterId ? "Update Footer Configuration" : "Create Footer Configuration"
                  )}
                </Button>
              </CardFooter>
            </Tabs>
          </form>
        </Form>
      </Card>
    </>
  );
}