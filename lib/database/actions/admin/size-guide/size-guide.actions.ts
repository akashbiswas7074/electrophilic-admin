"use server";

import { connectToDatabase } from "@/lib/database/connect";
import SizeGuide from "@/lib/database/models/size-guide.model";
import { revalidatePath } from "next/cache";

export interface SizeGuideConfig {
  _id?: string;
  title: string;
  subtitle: string;
  heroIcon: string;
  sections: Array<{
    title: string;
    content: string;
    icon: string;
    isActive: boolean;
    order: number;
  }>;
  sizeChart: {
    enabled: boolean;
    measurementLabels: string[];
    entries: Array<{
      size: string;
      measurements: { [key: string]: string };
      order: number;
    }>;
  };
  howToMeasure: {
    enabled: boolean;
    content: string;
    images: string[];
  };
  fitTips: {
    enabled: boolean;
    content: string;
  };
  metaTitle: string;
  metaDescription: string;
  customCSS: string;
  isActive?: boolean;
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export async function getSizeGuide() {
  try {
    await connectToDatabase();
    
    const activeConfig = await SizeGuide.findOne({ isActive: true }).lean();
    
    if (!activeConfig) {
      // Create a default configuration if none exists
      const defaultConfig = new SizeGuide({
        title: "Size Guide",
        subtitle: "Find your perfect fit",
        heroIcon: "📐",
        sections: [],
        sizeChart: {
          enabled: true,
          measurementLabels: ["Chest", "Waist", "Length"],
          entries: []
        },
        howToMeasure: {
          enabled: true,
          content: "",
          images: []
        },
        fitTips: {
          enabled: true,
          content: ""
        },
        metaTitle: "",
        metaDescription: "",
        customCSS: "",
        isActive: true,
      });
      
      const savedConfig = await defaultConfig.save();
      
      return {
        success: true,
        config: JSON.parse(JSON.stringify(savedConfig)),
        message: "Default configuration created"
      };
    }
    
    return {
      success: true,
      config: JSON.parse(JSON.stringify(activeConfig)),
    };
  } catch (error) {
    console.error("Error getting size guide:", error);
    return {
      success: false,
      message: "Failed to fetch size guide configuration",
    };
  }
}

export async function getAllSizeGuides() {
  try {
    await connectToDatabase();
    
    const configs = await SizeGuide.find({})
      .sort({ updatedAt: -1 })
      .lean();
    
    return {
      success: true,
      configs: JSON.parse(JSON.stringify(configs)),
    };
  } catch (error) {
    console.error("Error getting all size guides:", error);
    return {
      success: false,
      configs: [],
      message: "Failed to fetch size guide configurations",
    };
  }
}

export async function upsertSizeGuide(configData: SizeGuideConfig) {
  try {
    await connectToDatabase();
    
    let config;
    
    if (configData._id) {
      // Update existing configuration
      config = await SizeGuide.findByIdAndUpdate(
        configData._id,
        {
          ...configData,
          lastUpdatedBy: "Admin", // You can pass the actual admin user
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new configuration
      config = new SizeGuide({
        ...configData,
        lastUpdatedBy: "Admin", // You can pass the actual admin user
        isActive: true, // New configurations are active by default
      });
      
      await config.save();
    }
    
    if (!config) {
      return {
        success: false,
        message: "Failed to save configuration",
      };
    }
    
    // Revalidate related pages
    revalidatePath("/size-guide");
    revalidatePath("/admin/dashboard/size-guide");
    
    return {
      success: true,
      config: JSON.parse(JSON.stringify(config)),
      message: "Size guide configuration saved successfully",
    };
  } catch (error) {
    console.error("Error saving size guide:", error);
    return {
      success: false,
      message: "Failed to save size guide configuration",
    };
  }
}

export async function deleteSizeGuide(configId: string) {
  try {
    await connectToDatabase();
    
    const config = await SizeGuide.findById(configId);
    
    if (!config) {
      return {
        success: false,
        message: "Configuration not found",
      };
    }
    
    if (config.isActive) {
      return {
        success: false,
        message: "Cannot delete active configuration. Please activate another configuration first.",
      };
    }
    
    await SizeGuide.findByIdAndDelete(configId);
    
    // Revalidate related pages
    revalidatePath("/admin/dashboard/size-guide");
    
    return {
      success: true,
      message: "Configuration deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting size guide:", error);
    return {
      success: false,
      message: "Failed to delete configuration",
    };
  }
}

export async function activateSizeGuide(configId: string) {
  try {
    await connectToDatabase();
    
    // Deactivate all configurations
    await SizeGuide.updateMany({}, { $set: { isActive: false } });
    
    // Activate the specified configuration
    const config = await SizeGuide.findByIdAndUpdate(
      configId,
      { $set: { isActive: true, updatedAt: new Date() } },
      { new: true }
    );
    
    if (!config) {
      return {
        success: false,
        message: "Configuration not found",
      };
    }
    
    // Revalidate related pages
    revalidatePath("/size-guide");
    revalidatePath("/admin/dashboard/size-guide");
    
    return {
      success: true,
      message: "Configuration activated successfully",
    };
  } catch (error) {
    console.error("Error activating size guide:", error);
    return {
      success: false,
      message: "Failed to activate configuration",
    };
  }
}