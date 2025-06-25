import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/database/connect";
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

// PersonalizationRule Schema
const PersonalizationRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  conditions: {
    userRole: [String],
    location: [String],
    deviceType: [String],
    timeOfDay: [String],
    visitCount: {
      min: Number,
      max: Number
    },
    lastPurchase: {
      days: Number
    },
    cartValue: {
      min: Number,
      max: Number
    },
    previouslyViewed: [String]
  },
  content: {
    heroSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeroSection', required: true },
    priority: { type: Number, default: 1 },
    customContent: {
      title: String,
      subtitle: String,
      buttonText: String,
      buttonLink: String,
      backgroundImage: String
    }
  },
  isActive: { type: Boolean, default: true },
  schedule: {
    startDate: Date,
    endDate: Date,
    timeZone: String
  }
}, {
  timestamps: true
});

const PersonalizationRule = mongoose.models.PersonalizationRule || mongoose.model('PersonalizationRule', PersonalizationRuleSchema);

// Authentication check
async function checkAuthentication() {
  let isAuthenticated = false;
  
  try {
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      isAuthenticated = true;
    }
  } catch (error) {
    console.log("NextAuth session check failed:", error);
  }
  
  if (!isAuthenticated) {
    const cookieStore = cookies();
    const adminId = cookieStore.get('adminId')?.value;
    if (adminId) {
      isAuthenticated = true;
    }
  }
  
  if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
    isAuthenticated = true;
  }
  
  return isAuthenticated;
}

// GET - Fetch all personalization rules
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const rules = await PersonalizationRule.find({})
      .populate('content.heroSectionId', 'title subtitle')
      .sort({ 'content.priority': -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      rules: rules.map(rule => ({
        id: rule._id.toString(),
        name: rule.name,
        conditions: rule.conditions,
        content: {
          ...rule.content,
          heroSectionId: rule.content.heroSectionId._id.toString(),
          heroSectionTitle: rule.content.heroSectionId.title
        },
        isActive: rule.isActive,
        schedule: rule.schedule,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching personalization rules:', error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch personalization rules" },
      { status: 500 }
    );
  }
}

// POST - Create new personalization rule
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.content?.heroSectionId) {
      return NextResponse.json(
        { success: false, message: "Name and hero section ID are required" },
        { status: 400 }
      );
    }

    // Check if hero section exists
    const HeroSection = mongoose.models.HeroSection || mongoose.model('HeroSection', new mongoose.Schema({}, { strict: false }));
    const heroSectionExists = await HeroSection.findById(data.content.heroSectionId);
    if (!heroSectionExists) {
      return NextResponse.json(
        { success: false, message: "Hero section not found" },
        { status: 400 }
      );
    }

    const newRule = new PersonalizationRule({
      name: data.name,
      conditions: data.conditions || {},
      content: {
        heroSectionId: data.content.heroSectionId,
        priority: data.content.priority || 1,
        customContent: data.content.customContent || {}
      },
      isActive: data.isActive !== undefined ? data.isActive : true,
      schedule: data.schedule || {}
    });

    await newRule.save();

    return NextResponse.json({
      success: true,
      message: "Personalization rule created successfully",
      rule: {
        id: newRule._id.toString(),
        name: newRule.name,
        conditions: newRule.conditions,
        content: newRule.content,
        isActive: newRule.isActive,
        schedule: newRule.schedule,
        createdAt: newRule.createdAt,
        updatedAt: newRule.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating personalization rule:', error);
    return NextResponse.json(
      { success: false, message: "Failed to create personalization rule" },
      { status: 500 }
    );
  }
}

// PUT - Update personalization rule
export async function PUT(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Rule ID is required" },
        { status: 400 }
      );
    }

    const updatedRule = await PersonalizationRule.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedRule) {
      return NextResponse.json(
        { success: false, message: "Personalization rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Personalization rule updated successfully",
      rule: {
        id: updatedRule._id.toString(),
        name: updatedRule.name,
        conditions: updatedRule.conditions,
        content: updatedRule.content,
        isActive: updatedRule.isActive,
        schedule: updatedRule.schedule,
        createdAt: updatedRule.createdAt,
        updatedAt: updatedRule.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating personalization rule:', error);
    return NextResponse.json(
      { success: false, message: "Failed to update personalization rule" },
      { status: 500 }
    );
  }
}

// DELETE - Delete personalization rule
export async function DELETE(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Rule ID is required" },
        { status: 400 }
      );
    }

    const deletedRule = await PersonalizationRule.findByIdAndDelete(id);

    if (!deletedRule) {
      return NextResponse.json(
        { success: false, message: "Personalization rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Personalization rule deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting personalization rule:', error);
    return NextResponse.json(
      { success: false, message: "Failed to delete personalization rule" },
      { status: 500 }
    );
  }
}