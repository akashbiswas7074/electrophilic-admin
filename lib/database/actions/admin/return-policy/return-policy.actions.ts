"use server";

import { connectToDatabase } from "@/lib/database/connect";
import ReturnPolicy from "@/lib/database/models/return-policy.model";
import { getServerSession } from "next-auth";

// Get the active return policy
export const getReturnPolicy = async () => {
  try {
    await connectToDatabase();
    
    const policy = await ReturnPolicy.findOne({ isActive: true }).lean();
    
    if (!policy) {
      // Return default policy structure if none exists
      return {
        success: true,
        policy: {
          title: "Return & Exchange Policy",
          subtitle: "We've got your back—on and off the track.",
          heroIcon: "🏃‍♂️",
          sections: [],
          isActive: true,
        }
      };
    }
    
    return {
      success: true,
      policy: JSON.parse(JSON.stringify(policy))
    };
  } catch (error: any) {
    console.error("Error fetching return policy:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch return policy",
      policy: null
    };
  }
};

// Create or update return policy
export const upsertReturnPolicy = async (policyData: {
  title: string;
  subtitle?: string;
  heroIcon?: string;
  sections: Array<{
    title: string;
    content: string;
    icon?: string;
    order: number;
    isActive: boolean;
  }>;
  metaTitle?: string;
  metaDescription?: string;
  customCSS?: string;
}) => {
  try {
    await connectToDatabase();
    
    // Get session for tracking who updated it
    const session = await getServerSession();
    const updatedBy = session?.user?.email || "Admin";
    
    // Sort sections by order
    const sortedSections = policyData.sections.sort((a, b) => a.order - b.order);
    
    // Find existing active policy or create new one
    let policy = await ReturnPolicy.findOne({ isActive: true });
    
    if (policy) {
      // Update existing policy
      policy.title = policyData.title;
      policy.subtitle = policyData.subtitle;
      policy.heroIcon = policyData.heroIcon;
      policy.sections = sortedSections;
      policy.metaTitle = policyData.metaTitle;
      policy.metaDescription = policyData.metaDescription;
      policy.customCSS = policyData.customCSS;
      policy.lastUpdatedBy = updatedBy;
      
      await policy.save();
    } else {
      // Create new policy
      policy = new ReturnPolicy({
        title: policyData.title,
        subtitle: policyData.subtitle,
        heroIcon: policyData.heroIcon,
        sections: sortedSections,
        metaTitle: policyData.metaTitle,
        metaDescription: policyData.metaDescription,
        customCSS: policyData.customCSS,
        lastUpdatedBy: updatedBy,
        isActive: true,
      });
      
      await policy.save();
    }
    
    return {
      success: true,
      message: "Return policy updated successfully",
      policy: JSON.parse(JSON.stringify(policy))
    };
  } catch (error: any) {
    console.error("Error updating return policy:", error);
    return {
      success: false,
      message: error.message || "Failed to update return policy"
    };
  }
};

// Get all return policies (for admin management)
export const getAllReturnPolicies = async () => {
  try {
    await connectToDatabase();
    
    const policies = await ReturnPolicy.find({})
      .sort({ updatedAt: -1 })
      .lean();
    
    return {
      success: true,
      policies: JSON.parse(JSON.stringify(policies))
    };
  } catch (error: any) {
    console.error("Error fetching all return policies:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch return policies",
      policies: []
    };
  }
};

// Delete a return policy
export const deleteReturnPolicy = async (policyId: string) => {
  try {
    await connectToDatabase();
    
    const policy = await ReturnPolicy.findById(policyId);
    
    if (!policy) {
      return {
        success: false,
        message: "Return policy not found"
      };
    }
    
    // Don't allow deletion of active policy if it's the only one
    if (policy.isActive) {
      const totalPolicies = await ReturnPolicy.countDocuments();
      if (totalPolicies === 1) {
        return {
          success: false,
          message: "Cannot delete the only active return policy"
        };
      }
    }
    
    await ReturnPolicy.findByIdAndDelete(policyId);
    
    return {
      success: true,
      message: "Return policy deleted successfully"
    };
  } catch (error: any) {
    console.error("Error deleting return policy:", error);
    return {
      success: false,
      message: error.message || "Failed to delete return policy"
    };
  }
};

// Activate a specific return policy
export const activateReturnPolicy = async (policyId: string) => {
  try {
    await connectToDatabase();
    
    // Deactivate all policies
    await ReturnPolicy.updateMany({}, { isActive: false });
    
    // Activate the specified policy
    const policy = await ReturnPolicy.findByIdAndUpdate(
      policyId,
      { isActive: true },
      { new: true }
    );
    
    if (!policy) {
      return {
        success: false,
        message: "Return policy not found"
      };
    }
    
    return {
      success: true,
      message: "Return policy activated successfully",
      policy: JSON.parse(JSON.stringify(policy))
    };
  } catch (error: any) {
    console.error("Error activating return policy:", error);
    return {
      success: false,
      message: error.message || "Failed to activate return policy"
    };
  }
};