"use server";

import { connectToDatabase } from "@/lib/database/connect";
import ShippingReturns from "@/lib/database/models/shipping-returns.model";
import { getServerSession } from "next-auth";

// Get the active shipping & returns configuration
export const getShippingReturns = async () => {
  try {
    await connectToDatabase();
    
    const config = await ShippingReturns.findOne({ isActive: true }).lean();
    
    if (!config) {
      // Return default configuration if none exists
      return {
        success: true,
        config: {
          title: "Shipping & Returns",
          subtitle: "Fast delivery and easy returns",
          shippingOptions: [
            {
              title: "Free Standard Shipping",
              description: "On all orders above ₹999. Orders typically arrive within 5-7 business days.",
              icon: "🚚",
              minOrderAmount: 999,
              deliveryTime: "5-7 business days",
              cost: 0,
              isActive: true,
              order: 0
            }
          ],
          returnInfo: [
            {
              title: "30-Day Returns",
              description: "Not completely satisfied? Return unworn items within 30 days for a full refund.",
              icon: "🔄",
              returnPeriodDays: 30,
              conditions: [
                "Items must be unworn and unwashed",
                "Original packaging and tags must be intact",
                "Return initiated within 30 days of purchase"
              ],
              isActive: true,
              order: 0
            }
          ],
          additionalInfo: "",
          isActive: true,
        }
      };
    }
    
    return {
      success: true,
      config: JSON.parse(JSON.stringify(config))
    };
  } catch (error: any) {
    console.error("Error fetching shipping & returns config:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch shipping & returns configuration",
      config: null
    };
  }
};

// Create or update shipping & returns configuration
export const upsertShippingReturns = async (configData: {
  title: string;
  subtitle?: string;
  shippingOptions: Array<{
    title: string;
    description: string;
    icon?: string;
    minOrderAmount?: number;
    deliveryTime: string;
    cost: number;
    isActive: boolean;
    order: number;
  }>;
  returnInfo: Array<{
    title: string;
    description: string;
    icon?: string;
    returnPeriodDays: number;
    conditions?: string[];
    isActive: boolean;
    order: number;
  }>;
  additionalInfo?: string;
  metaTitle?: string;
  metaDescription?: string;
  customCSS?: string;
}) => {
  try {
    await connectToDatabase();
    
    // Get session for tracking who updated it
    const session = await getServerSession();
    const updatedBy = session?.user?.email || "Admin";
    
    // Sort options and info by order
    const sortedShippingOptions = configData.shippingOptions.sort((a, b) => a.order - b.order);
    const sortedReturnInfo = configData.returnInfo.sort((a, b) => a.order - b.order);
    
    // Find existing active configuration or create new one
    let config = await ShippingReturns.findOne({ isActive: true });
    
    if (config) {
      // Update existing configuration
      config.title = configData.title;
      config.subtitle = configData.subtitle;
      config.shippingOptions = sortedShippingOptions;
      config.returnInfo = sortedReturnInfo;
      config.additionalInfo = configData.additionalInfo;
      config.metaTitle = configData.metaTitle;
      config.metaDescription = configData.metaDescription;
      config.customCSS = configData.customCSS;
      config.lastUpdatedBy = updatedBy;
      
      await config.save();
    } else {
      // Create new configuration
      config = new ShippingReturns({
        title: configData.title,
        subtitle: configData.subtitle,
        shippingOptions: sortedShippingOptions,
        returnInfo: sortedReturnInfo,
        additionalInfo: configData.additionalInfo,
        metaTitle: configData.metaTitle,
        metaDescription: configData.metaDescription,
        customCSS: configData.customCSS,
        lastUpdatedBy: updatedBy,
        isActive: true,
      });
      
      await config.save();
    }
    
    return {
      success: true,
      message: "Shipping & returns configuration updated successfully",
      config: JSON.parse(JSON.stringify(config))
    };
  } catch (error: any) {
    console.error("Error updating shipping & returns configuration:", error);
    return {
      success: false,
      message: error.message || "Failed to update shipping & returns configuration"
    };
  }
};

// Get all shipping & returns configurations (for admin management)
export const getAllShippingReturns = async () => {
  try {
    await connectToDatabase();
    
    const configs = await ShippingReturns.find({})
      .sort({ updatedAt: -1 })
      .lean();
    
    return {
      success: true,
      configs: JSON.parse(JSON.stringify(configs))
    };
  } catch (error: any) {
    console.error("Error fetching all shipping & returns configurations:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch configurations",
      configs: []
    };
  }
};

// Delete a shipping & returns configuration
export const deleteShippingReturns = async (configId: string) => {
  try {
    await connectToDatabase();
    
    const config = await ShippingReturns.findById(configId);
    
    if (!config) {
      return {
        success: false,
        message: "Configuration not found"
      };
    }
    
    // Don't allow deletion of active config if it's the only one
    if (config.isActive) {
      const totalConfigs = await ShippingReturns.countDocuments();
      if (totalConfigs === 1) {
        return {
          success: false,
          message: "Cannot delete the only active configuration"
        };
      }
    }
    
    await ShippingReturns.findByIdAndDelete(configId);
    
    return {
      success: true,
      message: "Configuration deleted successfully"
    };
  } catch (error: any) {
    console.error("Error deleting configuration:", error);
    return {
      success: false,
      message: error.message || "Failed to delete configuration"
    };
  }
};

// Activate a specific configuration
export const activateShippingReturns = async (configId: string) => {
  try {
    await connectToDatabase();
    
    // Deactivate all configurations
    await ShippingReturns.updateMany({}, { isActive: false });
    
    // Activate the specified configuration
    const config = await ShippingReturns.findByIdAndUpdate(
      configId,
      { isActive: true },
      { new: true }
    );
    
    if (!config) {
      return {
        success: false,
        message: "Configuration not found"
      };
    }
    
    return {
      success: true,
      message: "Configuration activated successfully",
      config: JSON.parse(JSON.stringify(config))
    };
  } catch (error: any) {
    console.error("Error activating configuration:", error);
    return {
      success: false,
      message: error.message || "Failed to activate configuration"
    };
  }
};