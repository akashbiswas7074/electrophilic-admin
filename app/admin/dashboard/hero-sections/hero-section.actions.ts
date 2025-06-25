"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database/connect";
import HeroSection from "@/lib/database/models/hero-section.model";

/**
 * Get all hero sections
 */
export async function getAllHeroSections() {
  try {
    console.log("Fetching hero sections from database...");
    await connectToDatabase();
    
    const sections = await HeroSection.find().sort({ order: 1 });
    console.log("Hero sections found:", sections.length);
    
    // Properly serialize MongoDB documents to plain JavaScript objects
    const serializedSections = JSON.parse(JSON.stringify(sections));
    
    return {
      success: true,
      sections: serializedSections,
    };
  } catch (error: any) {
    console.error("Error fetching hero sections:", error);
    
    return {
      success: false,
      message: error.message || "Failed to fetch hero sections",
    };
  }
}

/**
 * Toggle a hero section's active status
 */
export async function toggleHeroSectionActive(id: string) {
  try {
    await connectToDatabase();
    
    // Find the hero section
    const section = await HeroSection.findById(id);
    
    if (!section) {
      return {
        success: false,
        message: "Hero section not found",
      };
    }
    
    // Toggle the isActive status
    section.isActive = !section.isActive;
    await section.save();
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: `Hero section ${section.isActive ? "activated" : "deactivated"} successfully`,
      section: JSON.parse(JSON.stringify(section)),
    };
  } catch (error: any) {
    console.error("Error toggling hero section status:", error);
    
    return {
      success: false,
      message: error.message || "Failed to toggle hero section status",
    };
  }
}

/**
 * Delete a hero section
 */
export async function deleteHeroSection(id: string) {
  try {
    await connectToDatabase();
    
    // Find and delete the hero section
    const deletedSection = await HeroSection.findByIdAndDelete(id);
    
    if (!deletedSection) {
      return {
        success: false,
        message: "Hero section not found",
      };
    }
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: "Hero section deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting hero section:", error);
    
    return {
      success: false,
      message: error.message || "Failed to delete hero section",
    };
  }
}

/**
 * Update the order of hero sections
 */
export async function updateHeroSectionOrder(orderedIds: string[]) {
  try {
    await connectToDatabase();
    
    // Update the order for each section
    const updatePromises = orderedIds.map((id, index) => {
      return HeroSection.findByIdAndUpdate(id, { order: index + 1 });
    });
    
    await Promise.all(updatePromises);
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: "Hero section order updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating hero section order:", error);
    
    return {
      success: false,
      message: error.message || "Failed to update hero section order",
    };
  }
}

/**
 * Create a new hero section
 */
export async function createHeroSection(formData: any) {
  try {
    await connectToDatabase();
    
    console.log("Creating hero section with data:", JSON.stringify(formData, null, 2));
    
    // Validate required fields
    if (!formData.title?.trim()) {
      return {
        success: false,
        message: "Title is required",
      };
    }
    
    // Create the hero section
    const heroSection = await HeroSection.create({
      title: formData.title.trim(),
      subtitle: formData.subtitle?.trim() || "",
      longDescription: formData.longDescription?.trim() || "",
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      order: formData.order || 10,
      pattern: formData.pattern || 'standard',
      layoutId: formData.layoutId?.trim() || "",
      contentAlignment: formData.contentAlignment || 'center',
      backgroundImage: formData.backgroundImage?.trim() || "",
      mediaUrl: formData.mediaUrl?.trim() || "",
      mediaType: formData.mediaType || 'image',
      titleColor: formData.titleColor?.trim() || "",
      descriptionColor: formData.descriptionColor?.trim() || "",
      buttonTextColor: formData.buttonTextColor?.trim() || "",
      buttonBackgroundColor: formData.buttonBackgroundColor?.trim() || "",
      buttons: Array.isArray(formData.buttons) ? formData.buttons : [],
    });
    
    console.log("Hero section created successfully with ID:", heroSection._id);
    console.log("Created document:", JSON.stringify(heroSection.toObject(), null, 2));
    
    // Double check that pattern and other fields were saved
    const savedSection = await HeroSection.findById(heroSection._id);
    console.log("Saved section from DB:", JSON.stringify(savedSection?.toObject(), null, 2));
    if (!savedSection?.pattern) {
      console.warn("WARNING: Pattern field was not saved properly!");
    }

    // Sync hero sections to website sections after creation
    try {
      const syncResult = await fetch(`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/api/sync-hero-sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!syncResult.ok) {
        console.warn("Failed to sync hero sections to website sections after creation");
      }
    } catch (syncError) {
      console.warn("Error syncing hero sections after creation:", syncError);
    }
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: "Hero section created successfully",
      section: JSON.parse(JSON.stringify(heroSection)),
    };
  } catch (error: any) {
    console.error("Error creating hero section:", error);
    
    if (error.errors) {
      const validationErrors = Object.keys(error.errors).map(field => {
        return `${field}: ${error.errors[field].message}`;
      }).join(", ");
      
      return {
        success: false,
        message: `Validation failed: ${validationErrors}`,
      };
    }
    
    return {
      success: false,
      message: error.message || "Failed to create hero section",
    };
  }
}

/**
 * Update an existing hero section
 */
export async function updateHeroSection(id: string, formData: any) {
  try {
    console.log("Connecting to database for update...");
    await connectToDatabase();
    
    // Ensure essential fields are present and correctly formatted
    const heroSectionData = {
      title: formData.title,
      subtitle: formData.subtitle,
      isActive: Boolean(formData.isActive),
      order: Number(formData.order),
      // Layout & design fields - explicitly include all pattern-related fields
      pattern: formData.pattern || 'standard',
      layoutId: formData.layoutId || '',
      contentAlignment: formData.contentAlignment || 'center',
      backgroundImage: formData.backgroundImage || '',
      mediaUrl: formData.mediaUrl || '',
      mediaType: formData.mediaType || 'image',
      // Buttons
      buttons: Array.isArray(formData.buttons) ? formData.buttons : []
    };
    
    console.log(`Updating hero section ${id} with processed data:`, JSON.stringify(heroSectionData, null, 2));
    
    // Find and update the hero section using direct field assignment for maximum compatibility
    const section = await HeroSection.findById(id);
    
    if (!section) {
      console.log("Hero section not found with ID:", id);
      return {
        success: false,
        message: "Hero section not found",
      };
    }
    
    // Explicitly assign each field to ensure nothing is missed
    section.title = heroSectionData.title;
    section.subtitle = heroSectionData.subtitle;
    section.isActive = heroSectionData.isActive;
    section.order = heroSectionData.order;
    section.pattern = heroSectionData.pattern;
    section.layoutId = heroSectionData.layoutId;
    section.contentAlignment = heroSectionData.contentAlignment;
    section.backgroundImage = heroSectionData.backgroundImage;
    section.mediaUrl = heroSectionData.mediaUrl;
    section.mediaType = heroSectionData.mediaType;
    section.buttons = heroSectionData.buttons;
    
    // Save the updated section
    await section.save();
    
    // Double check that pattern and other fields were saved
    const savedSection = await HeroSection.findById(id);
    console.log("Updated section from DB:", JSON.stringify(savedSection?.toObject(), null, 2));
    if (!savedSection?.pattern) {
      console.warn("WARNING: Pattern field was not saved properly during update!");
    }
    
    console.log("Hero section updated successfully:", JSON.stringify(section.toObject(), null, 2));
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: "Hero section updated successfully",
      section: JSON.parse(JSON.stringify(section)),
    };
  } catch (error: any) {
    console.error("Error updating hero section:", error);
    
    return {
      success: false,
      message: error.message || "Failed to update hero section",
    };
  }
}