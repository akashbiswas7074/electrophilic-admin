"use server";

import { connectToDatabase } from "@/lib/database/connect";
import FAQ from "@/lib/database/models/faq.model";
import { revalidatePath } from "next/cache";

// Get all FAQs for admin (including inactive ones)
export const getAllFAQsForAdmin = async () => {
  try {
    await connectToDatabase();
    
    const faqs = await FAQ.find({})
      .sort({ category: 1, order: 1, createdAt: -1 })
      .lean();

    return {
      success: true,
      faqs: JSON.parse(JSON.stringify(faqs)),
      message: "FAQs fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching FAQs for admin:", error);
    return {
      success: false,
      faqs: [],
      message: error.message || "Failed to fetch FAQs",
    };
  }
};

// Create a new FAQ
export const createFAQ = async (
  question: string,
  answer: string,
  category: string,
  tags: string[] = [],
  order: number = 0
) => {
  try {
    await connectToDatabase();

    if (!question || !answer || !category) {
      return {
        success: false,
        message: "Question, answer, and category are required",
      };
    }

    const newFAQ = await FAQ.create({
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
      order: order,
      isActive: true,
    });

    // Revalidate the FAQ cache
    revalidatePath("/faq");
    revalidatePath("/admin/faq");

    return {
      success: true,
      faq: JSON.parse(JSON.stringify(newFAQ)),
      message: "FAQ created successfully",
    };
  } catch (error: any) {
    console.error("Error creating FAQ:", error);
    return {
      success: false,
      message: error.message || "Failed to create FAQ",
    };
  }
};

// Update an existing FAQ
export const updateFAQ = async (
  id: string,
  question: string,
  answer: string,
  category: string,
  tags: string[] = [],
  order: number = 0,
  isActive: boolean = true
) => {
  try {
    await connectToDatabase();

    if (!question || !answer || !category) {
      return {
        success: false,
        message: "Question, answer, and category are required",
      };
    }

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      {
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
        order: order,
        isActive: isActive,
      },
      { new: true }
    );

    if (!updatedFAQ) {
      return {
        success: false,
        message: "FAQ not found",
      };
    }

    // Revalidate the FAQ cache
    revalidatePath("/faq");
    revalidatePath("/admin/faq");

    return {
      success: true,
      faq: JSON.parse(JSON.stringify(updatedFAQ)),
      message: "FAQ updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating FAQ:", error);
    return {
      success: false,
      message: error.message || "Failed to update FAQ",
    };
  }
};

// Delete an FAQ
export const deleteFAQ = async (id: string) => {
  try {
    await connectToDatabase();

    const deletedFAQ = await FAQ.findByIdAndDelete(id);

    if (!deletedFAQ) {
      return {
        success: false,
        message: "FAQ not found",
      };
    }

    // Revalidate the FAQ cache
    revalidatePath("/faq");
    revalidatePath("/admin/faq");

    return {
      success: true,
      message: "FAQ deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting FAQ:", error);
    return {
      success: false,
      message: error.message || "Failed to delete FAQ",
    };
  }
};

// Toggle FAQ active status
export const toggleFAQStatus = async (id: string) => {
  try {
    await connectToDatabase();

    const faq = await FAQ.findById(id);
    if (!faq) {
      return {
        success: false,
        message: "FAQ not found",
      };
    }

    faq.isActive = !faq.isActive;
    await faq.save();

    // Revalidate the FAQ cache
    revalidatePath("/faq");
    revalidatePath("/admin/faq");

    return {
      success: true,
      faq: JSON.parse(JSON.stringify(faq)),
      message: `FAQ ${faq.isActive ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error: any) {
    console.error("Error toggling FAQ status:", error);
    return {
      success: false,
      message: error.message || "Failed to toggle FAQ status",
    };
  }
};

// Update FAQ order
export const updateFAQOrder = async (id: string, newOrder: number) => {
  try {
    await connectToDatabase();

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      { order: newOrder },
      { new: true }
    );

    if (!updatedFAQ) {
      return {
        success: false,
        message: "FAQ not found",
      };
    }

    // Revalidate the FAQ cache
    revalidatePath("/faq");
    revalidatePath("/admin/faq");

    return {
      success: true,
      message: "FAQ order updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating FAQ order:", error);
    return {
      success: false,
      message: error.message || "Failed to update FAQ order",
    };
  }
};

// Get FAQ categories for admin
export const getFAQCategoriesForAdmin = async () => {
  try {
    await connectToDatabase();
    
    const categories = await FAQ.distinct("category");

    return {
      success: true,
      categories: categories.sort(),
      message: "Categories fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching FAQ categories for admin:", error);
    return {
      success: false,
      categories: [],
      message: error.message || "Failed to fetch categories",
    };
  }
};

// Get single FAQ by ID
export const getFAQById = async (id: string) => {
  try {
    await connectToDatabase();
    
    const faq = await FAQ.findById(id).lean();

    if (!faq) {
      return {
        success: false,
        faq: null,
        message: "FAQ not found",
      };
    }

    return {
      success: true,
      faq: JSON.parse(JSON.stringify(faq)),
      message: "FAQ fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching FAQ by ID:", error);
    return {
      success: false,
      faq: null,
      message: error.message || "Failed to fetch FAQ",
    };
  }
};