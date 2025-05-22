"use server";

import { connectToDatabase } from "@/lib/database/connect";
import WebsiteFooter, { IWebsiteFooter } from "@/lib/database/models/website.footer.model";

// Fetch all footer configurations for admin
export const fetchAllFooterConfigs = async () => {
  try {
    await connectToDatabase();
    const footerConfigs = await WebsiteFooter.find().sort({ updatedAt: -1 });
    return JSON.parse(JSON.stringify(footerConfigs));
  } catch (error: any) {
    console.error("Error fetching footer configurations:", error);
    return [];
  }
};

// Fetch the active footer configuration
export const fetchActiveFooterConfig = async () => {
  try {
    await connectToDatabase();
    const activeFooter = await WebsiteFooter.findOne({ isActive: true });
    return activeFooter ? JSON.parse(JSON.stringify(activeFooter)) : null;
  } catch (error: any) {
    console.error("Error fetching active footer configuration:", error);
    return null;
  }
};

// Create a new footer configuration
export const createFooterConfig = async (footerData: IWebsiteFooter) => {
  try {
    await connectToDatabase();
    
    // Validate required fields
    if (!footerData.email || !footerData.phone || !footerData.address) {
      return {
        success: false,
        message: "Email, phone, and address are required fields",
      };
    }
    
    // Create new footer configuration
    const newFooterConfig = new WebsiteFooter({
      email: footerData.email,
      phone: footerData.phone,
      address: footerData.address,
      isActive: footerData.isActive || false,
      socialLinks: {
        facebook: footerData.socialLinks?.facebook || "",
        twitter: footerData.socialLinks?.twitter || "",
        instagram: footerData.socialLinks?.instagram || "",
        youtube: footerData.socialLinks?.youtube || "",
        linkedin: footerData.socialLinks?.linkedin || "",
      },
      companyLinks: footerData.companyLinks || [],
      shopLinks: footerData.shopLinks || [],
      helpLinks: footerData.helpLinks || [],
    });
    
    await newFooterConfig.save();
    
    return {
      success: true,
      message: "Footer configuration created successfully",
      footerConfig: JSON.parse(JSON.stringify(newFooterConfig)),
    };
  } catch (error: any) {
    console.error("Error creating footer configuration:", error);
    return {
      success: false,
      message: `Error creating footer configuration: ${error.message}`,
    };
  }
};

// Update an existing footer configuration
export const updateFooterConfig = async (id: string, footerData: Partial<IWebsiteFooter>) => {
  try {
    await connectToDatabase();
    
    const footerConfig = await WebsiteFooter.findById(id);
    
    if (!footerConfig) {
      return {
        success: false,
        message: "Footer configuration not found",
      };
    }
    
    // Update fields
    if (footerData.email) footerConfig.email = footerData.email;
    if (footerData.phone) footerConfig.phone = footerData.phone;
    if (footerData.address) footerConfig.address = footerData.address;
    if (footerData.isActive !== undefined) footerConfig.isActive = footerData.isActive;
    
    // Update social links
    if (footerData.socialLinks) {
      footerConfig.socialLinks = {
        ...footerConfig.socialLinks,
        ...footerData.socialLinks,
      };
    }
    
    // Update link arrays
    if (footerData.companyLinks) footerConfig.companyLinks = footerData.companyLinks;
    if (footerData.shopLinks) footerConfig.shopLinks = footerData.shopLinks;
    if (footerData.helpLinks) footerConfig.helpLinks = footerData.helpLinks;
    
    await footerConfig.save();
    
    return {
      success: true,
      message: "Footer configuration updated successfully",
      footerConfig: JSON.parse(JSON.stringify(footerConfig)),
    };
  } catch (error: any) {
    console.error("Error updating footer configuration:", error);
    return {
      success: false,
      message: `Error updating footer configuration: ${error.message}`,
    };
  }
};

// Delete a footer configuration
export const deleteFooterConfig = async (id: string) => {
  try {
    await connectToDatabase();
    
    const result = await WebsiteFooter.findByIdAndDelete(id);
    
    if (!result) {
      return {
        success: false,
        message: "Footer configuration not found",
      };
    }
    
    return {
      success: true,
      message: "Footer configuration deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting footer configuration:", error);
    return {
      success: false,
      message: `Error deleting footer configuration: ${error.message}`,
    };
  }
};

// Set a footer configuration as active
export const setFooterConfigActive = async (id: string) => {
  try {
    await connectToDatabase();
    
    const footerConfig = await WebsiteFooter.findById(id);
    
    if (!footerConfig) {
      return {
        success: false,
        message: "Footer configuration not found",
      };
    }
    
    footerConfig.isActive = true;
    await footerConfig.save();
    
    return {
      success: true,
      message: "Footer configuration set as active successfully",
      footerConfig: JSON.parse(JSON.stringify(footerConfig)),
    };
  } catch (error: any) {
    console.error("Error setting footer configuration as active:", error);
    return {
      success: false,
      message: `Error setting footer configuration as active: ${error.message}`,
    };
  }
};