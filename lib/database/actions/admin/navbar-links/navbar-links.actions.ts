"use server";

import { connectToDatabase } from "@/lib/database/connect";
import NavbarLink, { INavbarLink } from "@/lib/database/models/navbar-link.model";
import { revalidatePath } from "next/cache";

/**
 * Get all navbar links
 */
export async function getAllNavbarLinks() {
  try {
    await connectToDatabase();
    
    // Get all navbar links sorted by order
    const navbarLinks = await NavbarLink.find().sort({ order: 1 }).lean();
    
    return {
      success: true,
      navbarLinks: JSON.parse(JSON.stringify(navbarLinks))
    };
  } catch (error: any) {
    console.error("Error fetching navbar links:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch navbar links"
    };
  }
}

/**
 * Create a new navbar link
 */
export async function createNavbarLink(data: INavbarLink) {
  try {
    await connectToDatabase();
    
    // Create new navbar link
    const newNavbarLink = await NavbarLink.create(data);
    
    // Revalidate the navbar links page to update the UI
    revalidatePath("/admin/dashboard/navbar-links");
    
    return {
      success: true,
      navbarLink: JSON.parse(JSON.stringify(newNavbarLink))
    };
  } catch (error: any) {
    console.error("Error creating navbar link:", error);
    return {
      success: false,
      message: error.message || "Failed to create navbar link"
    };
  }
}

/**
 * Update an existing navbar link
 */
export async function updateNavbarLink(id: string, updates: Partial<INavbarLink>) {
  try {
    await connectToDatabase();
    
    // Find and update the navbar link
    const updatedNavbarLink = await NavbarLink.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
    
    if (!updatedNavbarLink) {
      return {
        success: false,
        message: "Navbar link not found"
      };
    }
    
    // Revalidate the navbar links page to update the UI
    revalidatePath("/admin/dashboard/navbar-links");
    
    return {
      success: true,
      navbarLink: JSON.parse(JSON.stringify(updatedNavbarLink))
    };
  } catch (error: any) {
    console.error("Error updating navbar link:", error);
    return {
      success: false,
      message: error.message || "Failed to update navbar link"
    };
  }
}

/**
 * Toggle a navbar link's active status
 */
export async function toggleNavbarLinkActive(id: string) {
  try {
    await connectToDatabase();
    
    // Find the navbar link
    const navbarLink = await NavbarLink.findById(id);
    
    if (!navbarLink) {
      return {
        success: false,
        message: "Navbar link not found"
      };
    }
    
    // Toggle active status
    navbarLink.isActive = !navbarLink.isActive;
    await navbarLink.save();
    
    // Revalidate the navbar links page to update the UI
    revalidatePath("/admin/dashboard/navbar-links");
    
    return {
      success: true,
      navbarLink: JSON.parse(JSON.stringify(navbarLink))
    };
  } catch (error: any) {
    console.error("Error toggling navbar link active status:", error);
    return {
      success: false,
      message: error.message || "Failed to toggle navbar link active status"
    };
  }
}

/**
 * Delete a navbar link
 */
export async function deleteNavbarLink(id: string) {
  try {
    await connectToDatabase();
    
    // Find and delete the navbar link
    const deletedNavbarLink = await NavbarLink.findByIdAndDelete(id);
    
    if (!deletedNavbarLink) {
      return {
        success: false,
        message: "Navbar link not found"
      };
    }
    
    // Revalidate the navbar links page to update the UI
    revalidatePath("/admin/dashboard/navbar-links");
    
    return {
      success: true,
      message: "Navbar link deleted successfully"
    };
  } catch (error: any) {
    console.error("Error deleting navbar link:", error);
    return {
      success: false,
      message: error.message || "Failed to delete navbar link"
    };
  }
}