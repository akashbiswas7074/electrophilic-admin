"use server";
import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "@/lib/database/connect"; // Import DB connection
import Banner, { IBanner } from "@/lib/database/models/banner.model"; // Import Banner model

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_SECRET as string,
});

// fetch all website banners for admin (Now fetches from DB)
export const fetchAllWebsiteBanners = async () => {
  try {
    await connectToDatabase();
    // Fetch all website banners with scheduling, priority, and status fields
    const banners = await Banner.find({ type: "website" })
      .select({
        _id: 1,
        url: 1,
        public_id: 1,
        type: 1,
        platform: 1,
        linkUrl: 1,
        altText: 1,
        startDate: 1, 
        endDate: 1, 
        isActive: 1, 
        priority: 1, 
        impressions: 1,
        clicks: 1,
        createdAt: 1,
        updatedAt: 1
      })
      .sort({ priority: 1, createdAt: -1 })
      .lean();
    
    // Apply proper transformations to ensure fields have default values if they're missing
    const transformedBanners = banners.map(b => ({
      ...b, // Spread all properties from the lean banner object
      public_id: b.public_id, // Explicitly include public_id to ensure it's in the type
      platform: b.platform,   // Explicitly include platform for the same reason
      // Ensure these fields have default values if undefined
      isActive: b.isActive !== undefined ? b.isActive : true,
      priority: b.priority !== undefined ? b.priority : 10,
      // Keep dates as they are, can be null/undefined
      startDate: b.startDate,
      endDate: b.endDate
    }));
    
    console.log("Fetched banners with fields:", 
      transformedBanners.map(b => ({
        id: b.public_id,
        platform: b.platform,
        isActive: b.isActive,
        priority: b.priority,
        startDate: b.startDate ? new Date(b.startDate).toISOString() : null,
        endDate: b.endDate ? new Date(b.endDate).toISOString() : null
      }))
    );
    
    // Return the transformed banners with proper default values
    return JSON.parse(JSON.stringify(transformedBanners));
  } catch (error: any) {
    console.log("Error fetching website banners from DB", error);
    return []; // Return empty array on error
  }
};

export const uploadWebsiteBannerImages = async (
  images: Array<{ data: string; type: string }>,
  platformInput: "desktop" | "mobile",
  linkUrl?: string,
  altText?: string,
  startDate?: string,
  endDate?: string,
  priority: number = 10,
  isActive: boolean = true
) => {
  console.log("[uploadWebsiteBannerImages] Received parameters:", { 
    platformInput, 
    linkUrl, 
    altText,
    startDate: startDate || 'undefined',
    endDate: endDate || 'undefined',
    priority,
    isActive
  });

  let validatedPlatform: "desktop" | "mobile" = "desktop"; // Default value
  if (platformInput === "desktop" || platformInput === "mobile") {
    validatedPlatform = platformInput;
  } else {
    console.error(`[uploadWebsiteBannerImages] Invalid platform value received: '${platformInput}'. Defaulting to 'desktop'.`);
  }

  // Validate priority with explicit Number conversion
  const validatedPriority = priority !== undefined ? Number(priority) : 10;
  
  // Validate isActive with explicit Boolean conversion
  const validatedIsActive = isActive !== undefined ? Boolean(isActive) : true;
  
  // Explicitly parse dates with validation
  let validatedStartDate = null;
  if (startDate && startDate.trim() !== '') {
    try {
      validatedStartDate = new Date(startDate);
      // Check if date is valid
      if (isNaN(validatedStartDate.getTime())) {
        console.warn(`[uploadWebsiteBannerImages] Invalid startDate: ${startDate}, using null`);
        validatedStartDate = null;
      } else {
        console.log(`[uploadWebsiteBannerImages] Successfully parsed startDate: ${validatedStartDate.toISOString()}`);
      }
    } catch (e) {
      console.warn(`[uploadWebsiteBannerImages] Error parsing startDate: ${e}, using null`);
      validatedStartDate = null;
    }
  }
  
  let validatedEndDate = null;
  if (endDate && endDate.trim() !== '') {
    try {
      validatedEndDate = new Date(endDate);
      // Check if date is valid
      if (isNaN(validatedEndDate.getTime())) {
        console.warn(`[uploadWebsiteBannerImages] Invalid endDate: ${endDate}, using null`);
        validatedEndDate = null;
      } else {
        console.log(`[uploadWebsiteBannerImages] Successfully parsed endDate: ${validatedEndDate.toISOString()}`);
      }
    } catch (e) {
      console.warn(`[uploadWebsiteBannerImages] Error parsing endDate: ${e}, using null`);
      validatedEndDate = null;
    }
  }

  console.log("[uploadWebsiteBannerImages] Validated scheduling parameters:", {
    startDate: validatedStartDate ? validatedStartDate.toISOString() : null,
    endDate: validatedEndDate ? validatedEndDate.toISOString() : null,
    priority: validatedPriority,
    isActive: validatedIsActive
  });

  const base64ToBuffer = (base64: any): Buffer => {
    const base64String = base64.split(";base64,").pop();
    if (!base64String) {
      throw new Error("Invalid base64 string");
    }
    return Buffer.from(base64String, "base64");
  };

  // Upload images to Cloudinary
  const uploadPromises = images.map(async (imageData: { data: string; type: string }, index: number) => {
    try {
      const buffer = base64ToBuffer(imageData.data);
      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: imageData.type }));
      formData.append("upload_preset", "website");
      formData.append("public_id", `website_banner_${validatedPlatform}_${Date.now()}_${index}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error(`Failed to upload image ${index}:`, result.error || `HTTP status ${response.status}`);
        return { status: "rejected", reason: result.error?.message || `HTTP status ${response.status}`, index };
      }

      return {
        status: "fulfilled",
        value: {
          url: result.secure_url,
          public_id: result.public_id,
        },
        index
      };
    } catch (error: any) {
      console.error(`Error uploading image ${index}:`, error);
      return { status: "rejected", reason: error.message || "Unknown upload error", index };
    }
  });

  const results = await Promise.allSettled(uploadPromises);

  const successfulUploads = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && !!(result.value && result.value.value))
    .map(result => result.value.value);

  const failedUploads = results
    .filter(result => result.status === 'rejected')
    .map(result => ({
      error: result.reason,
      index: (result as any).index
    }));

  // Save successful uploads to MongoDB with all the parameters
  if (successfulUploads.length > 0) {
    try {
      await connectToDatabase();
      
      // Prepare banner documents with explicit fields
      const bannerDocs = successfulUploads.map(upload => ({
        url: upload.url,
        public_id: upload.public_id,
        type: "website",
        platform: validatedPlatform,
        linkUrl: linkUrl || undefined,
        altText: altText || undefined,
        // Explicitly set these fields with non-undefined values
        startDate: validatedStartDate !== undefined ? validatedStartDate : null,
        endDate: validatedEndDate !== undefined ? validatedEndDate : null,
        priority: validatedPriority !== undefined ? Number(validatedPriority) : 10,
        isActive: validatedIsActive !== undefined ? Boolean(validatedIsActive) : true,
        impressions: 0,
        clicks: 0
      }));
      
      console.log("[uploadWebsiteBannerImages] Banner docs to be inserted:", 
        bannerDocs.map(doc => ({
          platform: doc.platform,
          startDate: doc.startDate ? (doc.startDate instanceof Date ? doc.startDate.toISOString() : doc.startDate) : null,
          endDate: doc.endDate ? (doc.endDate instanceof Date ? doc.endDate.toISOString() : doc.endDate) : null,
          priority: doc.priority,
          isActive: doc.isActive
        }))
      );
      
      // Force explicit document creation to ensure schema validation works
      const insertedBanners = [];
      for (const doc of bannerDocs) {
        const newBanner = new Banner(doc);
        const savedBanner = await newBanner.save();
        insertedBanners.push(savedBanner);
      }
      
      console.log(`Successfully saved ${insertedBanners.length} website banners to DB with scheduling info.`);
      
      // Verify the saved banners have all the required fields
      const savedBannerIds = insertedBanners.map(doc => doc._id);
      const savedBanners = await Banner.find({ 
        _id: { $in: savedBannerIds } 
      }).lean();
      
      console.log("Verification of saved banners:", 
        savedBanners.map(b => ({
          id: b.public_id,
          startDate: b.startDate ? new Date(b.startDate).toISOString() : null,
          endDate: b.endDate ? new Date(b.endDate).toISOString() : null,
          priority: b.priority,
          isActive: b.isActive
        }))
      );
      
      return {
        success: true,
        successfulUploads,
        failedUploads,
      };
    } catch (dbError: any) {
      console.error("Error saving website banners to MongoDB:", dbError);
      successfulUploads.forEach((upload, index) => {
        failedUploads.push({ error: `DB save failed: ${dbError.message}`, index });
      });
    }
  }

  return {
    success: failedUploads.length === 0 && results.some(r => r.status === 'fulfilled'),
    successfulUploads,
    failedUploads,
  };
}

// for website - Deletes from Cloudinary AND MongoDB
export const deleteAnyBannerId = async (publicId: string) => {
  console.log(`Attempting to delete banner with publicId: ${publicId}`);
  try {
    console.log(`Deleting ${publicId} from Cloudinary...`);
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary deletion result for ${publicId}: ${cloudinaryResult.result}`);

    if (cloudinaryResult.result !== "ok" && cloudinaryResult.result !== "not found") {
       console.error(`!!! Failed to delete ${publicId} from Cloudinary:`, cloudinaryResult.result);
    }

     console.log(`Deleting banner with public_id ${publicId} from MongoDB...`);
     await connectToDatabase();
     const dbResult = await Banner.deleteOne({ public_id: publicId });
     console.log(`MongoDB deletion result for ${publicId}:`, dbResult);

     if (dbResult.deletedCount === 0) {
         console.warn(`Banner with public_id ${publicId} not found in DB.`);
         if (cloudinaryResult.result === "ok") {
             return { success: true, message: "Deleted from Cloudinary, but not found in DB." };
         }
     }

     if ((cloudinaryResult.result === "ok" || cloudinaryResult.result === "not found")) {
         return {
             success: true,
             message: "Successfully deleted banner from Cloudinary and DB.",
         };
     } else {
         return {
             success: false,
             message: `Cloudinary deletion failed (${cloudinaryResult.result}). DB deletion ${dbResult.deletedCount > 0 ? 'succeeded' : 'failed or banner not found'}.`,
         };
     }

  } catch (error: any) {
    console.error(`!!! Error deleting banner ${publicId}:`, error);
     return {
      success: false,
      message: `An error occurred: ${error.message}`,
    };
  }
};

// API endpoint for admin dashboard to fetch banner metrics
export async function fetchBannerMetrics() {
  try {
    await connectToDatabase();
    
    // Get all banners with their metrics
    const banners = await Banner.find({ type: "website" }).lean();
    
    // Calculate total impressions and clicks
    const totalImpressions = banners.reduce((sum, banner) => sum + (banner.impressions || 0), 0);
    const totalClicks = banners.reduce((sum, banner) => sum + (banner.clicks || 0), 0);
    
    // Calculate average CTR (Click-Through Rate)
    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    // Calculate metrics grouped by platform
    const platformMetrics = {
      desktop: {
        banners: banners.filter(b => b.platform === 'desktop').length,
        impressions: banners.filter(b => b.platform === 'desktop').reduce((sum, b) => sum + (b.impressions || 0), 0),
        clicks: banners.filter(b => b.platform === 'desktop').reduce((sum, b) => sum + (b.clicks || 0), 0),
      },
      mobile: {
        banners: banners.filter(b => b.platform === 'mobile').length,
        impressions: banners.filter(b => b.platform === 'mobile').reduce((sum, b) => sum + (b.impressions || 0), 0),
        clicks: banners.filter(b => b.platform === 'mobile').reduce((sum, b) => sum + (b.clicks || 0), 0),
      }
    };
    
    // Get top 5 banners by impressions
    const topByImpressions = [...banners]
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 5);
    
    // Get top 5 banners by clicks
    const topByClicks = [...banners]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5);
    
    // Get top 5 banners by CTR (min 100 impressions)
    const topByCTR = [...banners]
      .filter(b => (b.impressions || 0) >= 100) // Only consider banners with substantial impressions
      .sort((a, b) => {
        const aCTR = a.impressions ? (a.clicks || 0) / a.impressions : 0;
        const bCTR = b.impressions ? (b.clicks || 0) / b.impressions : 0;
        return bCTR - aCTR;
      })
      .slice(0, 5);
    
    return {
      success: true,
      summary: {
        totalBanners: banners.length,
        activeBanners: banners.filter(b => b.isActive).length,
        scheduledBanners: banners.filter(b => b.startDate || b.endDate).length,
        totalImpressions,
        totalClicks,
        averageCTR
      },
      platformMetrics,
      topPerformers: {
        byImpressions: topByImpressions,
        byClicks: topByClicks,
        byCTR: topByCTR
      },
      allBanners: banners
    };
    
  } catch (error) {
    console.error("Error fetching banner metrics:", error);
    return {
      success: false,
      error: "Failed to fetch banner metrics"
    };
  }
}
