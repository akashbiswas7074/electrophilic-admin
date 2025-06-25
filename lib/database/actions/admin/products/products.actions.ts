"use server";
import { connectToDatabase } from "@/lib/database/connect";
import Category from "@/lib/database/models/category.model";
import Product from "@/lib/database/models/product.model";
import slugify from "slugify";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import { User } from "lucide-react";
import { getCurrentUserContext, getProductsForCurrentUser } from "@/lib/role-utils";
const { ObjectId } = mongoose.Types;

// config our Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, // Corrected typo here
  api_secret: process.env.CLOUDINARY_SECRET,
});

// creation of a product for admin
export const createProduct = async (
  sku: string,
  images: [],
  sizes: Array<{ size: string; qty: string; price: string }>,
  discount: number,
  name: string,
  description: string,
  longDescription: string,
  brand: string,
  details: Array<{ name: string; value: string }>,
  questions: Array<{ question: string; answer: string }>,
  category: string,
  subCategories: string[],
  benefits: Array<{ name: string }>,
  ingredients: Array<{ name: string }>,
  parent: string,
  featured: boolean,
  price?: number, // Optional direct price for products without sizes
  qty?: number,   // Optional direct quantity for products without sizes
  stock?: number  // Optional direct stock for products without sizes
) => {
  try {
    await connectToDatabase();

    // Get current user context to set vendorId
    const userContext = await getCurrentUserContext();
    if (!userContext.isAuthenticated) {
      return {
        message: "You must be logged in to create products",
        success: false,
      };
    }

    if (parent) {
      const Parent: any = await Product.findById(parent);
      if (!Parent) {
        return {
          message: "Parent not found!",
          success: false,
        };
      } else {
        // Create subProduct object with optional sizes
        const subProductData: any = {
          sku,
          images,
          discount,
        };

        // Add sizes if provided, otherwise add direct price/quantity
        if (sizes && sizes.length > 0) {
          subProductData.sizes = sizes;
        } else {
          // For products without sizes, store price and quantity directly
          if (price !== undefined) subProductData.price = price;
          if (qty !== undefined) subProductData.qty = qty;
          if (stock !== undefined) subProductData.stock = stock;
        }

        await Parent.updateOne(
          {
            $push: {
              subProducts: subProductData,
            },
          },
          { new: true }
        );
        return {
          message: "Sub-product added successfully.",
          success: true,
        };
      }
    } else {
      const slug = slugify(name);
      
      // Create subProduct object with optional sizes
      const subProductData: any = {
        sku,
        images,
        discount,
      };

      // Add sizes if provided, otherwise add direct price/quantity
      if (sizes && sizes.length > 0) {
        subProductData.sizes = sizes;
      } else {
        // For products without sizes, store price and quantity directly
        if (price !== undefined) subProductData.price = price;
        if (qty !== undefined) subProductData.qty = qty;
        if (stock !== undefined) subProductData.stock = stock;
      }

      const newProduct = new Product({
        name,
        description,
        longDescription,
        brand,
        details,
        questions,
        slug,
        category,
        benefits,
        ingredients,
        subCategories,
        subProducts: [subProductData],
        featured,
        // Add vendorId based on user role
        vendorId: userContext.userId,
        vendor: userContext.name,
        // Store the role explicitly
        createdBy: userContext.role, // 'admin' or 'vendor'
        // Also store direct price/quantity at product level if no sizes
        ...((!sizes || sizes.length === 0) && {
          price: price,
          qty: qty,
          stock: stock
        })
      });
      await newProduct.save();
      return {
        message: "Product created successfully.",
        success: true,
      };
    }
  } catch (error: any) {
    console.log(error);
    return {
      message: error,
      success: false,
    };
  }
};

// delete single product for admin
export const deleteProduct = async (productId: string) => {
  try {
    await connectToDatabase();

    // Check user authorization
    const userContext = await getCurrentUserContext();
    
    // Check if product belongs to current vendor (if not admin)
    if (userContext.role === 'vendor') {
      const product = await Product.findById(productId);
      if (!product || product.vendorId?.toString() !== userContext.userId) {
        return {
          message: "You are not authorized to delete this product",
          success: false,
        };
      }
    }

    // 1. Find the product first to get image public_ids
    const product = await Product.findById(productId);
    if (!product) {
      return {
        message: "Product not found with this Id!",
        success: false,
      };
    }

    // 2. Collect all image public_ids from all subProducts
    const imagePublicIds: string[] = [];
    product.subProducts.forEach((sub: any) => {
      if (sub.images && Array.isArray(sub.images)) {
        sub.images.forEach((image: any) => {
          if (image.public_id) {
            imagePublicIds.push(image.public_id);
          }
        });
      }
    });

    // 3. Delete images from Cloudinary
    if (imagePublicIds.length > 0) {
      try {
        // Use Promise.all to delete images concurrently
        const deletePromises = imagePublicIds.map((publicId) =>
          cloudinary.v2.uploader.destroy(publicId)
        );
        const results = await Promise.all(deletePromises);
        console.log("Cloudinary deletion results:", results);
        
        // Optional: Check results for errors, though destroy often returns { result: 'ok' } or { result: 'not found' }
      } catch (cloudinaryError) {
        console.error("Error deleting images from Cloudinary:", cloudinaryError);
        // Decide if you want to stop the process or just log the error
        // For now, we'll log and continue to delete the DB record
      }
    }

    // 4. Delete the product from the database
    await Product.findByIdAndDelete(productId);

    return {
      message: "Product and associated images successfully deleted!",
      success: true,
    };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return {
      message: error.message || "An error occurred during product deletion.",
      success: false,
    };
  }
};

// update single product for admin
export const updateProduct = async (
  productId: string,
  sku: string,
  images: [],
  sizes: Array<{ size: string; qty: string; price: string }>,
  discount: number,
  name: string,
  description: string,
  longDescription: string,
  brand: string,
  details: Array<{ name: string; value: string }>,
  questions: Array<{ question: string; answer: string }>,
  category: string,
  subCategories: string[],
  benefits: Array<{ name: string }>,
  ingredients: Array<{ name: string }>,
  featured?: boolean,
  shippingFee?: number,
  price?: number, // Optional direct price for products without sizes
  qty?: number,   // Optional direct quantity for products without sizes
  stock?: number  // Optional direct stock for products without sizes
) => {
  try {
    await connectToDatabase();
    
    // Check user authorization
    const userContext = await getCurrentUserContext();
    
    // Check if product belongs to current vendor (if not admin)
    if (userContext.role === 'vendor') {
      const productCheck = await Product.findById(productId);
      if (!productCheck || productCheck.vendorId?.toString() !== userContext.userId) {
        return {
          message: "You are not authorized to update this product",
          success: false,
        };
      }
    }
    
    const product: any = await Product.findById(productId);
    if (!product) {
      return {
        message: "Product not found with this Id!",
        success: false,
      };
    }

    // Update basic product information
    product.name = name;
    product.description = description;
    product.brand = brand;
    product.details = details;
    product.questions = questions;
    product.benefits = benefits;
    product.ingredients = ingredients;
    product.longDescription = longDescription;
    
    // Update product subProduct information
    product.subProducts[0].sku = sku;
    product.subProducts[0].discount = discount;
    
    // Handle sizes vs direct price/quantity
    if (sizes && sizes.length > 0) {
      product.subProducts[0].sizes = sizes;
      // Clear direct price/quantity fields when sizes are provided
      product.subProducts[0].price = undefined;
      product.subProducts[0].qty = undefined;
      product.subProducts[0].stock = undefined;
      product.price = undefined;
      product.qty = undefined;
      product.stock = undefined;
    } else {
      // For products without sizes, store direct price/quantity
      product.subProducts[0].sizes = [];
      if (price !== undefined) {
        product.subProducts[0].price = price;
        product.price = price;
      }
      if (qty !== undefined) {
        product.subProducts[0].qty = qty;
        product.qty = qty;
      }
      if (stock !== undefined) {
        product.subProducts[0].stock = stock;
        product.stock = stock;
      }
    }
    
    // Update images if provided
    if (images && images.length > 0) {
      product.subProducts[0].images = images;
    }
    
    // Update category and subcategories if provided
    if (category) {
      product.category = category;
    }
    
    if (subCategories && subCategories.length > 0) {
      product.subCategories = subCategories;
    }
    
    // Update featured status if provided
    if (featured !== undefined) {
      product.featured = featured;
    }
    
    // Update shipping fee if provided
    if (shippingFee !== undefined) {
      product.shippingFee = shippingFee;
    }

    await product.save();
    return {
      message: "Product updated successfully.",
      success: true,
    };
  } catch (error: any) {
    console.log(error);
    return {
      message: error,
      success: false,
    };
  }
};

// get single product by ID for admin
export const getSingleProductById = async (
  id: string,
  style?: number,
  size?: any
) => {
  try {
    await connectToDatabase();
    if (!style) {
      style = 0;
    }
    if (!size) {
      size = 0;
    }
    const product: any = await Product.findById(id).lean();
    
    // Check user authorization for vendors
    if (product) {
      const userContext = await getCurrentUserContext();
      if (userContext.role === 'vendor' && product.vendorId?.toString() !== userContext.userId) {
        return {
          message: "You are not authorized to view this product",
          success: false,
        };
      }
    }
    
    const discount = product.subProducts[style].discount;
    const priceBefore = product.subProducts[style].sizes[size].price;
    const price = discount ? priceBefore - priceBefore / discount : priceBefore;
    return JSON.parse(
      JSON.stringify({
        success: true,
        _id: product._id.toString(),
        style: Number(style),
        name: product.name,
        discount,
        sizes: product.subProducts[style],
        description: product.description,
        longDescription: product.longDescription,
        slug: product.slug,
        sku: product.subProducts[style].sku,
        brand: product.brand,
        category: product.category,
        subCategories: product.subCategories,
        details: product.details,
        questions: product.questions,
        shipping: product.shipping,
        images: product.subProducts[style].images,
        size: product.subProducts[style].sizes[size].size,
        price,
        priceBefore,
        quantity: product.subProducts[style].sizes[size].qty,
        vendor: product.vendor,
        vendorId: product.vendorId
      })
    );
  } catch (error: any) {
    console.log(error);
  }
};

// get all products for admin
export const getAllProducts = async () => {
  try {
    await connectToDatabase();

    // Fetch all products
    const products = await Product.find()
      .sort({ updateAt: -1 })
      .populate({ path: "category", model: Category })
      .lean();
    
    // Filter products based on user role
    const userContext = await getCurrentUserContext();
    let filteredProducts = products;
    
    if (userContext.role === 'vendor' && userContext.userId) {
      // Filter products for vendor
      filteredProducts = products.filter(product => 
        product.vendorId && product.vendorId.toString() === userContext.userId
      );
    }
    
    return JSON.parse(JSON.stringify(filteredProducts));
  } catch (error: any) {
    console.log(error);
    return [];
  }
};

// get product by id
export const getEntireProductById = async (id: string) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(id)
      .populate({ path: "category", model: Category, select: "name" })
      .populate({ path: "subCategories", model: Category, select: "name" }); // Assuming subCategories also reference the Category model

    if (!product) {
      return {
        message: "Product not found with this Id",
        product: null, // Ensure product is null
        success: false,
      };
    }
    
    // Check user authorization for vendors
    const userContext = await getCurrentUserContext();
    if (userContext.role === 'vendor' && product.vendorId?.toString() !== userContext.userId) {
      return {
        message: "You are not authorized to view this product",
        product: null,
        success: false,
      };
    }
    
    return {
      product: JSON.parse(JSON.stringify(product)),
      message: "Successfully found product",
      success: true,
    };
  } catch (error: any) {
    console.error("Error in getEntireProductById:", error); // Log the error for debugging
    return {
      message: error.message || "An error occurred while fetching the product.",
      product: null,
      success: false,
    };
  }
};

// get parents and categories
export const getParentsandCategories = async () => {
  try {
    await connectToDatabase();
    const results = await Product.find().select("name subProducts").lean();
    const categories = await Category.find().lean();
    
    // Filter parent products based on user role
    const userContext = await getCurrentUserContext();
    let filteredResults = results;
    
    if (userContext.role === 'vendor' && userContext.userId) {
      filteredResults = results.filter(product => 
        product.vendorId && product.vendorId.toString() === userContext.userId
      );
    }
    
    return {
      success: true,
      parents: JSON.parse(JSON.stringify(filteredResults)),
      categories: JSON.parse(JSON.stringify(categories)),
    };
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      message: "Failed to fetch parents and categories",
    };
  }
};

// switch featured product:
export const switchFeaturedProduct = async (
  productId: string,
  value: boolean
) => {
  try {
    await connectToDatabase();
    
    // Check user authorization
    const userContext = await getCurrentUserContext();
    
    // Only admins can set featured products
    if (userContext.role !== 'admin') {
      return {
        message: "Only administrators can set featured products",
        success: false,
      };
    }
    
    const product = await Product.findByIdAndUpdate(productId, {
      featured: value,
    });
    if (!product) {
      return {
        message: "Can't find Product with this ID.",
        success: false,
      };
    }
    return {
      message: "Successfully updated product",
      success: true,
    };
  } catch (error: any) {
    console.log(error);
    return {
      message: "Error setting featured status",
      success: false,
    };
  }
};

// get latest created product reviews:
export const getLatestProductReviews = async () => {
  try {
    await connectToDatabase();
    // .populate({ path: "reviews.reviewBy", model: User })
    const reviews = await Product.aggregate([
      { $unwind: "$reviews" },
      {
        $lookup: {
          from: "users", // The name of the User collection
          localField: "reviews.reviewBy",
          foreignField: "_id",
          as: "reviewByDetails",
        },
      },
      {
        $project: {
          productId: "$_id",
          productName: "$name",
          productImage: { $arrayElemAt: ["$subProducts.images", 0] }, // Extract the first image
          productDescription: "$description",
          review: {
            rating: "$reviews.rating",
            review: "$reviews.review",
            reviewCreatedAt: "$reviews.reviewCreatedAt",
            verified: "$reviews.verified",
            _id: "$reviews._id",
            reviewBy: { $arrayElemAt: ["$reviewByDetails", 0] }, // Extract the first element
          },
        },
      },
      { $sort: { "review.reviewCreatedAt": -1 } },
    ]);
    
    // Filter reviews based on user role
    const userContext = await getCurrentUserContext();
    let filteredReviews = reviews;
    
    if (userContext.role === 'vendor' && userContext.userId) {
      // Get all product IDs belonging to this vendor
      const vendorProducts = await Product.find({ vendorId: userContext.userId }).select('_id').lean();
      const vendorProductIds = vendorProducts.map(p => p._id.toString());
      
      // Filter reviews to only include those for vendor's products
      filteredReviews = reviews.filter(review => 
        vendorProductIds.includes(review.productId.toString())
      );
    }
    
    return {
      reviews: JSON.parse(JSON.stringify(filteredReviews)),
    };
  } catch (error) {
    console.log(error);
    return {
      reviews: [],
    };
  }
};

// switch product review to verified
export const handleVerificationChange = async (id: string, value: boolean) => {
  try {
    await connectToDatabase();
    const product = await Product.findOneAndUpdate(
      { "reviews._id": id },
      { $set: { "reviews.$.verified": value } },
      { new: true }
    );

    if (!product) {
      return { message: "Review not found", success: false };
    }
    
    // Check user authorization for vendors
    const userContext = await getCurrentUserContext();
    if (userContext.role === 'vendor' && product.vendorId?.toString() !== userContext.userId) {
      return {
        message: "You are not authorized to verify reviews for this product",
        success: false,
      };
    }
    
    return { message: "Successfully updated review", success: true };
  } catch (error) {
    console.log(error);
    return { 
      message: "Error updating review verification status", 
      success: false 
    };
  }
};

// delete a product review
export const deleteProductReview = async (reviewId: string) => {
  try {
    await connectToDatabase();
    
    // First, find the product containing this review to check authorization
    const product = await Product.findOne({ "reviews._id": reviewId });
    
    if (!product) {
      return { 
        success: false, 
        message: "Review not found" 
      };
    }
    
    // Check user authorization for vendors
    const userContext = await getCurrentUserContext();
    if (userContext.role === 'vendor' && product.vendorId?.toString() !== userContext.userId) {
      return {
        success: false,
        message: "You are not authorized to delete reviews for this product"
      };
    }
    
    // Get the review to be deleted for calculating new average rating
    const reviewToDelete = product.reviews.find(
      (review: any) => review._id.toString() === reviewId
    );
    
    if (!reviewToDelete) {
      return { 
        success: false, 
        message: "Review not found" 
      };
    }
    
    // Remove the review from the product
    const result = await Product.updateOne(
      { _id: product._id },
      { $pull: { reviews: { _id: reviewId } } }
    );
    
    if (result.modifiedCount === 0) {
      return { 
        success: false, 
        message: "Failed to delete review" 
      };
    }
    
    // Update the product's rating and numReviews
    const updatedProduct = await Product.findById(product._id);
    
    if (updatedProduct) {
      updatedProduct.numReviews = updatedProduct.reviews.length;
      
      // Recalculate the average rating if there are still reviews
      if (updatedProduct.reviews.length > 0) {
        updatedProduct.rating = 
          updatedProduct.reviews.reduce((total: number, r: any) => total + r.rating, 0) / 
          updatedProduct.reviews.length;
      } else {
        // If no reviews left, reset rating to 0
        updatedProduct.rating = 0;
      }
      
      await updatedProduct.save();
    }
    
    return { 
      success: true, 
      message: "Review deleted successfully" 
    };
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return { 
      success: false, 
      message: error.message || "Failed to delete review" 
    };
  }
};

// update product images from all products page
export const updateProductImages = async (
  productId: string,
  newImages: Array<{ url: string; public_id: string }>
) => {
  try {
    await connectToDatabase();

    const product = await Product.findById(productId);
    
    if (!product) {
      return {
        message: "Product not found",
        success: false,
      };
    }
    
    // Check user authorization for vendors
    const userContext = await getCurrentUserContext();
    if (userContext.role === 'vendor' && product.vendorId?.toString() !== userContext.userId) {
      return {
        message: "You are not authorized to update images for this product",
        success: false,
      };
    }

    // Assuming we're adding images to the first subProduct
    // You might need to modify this if your product structure is different
    if (product.subProducts && product.subProducts.length > 0) {
      // Add new images to the existing ones
      product.subProducts[0].images = [
        ...product.subProducts[0].images,
        ...newImages
      ];
      
      await product.save();
      
      return {
        success: true,
        message: "Product images updated successfully",
      };
    } else {
      return {
        message: "Product structure is invalid",
        success: false,
      };
    }
  } catch (error: any) {
    console.error("Error updating product images:", error);
    return {
      message: error.message || "An error occurred while updating product images",
      success: false,
    };
  }
};
