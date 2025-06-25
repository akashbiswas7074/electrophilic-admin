"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

import {
  createProduct,
  getParentsandCategories,
  getSingleProductById,
} from "@/lib/database/actions/admin/products/products.actions";
import { getSubCategoriesByCategoryParent } from "@/lib/database/actions/admin/subCategories/subcategories.actions";

// Import RichTextEditor component
import { RichTextEditor } from "@/components/ui/rich-text-editor";

// Define types
interface FormValues {
  name: string;
  description: string;
  brand: string;
  sku: string;
  discount: number;
  imageFiles: File[];
  longDescription: string;
  parent: string;
  category: string;
  subCategories: string[];
  sizes: Array<{ size: string; qty: string; price: string }>;
  benefits: Array<{ name: string }>;
  ingredients: Array<{ name: string }>;
  questions: Array<{ question: string; answer: string }>;
  shippingFee: string;
  details: Array<{ name: string; value: string }>;
}

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
            ✕
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

const CreateProductPage = () => {
  const [images, setImages] = useState<string[]>([]);
  const [parents, setParents] = useState<{ _id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [subs, setSubs] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [featuredCheck, setFeaturedCheck] = useState<boolean>(false);
  const editor = useRef(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [formValues, setFormValues] = useState<FormValues>({
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
    benefits: [{ name: "" }],  // Changed from object to array
    ingredients: [{ name: "" }],  // This should also be an array
    questions: [{ question: "", answer: "" }],  // This should also be an array
    shippingFee: "",
    details: [{ name: "", value: "" }],
  });

  const [formErrors, setFormErrors] = useState<any>({});

  const validateForm = () => {
    const errors: any = {};
    if (!formValues.name || formValues.name.length < 10) {
      errors.name = "Product name must be at least 10 characters";
    }
    if (!formValues.description || formValues.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    if (formValues.imageFiles.length === 0) {
      errors.imageFiles = "You must upload at least one image";
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
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const previewUrls = files.map((file) => URL.createObjectURL(file));
      setImages(previewUrls);
      handleInputChange("imageFiles", files);
    }
  }, []);

  // Dynamic field handlers
  const addSize = () => {
    setFormValues(prev => ({
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
    const updatedSizes = formValues.sizes.filter((_, i) => i !== index);
    handleInputChange("sizes", updatedSizes);
  };

  // Similar handlers for benefits, ingredients, details
  const addBenefit = () => {
    setFormValues(prev => ({
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
    const updatedBenefits = formValues.benefits.filter((_, i) => i !== index);
    handleInputChange("benefits", updatedBenefits);
  };

  const addIngredient = () => {
    setFormValues(prev => ({
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
    const updatedIngredients = formValues.ingredients.filter((_, i) => i !== index);
    handleInputChange("ingredients", updatedIngredients);
  };

  const addDetail = () => {
    setFormValues(prev => ({
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
    const updatedDetails = formValues.details.filter((_, i) => i !== index);
    handleInputChange("details", updatedDetails);
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

    const createProductHandler = async () => {
      const array = [];
      let uploaded_images: any = "";
      setLoading(true);

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
          alert(`Error uploading image ${i + 1}: ${error.message || String(error)}`);
          return;
        }
      }

      // Prepare the uploaded images for submission
      uploaded_images = array.map((i) => ({
        url: i.secure_url,
        public_id: i.public_id,
      }));

      try {
        await createProduct(
          formValues.sku,
          uploaded_images,
          formValues.sizes,
          formValues.discount,
          formValues.name,
          formValues.description,
          formValues.longDescription,
          formValues.brand,
          formValues.details,
          formValues.questions,
          formValues.category,
          formValues.subCategories,
          formValues.benefits,
          formValues.ingredients,
          formValues.parent,
          featuredCheck
        ).then((res) => {
          if (res.success) {
            setLoading(false);
            // Reset form values
            setFormValues({
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
            setImages([]);
            alert(res.message || "Product created Successfully");
          } else {
            setLoading(false);
            alert(res.message || "An error occurred while creating the product.");
          }
        });
      } catch (error: any) {
        console.error("Error while creating the product:", error);
        setLoading(false);
        alert(error.message || String(error));
      }
    };
    
    await createProductHandler();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await getParentsandCategories()
          .then((res) => {
            if (res?.success) {
              setParents(res?.parents || []);
              setCategories(res?.categories || []);
            }
          })
          .catch((err) => alert(err));
      } catch (error) {
        alert(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const getSubs = async () => {
      try {
        if (formValues.category.length > 0) {
          await getSubCategoriesByCategoryParent(
            typeof formValues.category === 'string' 
              ? formValues.category 
              : formValues.category[0]
          )
            .then((res) => {
              if (res?.success) {
                setSubs(res?.results);
              }
            })
            .catch((err) => alert(err));
        }
      } catch (error) {
        alert(error);
      }
    };

    if (formValues.category !== "") {
      getSubs();
    }
  }, [formValues.category]);

  useEffect(() => {
    const fetchParentData = async () => {
      if (formValues.parent) {
        try {
          const data = await getSingleProductById(formValues.parent, 0, 0);
          setFormValues({
            ...formValues,
            name: data.name,
            description: data.description,
            brand: data.brand,
            category: data.category,
            subCategories: data.subCategories,
            questions: data.questions || [],
            details: data.details || [],
            benefits: Array.isArray(data.benefits) ? data.benefits : [{ name: "" }],
            ingredients: Array.isArray(data.ingredients) ? data.ingredients : [{ name: "" }],
          });
        } catch (error) {
          console.error("Error fetching parent data:", error);
        }
      }
    };

    fetchParentData();
  }, [formValues.parent]);

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
    setFormValues(prev => ({
      ...prev,
      longDescription: content
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Create New Product</h1>
      
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
                    Enter the essential details of your product.
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
                    Next →
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
                    Select the categories this product belongs to.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {parents.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="parent">Parent Product</Label>
                      <select
                        id="parent"
                        value={formValues.parent}
                        onChange={(e) => handleInputChange("parent", e.target.value)}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select a parent product</option>
                        {parents.map((parent) => (
                          <option key={parent._id} value={parent._id}>
                            {parent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                                    formValues.subCategories.filter(id => id !== sub._id)
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
                    Next →
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
                    Add different sizes, quantities, and pricing options. Sizes are optional - leave empty for products like accessories or electronics that don't have size variations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Sizes & Pricing <span className="text-muted-foreground">(Optional)</span></Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addSize}
                        className="h-8"
                      >
                        + Add Size
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

                    <div className="space-y-3 mt-2">
                      {formValues.sizes.map((size, index) => (
                        <div 
                          key={index} 
                          className="grid grid-cols-[1fr,1fr,1fr,auto] gap-3 items-end p-3 border rounded-lg bg-muted/30"
                        >
                          <div>
                            <Label htmlFor={`size-${index}`} className="text-xs">Size</Label>
                            <Input
                              id={`size-${index}`}
                              placeholder="S, M, L, XL, One Size"
                              value={size.size}
                              onChange={(e) => updateSize(index, "size", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`qty-${index}`} className="text-xs">Quantity</Label>
                            <Input
                              id={`qty-${index}`}
                              type="number"
                              min="0"
                              placeholder="Available quantity"
                              value={size.qty}
                              onChange={(e) => updateSize(index, "qty", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`price-${index}`} className="text-xs">Price (₹)</Label>
                            <Input
                              id={`price-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Product price"
                              value={size.price}
                              onChange={(e) => updateSize(index, "price", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSize(index)}
                            className="h-9 w-9 mt-1"
                          >
                            🗑️
                          </Button>
                        </div>
                      ))}
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
                    Next →
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
                    Add benefits, ingredients, and other details about your product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Benefits Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Benefits</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addBenefit}
                        className="h-8"
                      >
                        + Add Benefit
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(formValues.benefits || []).map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="Product benefit"
                            value={benefit.name}
                            onChange={(e) => updateBenefit(index, e.target.value)}
                            className="flex-1"
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBenefit(index)}
                              className="h-9 w-9"
                            >
                              🗑️
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ingredients Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Ingredients</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addIngredient}
                        className="h-8"
                      >
                        + Add Ingredient
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formValues.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="Ingredient name"
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(index, e.target.value)}
                            className="flex-1"
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeIngredient(index)}
                              className="h-9 w-9"
                            >
                              🗑️
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Details Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Additional Details</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addDetail}
                        className="h-8"
                      >
                        + Add Detail
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formValues.details.map((detail, index) => (
                        <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-3 items-end p-3 border rounded-lg bg-muted/30">
                          <div>
                            <Label htmlFor={`detail-name-${index}`} className="text-xs">Name</Label>
                            <Input
                              id={`detail-name-${index}`}
                              placeholder="e.g., Material, Weight"
                              value={detail.name}
                              onChange={(e) => updateDetail(index, "name", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`detail-value-${index}`} className="text-xs">Value</Label>
                            <Input
                              id={`detail-value-${index}`}
                              placeholder="Value"
                              value={detail.value}
                              onChange={(e) => updateDetail(index, "value", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDetail(index)}
                              className="h-9 w-9 mt-1"
                            >
                              🗑️
                            </Button>
                          )}
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
                    Next →
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
                    Upload product images and add detailed product information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Images */}
                  <div className="space-y-3">
                    <Label htmlFor="images">
                      Product Images <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 gap-4">
                      <div 
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center ${
                          formErrors.imageFiles ? "border-red-400" : "border-muted-foreground/25"
                        }`}
                      >
                        {images.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                            {images.map((image, index) => (
                              <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                                <img
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImages(images.filter((_, i) => i !== index));
                                    handleInputChange(
                                      "imageFiles",
                                      formValues.imageFiles.filter((_, i) => i !== index)
                                    );
                                  }}
                                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            
                            <label 
                              htmlFor="add-more-images"
                              className="border-2 border-dashed border-muted-foreground/25 rounded-md aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition"
                            >
                              <div className="text-2xl mb-2">📁</div>
                              <span className="text-sm text-muted-foreground">Add more</span>
                              <input
                                id="add-more-images"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label
                            htmlFor="image-upload"
                            className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                          >
                            <div className="text-4xl mb-4">📷</div>
                            <h3 className="text-lg font-medium mb-1">Drop your images here</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              or click to browse (max 10 images)
                            </p>
                            <div className="px-4 py-2 bg-muted rounded-md border hover:bg-muted/80 transition-colors">
                              Select Files
                            </div>
                            <input
                              id="image-upload"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      {formErrors.imageFiles && (
                        <p className="text-red-500 text-xs">{formErrors.imageFiles}</p>
                      )}
                    </div>
                  </div>

                  {/* Long Description - Rich Text Editor */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Long Description</Label>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPreview('desktop')}
                        >
                          Desktop Preview
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPreview('mobile')}
                        >
                          Mobile Preview
                        </Button>
                      </div>
                    </div>
                    <RichTextEditor
                      value={formValues.longDescription}
                      onChange={handleDescriptionChange}
                      height={400}
                      placeholder="Enter detailed product description, features, and usage instructions..."
                    />
                  </div>
                  
                  {/* Preview Modal */}
                  {previewMode && (
                    <PreviewContent 
                      content={previewContent} 
                      mode={previewMode} 
                      onClose={closePreview} 
                    />
                  )}

                  {/* Additional Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Additional Details</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addDetail}
                        className="h-8"
                      >
                        + Add Detail
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {formValues.details.map((detail, index) => (
                        <div 
                          key={index}
                          className="grid grid-cols-[1fr,2fr,auto] gap-3 items-end p-3 border rounded-lg bg-muted/30"
                        >
                          <div>
                            <Label htmlFor={`detail-name-${index}`} className="text-xs">Label</Label>
                            <Input
                              id={`detail-name-${index}`}
                              placeholder="Material, Size, etc."
                              value={detail.name}
                              onChange={(e) => updateDetail(index, "name", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`detail-value-${index}`} className="text-xs">Value</Label>
                            <Input
                              id={`detail-value-${index}`}
                              placeholder="Cotton, 10x12 inches, etc."
                              value={detail.value}
                              onChange={(e) => updateDetail(index, "value", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDetail(index)}
                              className="h-9 w-9 mt-1"
                            >
                              🗑️
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Featured Product Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={featuredCheck}
                      onCheckedChange={setFeaturedCheck}
                    />
                    <Label htmlFor="featured">Feature this product on homepage</Label>
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
                    {loading ? (
                      <>
                        <Skeleton className="h-4 w-4 rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <span className="material-icons-outlined h-4 w-4" />
                        Create Product
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>          </form>        </Tabs>      </div>      {/* Add preview components and modal functionality */}      {previewMode && (        <div className="preview-container" onClick={closePreview}>          <div             className={`preview-content ${previewMode === 'desktop' ? 'desktop-preview' : 'mobile-preview'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-close" onClick={closePreview}>
              <span className="material-icons-outlined h-4 w-4" />
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProductPage;
