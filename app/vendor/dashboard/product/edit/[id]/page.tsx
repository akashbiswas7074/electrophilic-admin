"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { useParams, useRouter } from "next/navigation";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

// Import icons
import { 
  Check, 
  Trash, 
  Plus, 
  Upload, 
  Info, 
  ArrowRight,
} from "lucide-react";

import {
  updateProduct,
  getParentsandCategories,
  getEntireProductById,
} from "@/lib/database/actions/admin/products/products.actions";
import { getSubCategoriesByCategoryParent } from "@/lib/database/actions/admin/subCategories/subcategories.actions";

// Import RichTextEditor component
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { joditConfig } from "@/components/ui/rich-text-editor";

const PreviewContent = ({ content, mode, onClose }: { content: string; mode: 'desktop' | 'mobile'; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg overflow-hidden flex flex-col ${mode === 'desktop' ? 'w-[80%] h-[80%]' : 'w-[375px] h-[80%]'}`}>
        <div className="flex justify-between items-center bg-gray-100 px-4 py-2">
          <h3 className="font-medium">{mode === 'desktop' ? 'Desktop' : 'Mobile'} Preview</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className={`${mode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'} bg-white h-full overflow-y-auto`}>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const EditProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  
  const [images, setImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]); // Track images to delete
  const [parents, setParents] = useState<{ _id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [subs, setSubs] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [featuredCheck, setFeaturedCheck] = useState<boolean>(false);
  const editor = useRef(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [originalProduct, setOriginalProduct] = useState<any>(null);

  // Form state
  const [formValues, setFormValues] = useState<any>({
    name: "",
    description: "",
    brand: "",
    sku: "",
    discount: 0,
    imageFiles: [],
    longDescription: "",
    parent: "",
    category: "",
    subCategories: [],
    sizes: [{ size: "", qty: "", price: "" }],
    benefits: [{ name: "" }],
    ingredients: [{ name: "" }],
    questions: [{ question: "", answer: "" }],
    shippingFee: "",
    details: [{ name: "", value: "" }],
  });

  const [formErrors, setFormErrors] = useState<any>({});

  // Fetch product data when component mounts
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;
      
      setLoading(true);
      try {
        const result = await getEntireProductById(productId);
        if (result && result.success) {
          setOriginalProduct(result.product);
          const product = result.product;
          
          // Set the form values based on the product data
          setFormValues({
            name: product.name || "",
            description: product.description || "",
            brand: product.brand || "",
            sku: product.subProducts?.[0]?.sku || "",
            discount: product.subProducts?.[0]?.discount || 0,
            imageFiles: [],
            longDescription: product.longDescription || "",
            parent: product.parent || "",
            category: product.category?._id || "",
            subCategories: product.subCategories?.map((subCat: any) => subCat._id) || [],
            sizes: product.subProducts?.[0]?.sizes?.length > 0 
              ? product.subProducts[0].sizes 
              : [{ size: "", qty: "", price: "" }],
            benefits: product.benefits?.length > 0 
              ? product.benefits 
              : [{ name: "" }],
            ingredients: product.ingredients?.length > 0 
              ? product.ingredients 
              : [{ name: "" }],
            questions: product.questions?.length > 0 
              ? product.questions 
              : [{ question: "", answer: "" }],
            shippingFee: product.shippingFee || "",
            details: product.details?.length > 0 
              ? product.details 
              : [{ name: "", value: "" }],
          });
          
          // Set existing images
          if (product.subProducts?.[0]?.images?.length > 0) {
            setExistingImages(product.subProducts[0].images);
          }
          
          // Set featured status
          setFeaturedCheck(product.featured || false);
          
          setLoading(false);
        } else {
          toast({
            title: "Error",
            description: result?.message || "Failed to load product details",
            variant: "destructive"
          });
          router.push("/admin/dashboard/product/all/tabular");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An error occurred while loading product details",
          variant: "destructive"
        });
        router.push("/admin/dashboard/product/all/tabular");
      }
    };

    fetchProductData();
  }, [productId, router]);

  const validateForm = () => {
    const errors: any = {};
    if (!formValues.name || formValues.name.length < 10) {
      errors.name = "Product name must be at least 10 characters";
    }
    if (!formValues.description || formValues.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    if (formValues.imageFiles.length === 0 && existingImages.length === 0) {
      errors.imageFiles = "You must have at least one image";
    }
    if (!formValues.sku) {
      errors.sku = "SKU is required";
    }
    if (!formValues.category) {
      errors.category = "Category is required";
    }
    
    // Sizes are now optional - no validation required
    // Products can be created without any sizes for items like accessories, electronics, etc.

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormValues((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      // Create URL previews for the images
      const fileArray = Array.from(event.target.files);
      const previewUrls = fileArray.map(file => URL.createObjectURL(file));
      
      // Update the images preview state
      setImages(previewUrls);
      
      // Update the form values with the actual file objects
      setFormValues((prev: any) => ({
        ...prev,
        imageFiles: fileArray
      }));
      
      // Clear any existing errors for the images
      if (formErrors.imageFiles) {
        setFormErrors((prev: any) => ({
          ...prev,
          imageFiles: undefined
        }));
      }
    }
  };

  // Dynamic field handlers
  const addSize = () => {
    setFormValues((prev: any) => ({
      ...prev,
      sizes: [...prev.sizes, { size: "", qty: "", price: "" }]
    }));
  };

  const updateSize = (index: number, field: string, value: string) => {
    const updatedSizes = [...formValues.sizes];
    updatedSizes[index] = { ...updatedSizes[index], [field]: value };
    handleInputChange("sizes", updatedSizes);
  };

  const removeSize = (index: number) => {
    const updatedSizes = formValues.sizes.filter((_: any, i: number) => i !== index);
    handleInputChange("sizes", updatedSizes);
  };

  // Similar handlers for benefits, ingredients, details
  const addBenefit = () => {
    setFormValues((prev: any) => ({
      ...prev,
      benefits: [...prev.benefits, { name: "" }]
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    const updatedBenefits = [...formValues.benefits];
    updatedBenefits[index] = { name: value };
    handleInputChange("benefits", updatedBenefits);
  };

  const removeBenefit = (index: number) => {
    const updatedBenefits = formValues.benefits.filter((_: any, i: number) => i !== index);
    handleInputChange("benefits", updatedBenefits);
  };

  const addIngredient = () => {
    setFormValues((prev: any) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "" }]
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    const updatedIngredients = [...formValues.ingredients];
    updatedIngredients[index] = { name: value };
    handleInputChange("ingredients", updatedIngredients);
  };

  const removeIngredient = (index: number) => {
    const updatedIngredients = formValues.ingredients.filter((_: any, i: number) => i !== index);
    handleInputChange("ingredients", updatedIngredients);
  };

  const addDetail = () => {
    setFormValues((prev: any) => ({
      ...prev,
      details: [...prev.details, { name: "", value: "" }]
    }));
  };

  const updateDetail = (index: number, field: string, value: string) => {
    const updatedDetails = [...formValues.details];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    handleInputChange("details", updatedDetails);
  };

  const removeDetail = (index: number) => {
    const updatedDetails = formValues.details.filter((_: any, i: number) => i !== index);
    handleInputChange("details", updatedDetails);
  };

  // Add question handlers
  const addQuestion = () => {
    setFormValues((prev: any) => ({
      ...prev,
      questions: [...prev.questions, { question: "", answer: "" }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updatedQuestions = [...formValues.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    handleInputChange("questions", updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = formValues.questions.filter((_: any, i: number) => i !== index);
    handleInputChange("questions", updatedQuestions);
  };

  // handle Submit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const updateProductHandler = async () => {
      setLoading(true);
      try {
        let uploaded_images = existingImages;
        
        // Upload new images if any
        if (formValues.imageFiles.length > 0) {
          const array = [];
          
          // Upload images via API route
          for (let i = 0; i < formValues.imageFiles.length; i++) {
            const formData = new FormData();
            formData.append("file", formValues.imageFiles[i]);
            formData.append("upload_preset", "website"); // Send preset to API route
            try {
              // Call the internal API route
              const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });

              if (!uploadResponse.ok) {
                let errorDetail = `Upload failed for image ${i + 1} with status: ${uploadResponse.status}`;
                try {
                  // Attempt to parse error response as JSON
                  const errorData = await uploadResponse.json();
                  errorDetail = errorData.error?.message || errorData.error || errorData.message || JSON.stringify(errorData);
                } catch (jsonError) {
                  // If not JSON, try to read as text
                  try {
                    const textError = await uploadResponse.text();
                    if (textError) errorDetail = textError;
                  } catch (textParseError) {
                    // If text reading also fails, stick to the status code message
                  }
                }
                console.error(`API route upload error for image ${i + 1}:`, errorDetail);
                throw new Error(errorDetail); 
              }

              const uploadedImagesData = await uploadResponse.json();

              // Check for application-specific errors in the successful (2xx) JSON response
              if (uploadedImagesData.error) {
                const appErrorDetail = uploadedImagesData.error?.message || uploadedImagesData.error;
                console.error(`Application error in upload response for image ${i + 1}:`, appErrorDetail);
                throw new Error(String(appErrorDetail)); 
              }
              
              array.push(uploadedImagesData);
            } catch (error: any) {
              console.error(`Error processing image ${i + 1} via API route:`, error);
              setLoading(false);
              toast({
                title: "Error",
                description: `Error uploading image ${i + 1}: ${error.message || String(error)}`,
                variant: "destructive"
              });
              return;
            }
          }
          
          // Prepare the uploaded images for submission
          const new_uploaded_images = array.map((i) => ({
            url: i.secure_url,
            public_id: i.public_id,
          }));
          
          // Combine existing images with newly uploaded ones
          uploaded_images = [...existingImages, ...new_uploaded_images];
        }
        
        // Call the update product function with all parameters including images
        const result = await updateProduct(
          productId,
          formValues.sku,
          formValues.sizes,
          formValues.discount,
          formValues.name,
          formValues.description,
          formValues.longDescription,
          formValues.brand,
          formValues.details,
          formValues.questions,
          formValues.benefits,
          formValues.ingredients,
          uploaded_images, // images parameter
          formValues.category,
          formValues.subCategories,
          featuredCheck,
          formValues.shippingFee,
          formValues.description // shortDescription parameter
        );

        if (result && result.success) {
          toast({
            title: "Success",
            description: result.message || "Product updated successfully",
          });
          router.push(`/admin/dashboard/product/view/${productId}`);
        } else {
          toast({
            title: "Error",
            description: result?.message || "Failed to update product",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    await updateProductHandler();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getParentsandCategories();
        if (res?.success) {
          setParents(res?.parents || []);
          setCategories(res?.categories || []);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const getSubs = async () => {
      try {
        if (formValues.category.length > 0) {
          const res = await getSubCategoriesByCategoryParent(
            typeof formValues.category === 'string' 
              ? formValues.category 
              : formValues.category[0]
          );
          if (res?.success) {
            setSubs(res?.results);
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch subcategories",
          variant: "destructive"
        });
      }
    };

    if (formValues.category !== "") {
      getSubs();
    }
  }, [formValues.category]);

  // Add preview functionality that works on both desktop and mobile
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | null>(null);
  
  // Preview content state
  const [previewContent, setPreviewContent] = useState<string>('');
  
  // Function to open preview
  const openPreview = (mode: 'desktop' | 'mobile') => {
    setPreviewMode(mode);
    setPreviewContent(formValues.longDescription || '');
  };
  
  // Function to close preview
  const closePreview = () => {
    setPreviewMode(null);
  };

  // Description state for RichTextEditor
  const [description, setDescription] = useState('');

  // Handle preview for RichTextEditor
  const handlePreview = (mode: 'mobile' | 'desktop') => {
    setPreviewMode(mode);
    setPreviewContent(description);
  };

  // Handle long description from rich text editor
  const handleDescriptionChange = (content: string) => {
    setFormValues((prev: any) => ({
      ...prev,
      longDescription: content
    }));
    setDescription(content);
  };

  // Handle deleting existing images
  const handleDeleteExistingImage = (indexToDelete: number) => {
    const updatedImages = existingImages.filter((_, index) => index !== indexToDelete);
    setExistingImages(updatedImages);
    
    // Clear validation error if at least one image remains
    if (updatedImages.length > 0 || formValues.imageFiles.length > 0) {
      if (formErrors.imageFiles) {
        setFormErrors((prev: any) => ({
          ...prev,
          imageFiles: undefined
        }));
      }
    }
  };

  // Handle deleting new image previews
  const handleDeleteNewImage = (indexToDelete: number) => {
    const updatedPreviews = images.filter((_, index) => index !== indexToDelete);
    const updatedFiles = formValues.imageFiles.filter((_: any, index: number) => index !== indexToDelete);
    
    setImages(updatedPreviews);
    setFormValues((prev: any) => ({
      ...prev,
      imageFiles: updatedFiles
    }));
    
    // Clean up object URLs to prevent memory leaks
    if (images[indexToDelete]) {
      URL.revokeObjectURL(images[indexToDelete]);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Edit Product</h1>
        <div className="flex items-center justify-center h-64">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-24 w-96" />
            <Skeleton className="h-8 w-80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Edit Product</h1>
      
      <div className="mb-8">
        <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            <TabsTrigger value="media">Media & Details</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Update the essential details of your product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Product Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter product name (min 10 characters)"
                      value={formValues.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Short Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Enter short product description (min 10 characters)"
                      value={formValues.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className={`min-h-[100px] ${formErrors.description ? "border-red-500" : ""}`}
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-xs">{formErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">
                        SKU <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="sku"
                        placeholder="Enter product SKU (must be unique)"
                        value={formValues.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        className={formErrors.sku ? "border-red-500" : ""}
                      />
                      {formErrors.sku && (
                        <p className="text-red-500 text-xs">{formErrors.sku}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        placeholder="Enter brand name"
                        value={formValues.brand}
                        onChange={(e) => handleInputChange("brand", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={formValues.discount}
                      onChange={(e) => handleInputChange("discount", Number(e.target.value))}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("categories")}
                    className="flex items-center gap-2"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>
                    Update the categories this product belongs to.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="category"
                      value={formValues.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className={`w-full rounded-md border ${
                        formErrors.category ? "border-red-500" : "border-input"
                      } bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <p className="text-red-500 text-xs">{formErrors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategories">Sub Categories</Label>
                    <div className="flex flex-wrap gap-2 border border-input rounded-md p-2">
                      {subs.length > 0 ? (
                        subs.map((sub: any) => (
                          <label key={sub._id} className="inline-flex items-center gap-2 bg-muted/50 px-2 py-1 rounded text-sm">
                            <input
                              type="checkbox"
                              checked={formValues.subCategories.includes(sub._id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                if (checked) {
                                  handleInputChange("subCategories", [...formValues.subCategories, sub._id]);
                                } else {
                                  handleInputChange(
                                    "subCategories",
                                    formValues.subCategories.filter((id: string) => id !== sub._id)
                                  );
                                }
                              }}
                              className="rounded-sm"
                            />
                            {sub.name}
                          </label>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          {formValues.category ? "No subcategories found" : "Select a category first"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("basic")}
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("variants")}
                    className="flex items-center gap-2"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Variants Tab */}
            <TabsContent value="variants">
              <Card>
                <CardHeader>
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>
                    Update different sizes, quantities, and pricing options. Sizes are optional - leave empty for products like accessories or electronics that don't have size variations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Sizes & Pricing <span className="text-muted-foreground">(Optional)</span></Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addSize}
                        className="h-9 px-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Size
                      </Button>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <div className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0">ℹ️</div>
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Sizes are now optional!</p>
                          <p>You can create products without any sizes for items like:</p>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            <li>Electronics and gadgets</li>
                            <li>Books and media</li>
                            <li>Accessories (bags, jewelry)</li>
                            <li>Home decor items</li>
                          </ul>
                          <p className="mt-2">Only add sizes if your product comes in different size variations (S, M, L, etc.)</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mt-2">
                      {/* Headers for columns */}
                      <div className="grid grid-cols-[1fr,1fr,1fr,auto] gap-3 mb-1 px-3">
                        <div className="text-sm font-medium text-muted-foreground">Size</div>
                        <div className="text-sm font-medium text-muted-foreground">Quantity</div>
                        <div className="text-sm font-medium text-muted-foreground">Price (₹)</div>
                        <div></div>
                      </div>
                      
                      {/* Size rows */}
                      {formValues.sizes.map((size: any, index: number) => (
                        <div 
                          key={index} 
                          className="grid grid-cols-[1fr,1fr,1fr,auto] gap-3 items-end p-4 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div>
                            <Label htmlFor={`size-${index}`} className="text-xs mb-1 block">Size</Label>
                            <Input
                              id={`size-${index}`}
                              placeholder="S, M, L, XL, One Size"
                              value={size.size}
                              onChange={(e) => updateSize(index, "size", e.target.value)}
                              className="mt-1 focus:border-primary"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`qty-${index}`} className="text-xs mb-1 block">Quantity</Label>
                            <Input
                              id={`qty-${index}`}
                              type="number"
                              min="0"
                              placeholder="Available quantity"
                              value={size.qty}
                              onChange={(e) => updateSize(index, "qty", e.target.value)}
                              className="mt-1 focus:border-primary"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`price-${index}`} className="text-xs mb-1 block">Price (₹)</Label>
                            <Input
                              id={`price-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Product price"
                              value={size.price}
                              onChange={(e) => updateSize(index, "price", e.target.value)}
                              className="mt-1 focus:border-primary"
                            />
                          </div>
                          <div className="flex items-center justify-center h-10">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeSize(index)}
                              title="Remove this size"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {formValues.sizes.length === 0 && (
                        <div className="p-8 border border-dashed rounded-lg text-center">
                          <p className="text-muted-foreground">No sizes added yet. Click "Add Size" to add product sizes.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("categories")}
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("attributes")}
                    className="flex items-center gap-2"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes">
              <Card>
                <CardHeader>
                  <CardTitle>Product Attributes</CardTitle>
                  <CardDescription>
                    Update additional information about your product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Benefits Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Benefits</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addBenefit}
                        className="h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Benefit
                      </Button>
                    </div>

                    <div className="space-y-3 mt-2">
                      {formValues.benefits.map((benefit: any, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex-1">
                            <Input
                              placeholder="Enter product benefit"
                              value={benefit.name}
                              onChange={(e) => updateBenefit(index, e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => removeBenefit(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ingredients Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Ingredients</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addIngredient}
                        className="h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Ingredient
                      </Button>
                    </div>

                    <div className="space-y-3 mt-2">
                      {formValues.ingredients.map((ingredient: any, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex-1">
                            <Input
                              placeholder="Enter product ingredient"
                              value={ingredient.name}
                              onChange={(e) => updateIngredient(index, e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => removeIngredient(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Details Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Additional Details</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addDetail}
                        className="h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Detail
                      </Button>
                    </div>

                    <div className="space-y-3 mt-2">
                      {formValues.details.map((detail: any, index: number) => (
                        <div 
                          key={index} 
                          className="grid grid-cols-[1fr,1fr,auto] gap-3 items-center p-3 border rounded-lg bg-muted/30"
                        >
                          <Input
                            placeholder="Detail name"
                            value={detail.name}
                            onChange={(e) => updateDetail(index, "name", e.target.value)}
                          />
                          <Input
                            placeholder="Detail value"
                            value={detail.value}
                            onChange={(e) => updateDetail(index, "value", e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeDetail(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ/Questions Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>FAQ/Questions</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addQuestion}
                        className="h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Question
                      </Button>
                    </div>

                    <div className="space-y-4 mt-2">
                      {formValues.questions.map((q: any, index: number) => (
                        <div 
                          key={index} 
                          className="space-y-3 p-3 border rounded-lg bg-muted/30"
                        >
                          <div>
                            <Label htmlFor={`question-${index}`} className="text-xs">Question</Label>
                            <Input
                              id={`question-${index}`}
                              placeholder="Enter question"
                              value={q.question}
                              onChange={(e) => updateQuestion(index, "question", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`answer-${index}`} className="text-xs">Answer</Label>
                            <Textarea
                              id={`answer-${index}`}
                              placeholder="Enter answer"
                              value={q.answer}
                              onChange={(e) => updateQuestion(index, "answer", e.target.value)}
                              className="min-h-[80px] mt-1"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                              className="flex items-center"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Remove Question
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("variants")}
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("media")}
                    className="flex items-center gap-2"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Media & Details Tab */}
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle>Media & Detailed Description</CardTitle>
                  <CardDescription>
                    Update the product images and detailed description.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Existing Images</Label>
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      {existingImages.map((img: any, index: number) => (
                        <div key={index} className="relative border rounded-lg overflow-hidden aspect-square">
                          <Image
                            src={img.url}
                            alt={`Product image ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                            className="transition-all hover:scale-105"
                          />
                          <button
                            onClick={() => handleDeleteExistingImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Delete this image"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="images">Add New Images</Label>
                    <div className="mt-2">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="imageUpload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG or WebP (max 5MB each)
                            </p>
                          </div>
                          <input
                            id="imageUpload"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      
                      {formErrors.imageFiles && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.imageFiles}</p>
                      )}

                      {/* Preview of newly uploaded images */}
                      {images.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">New Images Preview:</h4>
                          <div className="grid grid-cols-4 gap-4">
                            {images.map((preview, index) => (
                              <div key={index} className="relative border rounded-lg overflow-hidden aspect-square">
                                <Image
                                  src={preview}
                                  alt={`New upload preview ${index + 1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  style={{ objectFit: 'cover' }}
                                  className="transition-all hover:scale-105"
                                />
                                <button
                                  onClick={() => handleDeleteNewImage(index)}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  title="Delete this image"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Note: Image upload functionality is not included in this edit page since it would need 
                     the full image upload implementation which is complex. You may add it if needed. */}

                  <div className="space-y-2">
                    <Label htmlFor="longDescription">Detailed Description</Label>
                    <div className="border rounded-md overflow-hidden">
                      <RichTextEditor
                        key={productId} // Force re-render when product changes
                        config={{
                          ...joditConfig,
                          uploader: {
                            insertImageAsBase64URI: true,
                          },
                        }}
                        value={formValues.longDescription || ""}
                        onChange={handleDescriptionChange}
                        className="min-h-[400px]"
                      />
                    </div>
                    {/* Desktop & Mobile Preview Buttons */}
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePreview('desktop')}
                        className="text-xs"
                      >
                        Desktop Preview
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePreview('mobile')}
                        className="text-xs"
                      >
                        Mobile Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("attributes")}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading && <span className="animate-spin">◌</span>}
                    {loading ? "Updating..." : "Update Product"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Tabs>
      </div>
      
      {/* Preview Content Modal */}
      {previewMode && previewContent && (
        <PreviewContent 
          content={previewContent} 
          mode={previewMode} 
          onClose={closePreview} 
        />
      )}
    </div>
  );
};

export default EditProductPage;