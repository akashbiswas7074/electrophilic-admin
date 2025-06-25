"use server";

import { connectToDatabase } from "../connect";
import WebsiteSection from "../models/website.section.model";

/**
 * Initialize default website sections if they don't exist
 * This ensures all main homepage sections are available for ordering in the admin panel
 */
export async function initializeDefaultSections() {
  try {
    await connectToDatabase();
    
    // Define the default sections that should be available
    const defaultSections = [
      {
        name: "Banner Carousel",
        sectionId: "banner-carousel",
        isVisible: true,
        order: 10,
        description: "Main hero banner carousel at the top of the homepage"
      },
      {
        name: "Strength Takes Sweat",
        sectionId: "strength-takes-sweat",
        isVisible: true,
        order: 20,
        description: "Strength Takes Sweat section highlighting brand message"
      },
      {
        name: "Featured Showcase",
        sectionId: "featured-showcase",
        isVisible: true,
        order: 30,
        description: "Showcase for featured products"
      },
      {
        name: "Special Combos",
        sectionId: "special-combos",
        isVisible: true,
        order: 40,
        description: "Special product combinations and offers"
      },
      {
        name: "Category Showcase",
        sectionId: "category-showcase",
        isVisible: true,
        order: 50,
        description: "Showcase for product categories"
      },
      {
        name: "Sub-Category Showcase",
        sectionId: "sub-category-showcase",
        isVisible: true,
        order: 60,
        description: "Showcase for product sub-categories"
      },
      {
        name: "Category Product Sections",
        sectionId: "category-product-sections",
        isVisible: true,
        order: 70,
        description: "Product sections organized by category"
      },
      {
        name: "Best Sellers",
        sectionId: "bestsellers",
        isVisible: true,
        order: 80,
        description: "Carousel featuring best-selling products"
      },
      {
        name: "Crazy Deals",
        sectionId: "crazy-deals",
        isVisible: true,
        order: 90,
        description: "Special deals and promotions"
      },
      {
        name: "Tough Shoe Hero",
        sectionId: "tough-shoe-hero",
        isVisible: true,
        order: 100,
        description: "Tough Shoe Hero section"
      },
      {
        name: "New Arrivals",
        sectionId: "new-arrivals",
        isVisible: true,
        order: 110,
        description: "Carousel featuring newly arrived products"
      },
      {
        name: "Top Reviews",
        sectionId: "top-reviews",
        isVisible: true,
        order: 115,
        description: "Showcases top customer reviews and testimonials"
      },
      {
        name: "Featured Videos",
        sectionId: "featured-videos",
        isVisible: true,
        order: 120,
        description: "Section showcasing featured videos"
      },
      {
        name: "All Products",
        sectionId: "all-products",
        isVisible: true,
        order: 130,
        description: "Section displaying all products"
      },
      {
        name: "Collection Highlights",
        sectionId: "collection-highlights",
        isVisible: true,
        order: 140,
        description: "Featured collections highlight section"
      }
    ];
    
    // For each default section, check if it exists and create if it doesn't
    for (const section of defaultSections) {
      const exists = await WebsiteSection.findOne({ 
        sectionId: section.sectionId 
      });
      
      if (!exists) {
        await WebsiteSection.create(section);
        console.log(`Created default section: ${section.name}`);
      }
    }
    
    return {
      success: true,
      message: "Default website sections initialized successfully",
    };
  } catch (error) {
    console.error("Error initializing default website sections:", error);
    return {
      success: false,
      message: "Failed to initialize default website sections",
    };
  }
}