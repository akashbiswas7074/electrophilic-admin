import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/database/connect";
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

// HeroAnalytics Schema
const HeroAnalyticsSchema = new mongoose.Schema({
  heroSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeroSection', required: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  clickThroughRate: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  avgTimeOnSection: { type: Number, default: 0 },
  bounceRate: { type: Number, default: 0 },
  topPerformingButton: String,
  performanceScore: { type: Number, default: 0 },
  dailyMetrics: [{
    date: { type: String, required: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  }],
  buttonAnalytics: [{
    buttonText: String,
    buttonLink: String,
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

const HeroAnalytics = mongoose.models.HeroAnalytics || mongoose.model('HeroAnalytics', HeroAnalyticsSchema);

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

// Helper function to calculate performance score
function calculatePerformanceScore(analytics: any): number {
  let score = 0;
  
  // CTR contributes 40% to score
  const ctrScore = Math.min(analytics.clickThroughRate * 1000, 40); // Cap at 40 points
  score += ctrScore;
  
  // Conversion rate contributes 35% to score
  const conversionScore = Math.min(analytics.conversionRate * 350, 35); // Cap at 35 points
  score += conversionScore;
  
  // Time on section contributes 15% to score (ideal is 5+ seconds)
  const timeScore = Math.min((analytics.avgTimeOnSection / 5) * 15, 15);
  score += timeScore;
  
  // Low bounce rate contributes 10% to score (lower is better)
  const bounceScore = Math.max(10 - (analytics.bounceRate * 10), 0);
  score += bounceScore;
  
  return Math.round(score);
}

// Helper function to generate mock analytics data for demonstration
function generateMockAnalytics(heroSectionId: string) {
  const baseImpressions = Math.floor(Math.random() * 10000) + 1000;
  const baseClicks = Math.floor(baseImpressions * (Math.random() * 0.1 + 0.02)); // 2-12% CTR
  const clickThroughRate = baseClicks / baseImpressions;
  const conversionRate = Math.random() * 0.05 + 0.01; // 1-6% conversion rate
  const avgTimeOnSection = Math.random() * 8 + 2; // 2-10 seconds
  const bounceRate = Math.random() * 0.6 + 0.2; // 20-80% bounce rate
  
  // Generate 7 days of metrics
  const dailyMetrics = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayImpressions = Math.floor(baseImpressions / 7) + Math.floor(Math.random() * 200);
    const dayClicks = Math.floor(dayImpressions * clickThroughRate);
    const dayConversions = Math.floor(dayClicks * conversionRate);
    
    dailyMetrics.push({
      date: date.toISOString().split('T')[0],
      impressions: dayImpressions,
      clicks: dayClicks,
      conversions: dayConversions
    });
  }
  
  const analytics = {
    heroSectionId,
    impressions: baseImpressions,
    clicks: baseClicks,
    clickThroughRate,
    conversionRate,
    avgTimeOnSection,
    bounceRate,
    topPerformingButton: ['Shop Now', 'Learn More', 'Get Started', 'Buy Now'][Math.floor(Math.random() * 4)],
    dailyMetrics,
    buttonAnalytics: [
      {
        buttonText: 'Shop Now',
        buttonLink: '/shop',
        clicks: Math.floor(baseClicks * 0.6),
        conversions: Math.floor(baseClicks * 0.6 * conversionRate)
      },
      {
        buttonText: 'Learn More',
        buttonLink: '/about',
        clicks: Math.floor(baseClicks * 0.4),
        conversions: Math.floor(baseClicks * 0.4 * conversionRate)
      }
    ]
  };
  
  analytics.performanceScore = calculatePerformanceScore(analytics);
  return analytics;
}

// GET - Fetch analytics for all hero sections
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get all hero sections
    const HeroSection = mongoose.models.HeroSection || mongoose.model('HeroSection', new mongoose.Schema({}, { strict: false }));
    const heroSections = await HeroSection.find({ isActive: true });
    
    const analyticsData = [];
    
    for (const section of heroSections) {
      let analytics = await HeroAnalytics.findOne({ heroSectionId: section._id });
      
      // If no analytics exist, create mock data for demonstration
      if (!analytics) {
        const mockData = generateMockAnalytics(section._id.toString());
        analytics = new HeroAnalytics(mockData);
        await analytics.save();
      }
      
      analyticsData.push({
        heroSectionId: section._id.toString(),
        impressions: analytics.impressions,
        clicks: analytics.clicks,
        clickThroughRate: analytics.clickThroughRate,
        conversionRate: analytics.conversionRate,
        avgTimeOnSection: analytics.avgTimeOnSection,
        bounceRate: analytics.bounceRate,
        topPerformingButton: analytics.topPerformingButton,
        performanceScore: analytics.performanceScore,
        lastUpdated: analytics.updatedAt,
        dailyMetrics: analytics.dailyMetrics,
        buttonAnalytics: analytics.buttonAnalytics
      });
    }

    return NextResponse.json({
      success: true,
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// POST - Track a new analytics event
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    const { heroSectionId, eventType, buttonText, buttonLink } = data;
    
    if (!heroSectionId || !eventType) {
      return NextResponse.json(
        { success: false, message: "Hero section ID and event type are required" },
        { status: 400 }
      );
    }

    let analytics = await HeroAnalytics.findOne({ heroSectionId });
    
    if (!analytics) {
      analytics = new HeroAnalytics({
        heroSectionId,
        impressions: 0,
        clicks: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        avgTimeOnSection: 0,
        bounceRate: 0,
        performanceScore: 0,
        dailyMetrics: [],
        buttonAnalytics: []
      });
    }

    const today = new Date().toISOString().split('T')[0];
    let todayMetrics = analytics.dailyMetrics.find(m => m.date === today);
    
    if (!todayMetrics) {
      todayMetrics = { date: today, impressions: 0, clicks: 0, conversions: 0 };
      analytics.dailyMetrics.push(todayMetrics);
    }

    // Update metrics based on event type
    switch (eventType) {
      case 'impression':
        analytics.impressions += 1;
        todayMetrics.impressions += 1;
        break;
        
      case 'click':
        analytics.clicks += 1;
        todayMetrics.clicks += 1;
        
        // Update button analytics
        if (buttonText && buttonLink) {
          let buttonAnalytic = analytics.buttonAnalytics.find(
            b => b.buttonText === buttonText && b.buttonLink === buttonLink
          );
          
          if (!buttonAnalytic) {
            buttonAnalytic = { buttonText, buttonLink, clicks: 0, conversions: 0 };
            analytics.buttonAnalytics.push(buttonAnalytic);
          }
          
          buttonAnalytic.clicks += 1;
        }
        break;
        
      case 'conversion':
        todayMetrics.conversions += 1;
        
        // Update button conversion
        if (buttonText && buttonLink) {
          let buttonAnalytic = analytics.buttonAnalytics.find(
            b => b.buttonText === buttonText && b.buttonLink === buttonLink
          );
          
          if (buttonAnalytic) {
            buttonAnalytic.conversions += 1;
          }
        }
        break;
    }

    // Recalculate derived metrics
    analytics.clickThroughRate = analytics.impressions > 0 ? analytics.clicks / analytics.impressions : 0;
    analytics.conversionRate = analytics.clicks > 0 ? 
      analytics.dailyMetrics.reduce((sum, m) => sum + m.conversions, 0) / analytics.clicks : 0;
    
    // Find top performing button
    if (analytics.buttonAnalytics.length > 0) {
      const topButton = analytics.buttonAnalytics.reduce((prev, current) => 
        (prev.clicks > current.clicks) ? prev : current
      );
      analytics.topPerformingButton = topButton.buttonText;
    }
    
    // Recalculate performance score
    analytics.performanceScore = calculatePerformanceScore(analytics);
    
    // Keep only last 7 days of metrics
    analytics.dailyMetrics = analytics.dailyMetrics
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);

    await analytics.save();

    return NextResponse.json({
      success: true,
      message: "Analytics event tracked successfully"
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { success: false, message: "Failed to track analytics event" },
      { status: 500 }
    );
  }
}