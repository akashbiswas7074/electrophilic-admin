"use server";

import { connectToDatabase } from "../connect";
import WebsiteSection, { IWebsiteSection } from "../models/website.section.model";

/**
 * Get all website sections
 */
export async function getAllWebsiteSections() {
  try {
    await connectToDatabase();
    
    const sections = await WebsiteSection.find()
      .sort({ order: 1 })
      .populate('categoryId', 'name');
    
    return {
      success: true,
      sections: JSON.parse(JSON.stringify(sections)),
    };
  } catch (error) {
    console.error("Error getting website sections:", error);
    return {
      success: false,
      message: "Failed to get website sections",
    };
  }
}

/**
 * Create a new website section
 */
export async function createWebsiteSection(sectionData: IWebsiteSection) {
  try {
    await connectToDatabase();
    
    // Check if section with that ID already exists
    const existingSection = await WebsiteSection.findOne({ 
      sectionId: sectionData.sectionId 
    });
    
    if (existingSection) {
      return {
        success: false,
        message: "A section with this ID already exists",
      };
    }
    
    // Create the new section
    const section = await WebsiteSection.create(sectionData);
    
    return {
      success: true,
      section: JSON.parse(JSON.stringify(section)),
      message: "Section created successfully",
    };
  } catch (error) {
    console.error("Error creating website section:", error);
    return {
      success: false,
      message: "Failed to create website section",
    };
  }
}

/**
 * Update a website section
 */
export async function updateWebsiteSection(id: string, sectionData: Partial<IWebsiteSection>) {
  try {
    await connectToDatabase();
    
    const section = await WebsiteSection.findByIdAndUpdate(
      id,
      { $set: sectionData },
      { new: true }
    ).populate('categoryId', 'name');
    
    if (!section) {
      return {
        success: false,
        message: "Section not found",
      };
    }
    
    return {
      success: true,
      section: JSON.parse(JSON.stringify(section)),
      message: "Section updated successfully",
    };
  } catch (error) {
    console.error("Error updating website section:", error);
    return {
      success: false,
      message: "Failed to update website section",
    };
  }
}

/**
 * Delete a website section
 */
export async function deleteWebsiteSection(id: string) {
  try {
    await connectToDatabase();
    
    const section = await WebsiteSection.findByIdAndDelete(id);
    
    if (!section) {
      return {
        success: false,
        message: "Section not found",
      };
    }
    
    return {
      success: true,
      message: "Section deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting website section:", error);
    return {
      success: false,
      message: "Failed to delete website section",
    };
  }
}

/**
 * Update section order
 */
export async function updateSectionOrder(orderedIds: string[]) {
  try {
    await connectToDatabase();
    
    // Update each section with its new order
    const updatePromises = orderedIds.map((id, index) => 
      WebsiteSection.findByIdAndUpdate(id, { order: index })
    );
    
    await Promise.all(updatePromises);
    
    return {
      success: true,
      message: "Section order updated successfully",
    };
  } catch (error) {
    console.error("Error updating section order:", error);
    return {
      success: false,
      message: "Failed to update section order",
    };
  }
}

/**
 * Toggle section visibility
 */
export async function toggleSectionVisibility(id: string) {
  try {
    await connectToDatabase();
    
    // Find the current section
    const section = await WebsiteSection.findById(id);
    
    if (!section) {
      return {
        success: false,
        message: "Section not found",
      };
    }
    
    // Toggle visibility
    section.isVisible = !section.isVisible;
    await section.save();
    
    return {
      success: true,
      section: JSON.parse(JSON.stringify(section)),
      message: `Section ${section.isVisible ? 'shown' : 'hidden'} successfully`,
    };
  } catch (error) {
    console.error("Error toggling section visibility:", error);
    return {
      success: false,
      message: "Failed to toggle section visibility",
    };
  }
}