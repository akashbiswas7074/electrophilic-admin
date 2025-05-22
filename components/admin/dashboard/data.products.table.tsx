"use client";
import {
  deleteProduct,
  getSingleProductById,
  switchFeaturedProduct,
  updateProductImages
} from "@/lib/database/actions/admin/products/products.actions";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { FaEdit, FaSearchPlus } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { Drawer, Switch, Text, Modal, SimpleGrid, Image, Button, Group, FileButton } from "@mantine/core"; // Added FileButton
import { useState } from "react";
import UpdateProductComponent from "./update.product";
import { modals } from "@mantine/modals";
import { toast } from "@/hooks/use-toast";

const ProductsDataTable = ({ products }: { products: any }) => {
  const [opened, setOpened] = useState(false);
  const [imageModalOpened, setImageModalOpened] = useState(false);
  const [currentProductImages, setCurrentProductImages] = useState<string[]>([]);
  const [currentProductId, setCurrentProductId] = useState<string>(""); // Added to track current product ID
  const [isUploading, setIsUploading] = useState(false); // Upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]); // Files to upload
  const router = useRouter();
  const [data, setData] = useState({});

  // Handle image file selection
  const handleFileChange = (files: File[]) => {
    setImageFiles(files);
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!currentProductId || imageFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "website");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        return await uploadResponse.json();
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Format uploaded images for the database
      const newImages = uploadResults.map(result => ({
        url: result.secure_url,
        public_id: result.public_id,
      }));

      // Update product with new images
      const result = await updateProductImages(currentProductId, newImages);
      
      if (result?.success) {
        toast({
          title: "Success",
          description: "Product images updated successfully",
        });
        
        // Refresh the page to show updated images
        router.refresh();
        
        // Close the modal
        setImageModalOpened(false);
        setImageFiles([]);
      } else {
        throw new Error(result?.message || "Failed to update product images");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId).then((res) => {
        if (res?.success) {
          alert(res?.message);
          router.refresh();
        }
      });
    } catch (error: any) {
      alert(error);
    }
  };
  const getProductDetails = async (id: string) => {
    try {
      await getSingleProductById(id)
        .then((res) => {
          if (res?.success) {
            setData(res);
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 50 },
    {
      field: "image",
      headerName: "Image", // Changed header name
      width: 120, // Increased width slightly
      renderCell: (params) => (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%', cursor: 'pointer' }}
          onClick={() => {
            if (params.row.allImageUrls && params.row.allImageUrls.length > 0) {
              setCurrentProductImages(params.row.allImageUrls);
              setCurrentProductId(params.row.product_id); // Set current product ID
              setImageModalOpened(true);
            }
          }}
        >
          {params.row.firstImageUrl && params.row.firstImageUrl !== '/placeholder.png' ? (
            <img
              src={params.row.firstImageUrl}
              alt="product"
              style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: "40px", height: "40px", borderRadius: "4px", backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#888' }}>No Img</div>
          )}
          {params.row.totalImageCount > 1 && (
            <Text size="xs" c="dimmed">+{params.row.totalImageCount - 1}</Text>
          )}
        </div>
      ),
    },
    { field: "product_id", headerName: "Product ID", width: 200 },
    { field: "productname", headerName: "Product Name", width: 150 },
    { field: "category", headerName: "Category", width: 130 },
    { field: "price", headerName: "Price", width: 100 },
    { field: "sizes", headerName: "Sizes", width: 50 },
    { field: "vendor", headerName: "Vendor", width: 100 },
    {
      field: "featured",
      headerName: "Featured",
      width: 100,
      renderCell: (params) => {
        console.log(params);
        return (
          <div className="mt-[10px]">
            <Switch
              value={params.value}
              checked={params.value}
              onChange={async (e) => {
                await switchFeaturedProduct(
                  params.row.product_id,
                  e.currentTarget.checked
                ).then((res) => {
                  if (res?.success) {
                    alert(res.message);
                    router.refresh();
                  }
                });
              }}
              color="teal"
              size="sm"
            />
          </div>
        );
      },
    },
    {
      field: "view",
      headerName: "View",
      width: 50,
      renderCell: (params) => (
        <div className="mt-[10px]">
          <FaSearchPlus 
            size={20} 
            className="cursor-pointer"
            onClick={() => router.push(`/admin/dashboard/product/view/${params.row.product_id}`)}
          />
        </div>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 50,
      renderCell: (params) => (
        <div className="mt-[10px] ">
          <FaEdit
            size={20}
            onClick={() => {
              // Option 1: Use the drawer for inline editing
              // setOpened(true);
              // getProductDetails(params.row.product_id);
              
              // Option 2: Navigate to the dedicated edit page
              router.push(`/admin/dashboard/product/edit/${params.row.product_id}`);
            }}
            className="cursor-pointer"
          />
        </div>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 50,
      renderCell: (params) => (
        <div
          className="mt-[10px] cursor-pointer"
          onClick={() => {
            modals.openConfirmModal({
              title: "Delete product",
              centered: true,
              children: (
                <Text size="sm">
                  Are you sure you want to delete product? This action is
                  irreversible.
                </Text>
              ),
              labels: {
                confirm: "Delete product",
                cancel: "No don't delete it",
              },
              confirmProps: { color: "red" },
              onCancel: () => console.log("Cancel"),
              onConfirm: () => handleDeleteProduct(params.row.product_id),
            });
          }}
        >
          <RiDeleteBin6Fill size={20} />
        </div>
      ),
    },
  ];
  const createRows = (products: any[]) => {
    return products.map((product: any, index: any) => {
      // Calculate total images, get the first image URL, and collect all image URLs
      let totalImageCount = 0;
      let firstImageUrl: string | null = null;
      const allImageUrls: string[] = []; // Array to hold all image URLs

      if (product.subProducts && product.subProducts.length > 0) {
        product.subProducts.forEach((sub: any) => {
          if (sub.images && Array.isArray(sub.images)) {
            totalImageCount += sub.images.length;
            sub.images.forEach((img: any) => {
              if (img?.url) {
                allImageUrls.push(img.url); // Add URL to the list
                if (!firstImageUrl) {
                  firstImageUrl = img.url; // Set the first image URL found
                }
              }
            });
          }
        });
      }
      // Fallback if no images found at all
      if (!firstImageUrl) {
         firstImageUrl = '/placeholder.png'; // Use placeholder if no images
      }


      const subProduct = product.subProducts[0] || {};
      const sizes = subProduct.sizes || [];

      const sizePrices = sizes
        .map((size: any) => `₹${size.price}`) // Simplified price display for brevity
        .join(", ");
      const sizeLabels = sizes.map((size: any) => size.size).join(", ");

      return {
        id: index + 1,
        productname: product.name,
        product_id: product._id,
        firstImageUrl: firstImageUrl, // Pass first image URL
        totalImageCount: totalImageCount, // Pass total image count
        allImageUrls: allImageUrls, // Pass all image URLs
        category: product.category?.name || "N/A", // Safer access to category name
        price: sizePrices,
        sizes: sizeLabels,
        vendor: product?.vendor?.name || "-",
        featured: product?.featured || false, // Ensure boolean value
        view: "-",
        edit: "-",
        delete: "-",
      };
    });
  };
  const rows = createRows(products);
  return (
    <div className="h-[400px] w-full">
       {/* Image Viewer Modal with upload capability */}
       <Modal
        opened={imageModalOpened}
        onClose={() => setImageModalOpened(false)}
        title="Product Images"
        size="xl"
      >
        <div className="mb-4">
          <Text size="sm" color="dimmed" className="mb-3">
            Current product images. Click on the button below to add more images.
          </Text>
          <SimpleGrid cols={4} spacing="md">
            {currentProductImages.map((url, index) => (
              <Image key={index} src={url} alt={`Product image ${index + 1}`} radius="md" />
            ))}
          </SimpleGrid>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <Text size="sm" weight={500} className="mb-2">
            Upload New Images
          </Text>
          <Group position="left" spacing="md">
            <FileButton
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={isUploading}
            >
              {(props) => <Button {...props}>Select Images</Button>}
            </FileButton>
            
            {imageFiles.length > 0 && (
              <Text size="sm">
                {imageFiles.length} file(s) selected
              </Text>
            )}
          </Group>
          
          {imageFiles.length > 0 && (
            <div className="mt-4">
              <Button 
                onClick={handleImageUpload} 
                loading={isUploading}
                color="blue"
              >
                Upload and Save
              </Button>
              
              <SimpleGrid cols={6} spacing="xs" className="mt-3">
                {Array.from(imageFiles).map((file, index) => (
                  <div key={index} className="relative border rounded p-1">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${index}`} 
                      className="w-full h-16 object-cover rounded"
                    />
                    <Text size="xs" truncate>{file.name}</Text>
                  </div>
                ))}
              </SimpleGrid>
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Product Drawer */}
      <Drawer
        opened={opened}
        position="right"
        onClose={() => {
          setOpened(false);
        }}
        title="Update Product"
        size={"lg"}
      >
        <UpdateProductComponent data={data} setOpen={setOpened} />
      </Drawer>

      {/* Data Grid */}
      <DataGrid
        rows={rows}
        columns={columns}
        rowHeight={52}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 20 },
          },
        }}
        pageSizeOptions={[5, 10]}
      />
    </div>
  );
};

export default ProductsDataTable;
