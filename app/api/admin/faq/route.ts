import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import FAQ from "@/lib/database/models/faq.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET - Fetch all FAQs
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const active = searchParams.get("active");

    let query: any = {};
    
    if (category && category !== "all") {
      query.category = category;
    }
    
    if (active !== null) {
      query.isActive = active === "true";
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const faqs = await FAQ.find(query)
      .sort({ category: 1, order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      faqs,
      message: "FAQs fetched successfully",
    });
  } catch (error: any) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch FAQs",
      },
      { status: 500 }
    );
  }
}

// POST - Create new FAQ
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const body = await request.json();
    const { question, answer, category, tags = [], order = 0 } = body;

    if (!question || !answer || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Question, answer, and category are required",
        },
        { status: 400 }
      );
    }

    const newFAQ = await FAQ.create({
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      tags: Array.isArray(tags) ? tags.map((tag: string) => tag.trim()).filter(Boolean) : [],
      order: Number(order) || 0,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      faq: newFAQ,
      message: "FAQ created successfully",
    });
  } catch (error: any) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create FAQ",
      },
      { status: 500 }
    );
  }
}

// PUT - Update FAQ
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const body = await request.json();
    const { id, question, answer, category, tags = [], order = 0, isActive = true } = body;

    if (!id || !question || !answer || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "ID, question, answer, and category are required",
        },
        { status: 400 }
      );
    }

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      {
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        tags: Array.isArray(tags) ? tags.map((tag: string) => tag.trim()).filter(Boolean) : [],
        order: Number(order) || 0,
        isActive: Boolean(isActive),
      },
      { new: true }
    );

    if (!updatedFAQ) {
      return NextResponse.json(
        { success: false, message: "FAQ not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      faq: updatedFAQ,
      message: "FAQ updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update FAQ",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete FAQ
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "FAQ ID is required" },
        { status: 400 }
      );
    }

    const deletedFAQ = await FAQ.findByIdAndDelete(id);

    if (!deletedFAQ) {
      return NextResponse.json(
        { success: false, message: "FAQ not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete FAQ",
      },
      { status: 500 }
    );
  }
}