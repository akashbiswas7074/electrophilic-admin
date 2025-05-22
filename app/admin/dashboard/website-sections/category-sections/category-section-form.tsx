import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the schema for the form
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  categoryId: z.string().min(1, "Category is required"),
  displayOrder: z.coerce.number().int().min(0, "Display order must be a positive number"),
  productLimit: z.coerce.number().int().min(1, "Product limit must be at least 1").max(20, "Product limit cannot exceed 20"),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface CategorySectionFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export default function CategorySectionForm({ initialData, onSuccess }: CategorySectionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Initialize the form with default values or existing data
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      categoryId: "",
      displayOrder: 0,
      productLimit: 8,
      isActive: true,
    },
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/admin/categories");
        if (response.data.success) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchCategories();
  }, [toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = initialData
        ? `/api/admin/website-sections/category-sections/${initialData._id}`
        : "/api/admin/website-sections/category-sections";
      
      const method = initialData ? "patch" : "post";
      
      const response = await axios({
        method,
        url,
        data,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: initialData
            ? "Category section updated successfully"
            : "Category section created successfully",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Featured Categories" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem 
                      key={category._id} 
                      value={category._id}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Limit</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 8" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 1" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </FormControl>
              <FormLabel className="font-normal">
                Active (section will be visible on website)
              </FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Category Section" : "Create Category Section"}
        </Button>
      </form>
    </Form>
  );
}