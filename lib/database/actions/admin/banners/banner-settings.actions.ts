"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Banner from "@/lib/database/models/banner.model";

interface UpdateBannerSettingsParams {
  linkUrl?: string;
  altText?: string;
  platform?: "desktop" | "mobile";
  priority?: number;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Updates banner settings including scheduling (start/end dates), 
 * priority, and active status
 */
export async function updateBannerSettings(
  publicId: string,
  params: UpdateBannerSettingsParams
) {
  try {
    await connectToDatabase();
    
    console.log(`[updateBannerSettings] Updating banner ${publicId} with params:`, {
      linkUrl: params.linkUrl,
      altText: params.altText,
      platform: params.platform,
      priority: params.priority,
      isActive: params.isActive,
      startDate: params.startDate ? (params.startDate instanceof Date ? params.startDate.toISOString() : params.startDate) : null,
      endDate: params.endDate ? (params.endDate instanceof Date ? params.endDate.toISOString() : params.endDate) : null
    });
    
    // Extract the update fields
    const updateFields: any = {};
    
    if (params.linkUrl !== undefined) updateFields.linkUrl = params.linkUrl;
    if (params.altText !== undefined) updateFields.altText = params.altText;
    if (params.platform !== undefined) updateFields.platform = params.platform;
    if (params.priority !== undefined) updateFields.priority = Number(params.priority);
    if (params.isActive !== undefined) updateFields.isActive = Boolean(params.isActive);
    
    // Handle date fields carefully
    if (params.startDate !== undefined) {
      if (params.startDate === null) {
        updateFields.startDate = null;
      } else {
        try {
          // Make sure we have a valid Date object
          const startDate = params.startDate instanceof Date ? params.startDate : new Date(params.startDate);
          if (!isNaN(startDate.getTime())) {
            updateFields.startDate = startDate;
            console.log(`[updateBannerSettings] Valid startDate: ${startDate.toISOString()}`);
          } else {
            console.warn(`[updateBannerSettings] Invalid startDate received:`, params.startDate);
            updateFields.startDate = null;
          }
        } catch (err) {
          console.warn(`[updateBannerSettings] Error parsing startDate:`, err);
          updateFields.startDate = null;
        }
      }
    }
    
    if (params.endDate !== undefined) {
      if (params.endDate === null) {
        updateFields.endDate = null;
      } else {
        try {
          // Make sure we have a valid Date object
          const endDate = params.endDate instanceof Date ? params.endDate : new Date(params.endDate);
          if (!isNaN(endDate.getTime())) {
            updateFields.endDate = endDate;
            console.log(`[updateBannerSettings] Valid endDate: ${endDate.toISOString()}`);
          } else {
            console.warn(`[updateBannerSettings] Invalid endDate received:`, params.endDate);
            updateFields.endDate = null;
          }
        } catch (err) {
          console.warn(`[updateBannerSettings] Error parsing endDate:`, err);
          updateFields.endDate = null;
        }
      }
    }
    
    console.log(`[updateBannerSettings] Final update fields:`, updateFields);
    
    // Update the banner
    const result = await Banner.updateOne(
      { public_id: publicId },
      { $set: updateFields }
    );
    
    // Fetch the updated banner to verify changes
    const updatedBanner = await Banner.findOne({ public_id: publicId }).lean();

    // Ensure updatedBanner is not an array
    const verifiedBanner = (updatedBanner && !Array.isArray(updatedBanner)) ? updatedBanner : undefined;

    console.log(`[updateBannerSettings] Banner ${publicId} updated. Result:`, {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      updatedFields: updateFields,
      verifiedBanner: {
        platform: verifiedBanner?.platform,
        priority: verifiedBanner?.priority,
        isActive: verifiedBanner?.isActive,
        startDate: verifiedBanner?.startDate,
        endDate: verifiedBanner?.endDate
      }
    });
    
    if (result.modifiedCount === 0) {
      return {
        success: false,
        message: "Banner not found or no changes were made"
      };
    }
    
    return {
      success: true,
      message: "Banner settings updated successfully"
    };
  } catch (error: any) {
    console.error("[updateBannerSettings] Error:", error);
    return {
      success: false,
      message: `Error updating banner settings: ${error.message}`
    };
  }
}

/**
 * Toggles the active status of a banner
 */
export async function toggleBannerActiveStatus(publicId: string) {
  try {
    await connectToDatabase();
    
    // First get current status
    const banner = await Banner.findOne({ public_id: publicId }).lean();
    
    if (!banner || Array.isArray(banner)) { // Check if banner is null or an array
      return {
        success: false,
        message: "Banner not found or invalid banner data"
      };
    }
    
    // Toggle the isActive field
    const newStatus = !banner.isActive;
    
    const result = await Banner.updateOne(
      { public_id: publicId },
      { $set: { isActive: newStatus } }
    );
    
    console.log(`[toggleBannerActiveStatus] Banner ${publicId} status toggled to ${newStatus}. Result:`, {
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
    
    return {
      success: result.modifiedCount > 0,
      message: `Banner is now ${newStatus ? "active" : "inactive"}`
    };
  } catch (error: any) {
    console.error("[toggleBannerActiveStatus] Error:", error);
    return {
      success: false,
      message: `Error toggling banner status: ${error.message}`
    };
  }
}

/**
 * Updates the priority of a banner
 */
export async function updateBannerPriority(publicId: string, priority: number) {
  try {
    await connectToDatabase();
    
    const validatedPriority = Number(priority);
    if (isNaN(validatedPriority)) {
      return {
        success: false,
        message: "Invalid priority value"
      };
    }
    
    const result = await Banner.updateOne(
      { public_id: publicId },
      { $set: { priority: validatedPriority } }
    );
    
    console.log(`[updateBannerPriority] Banner ${publicId} priority set to ${validatedPriority}. Result:`, {
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
    
    return {
      success: result.modifiedCount > 0,
      message: `Banner priority updated to ${validatedPriority}`
    };
  } catch (error: any) {
    console.error("[updateBannerPriority] Error:", error);
    return {
      success: false,
      message: `Error updating banner priority: ${error.message}`
    };
  }
}

/**
 * Updates the scheduling (start date and end date) of a banner
 */
export async function updateBannerScheduling(
  publicId: string, 
  startDate: Date | null, 
  endDate: Date | null
) {
  try {
    await connectToDatabase();
    
    const updateFields: any = {};
    
    // Only set fields that are provided
    if (startDate !== undefined) updateFields.startDate = startDate;
    if (endDate !== undefined) updateFields.endDate = endDate;
    
    const result = await Banner.updateOne(
      { public_id: publicId },
      { $set: updateFields }
    );
    
    console.log(`[updateBannerScheduling] Banner ${publicId} scheduling updated. Result:`, {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      startDate,
      endDate
    });
    
    return {
      success: result.modifiedCount > 0,
      message: "Banner scheduling updated successfully"
    };
  } catch (error: any) {
    console.error("[updateBannerScheduling] Error:", error);
    return {
      success: false,
      message: `Error updating banner scheduling: ${error.message}`
    };
  }
}