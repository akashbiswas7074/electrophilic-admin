import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteFooter from "@/lib/database/models/website.footer.model";

export const dynamic = 'force-dynamic'; // Disable caching of this route

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find all footers with active one first, using lean() for better performance
    const footers = await WebsiteFooter.find().sort({ isActive: -1, updatedAt: -1 }).lean();
    
    // Default fallback footer
    const defaultFooter = {
      name: "Default Footer",
      contactInfo: {
        email: "support@vibecart.com",
        phone: "+1 (123) 456-7890",
        address: "123 VIBECart St, New York, NY 10001"
      },
      socialMedia: {
        facebook: "https://facebook.com/vibecart",
        twitter: "https://twitter.com/vibecart",
        instagram: "https://instagram.com/vibecart",
        youtube: "",
        linkedin: ""
      },
      companyLinks: [
        { title: "About Us", url: "/about" },
        { title: "Contact Us", url: "/contact" }
      ],
      shopLinks: [
        { title: "All Products", url: "/shop" },
        { title: "New Arrivals", url: "/shop/new-arrivals" }
      ],
      helpLinks: [
        { title: "FAQs", url: "/faqs" },
        { title: "Shipping", url: "/shipping" }
      ],
      copyrightText: "© 2025 VIBECart. All rights reserved.",
      isActive: true
    };

    // Log for debugging purposes
    console.log("Fetched footer count:", footers.length);
    
    // Convert MongoDB documents to plain objects to avoid serialization issues
    const serializedFooters = JSON.parse(JSON.stringify(footers));
    
    return NextResponse.json({ 
      success: true, 
      footers: serializedFooters,
      footer: serializedFooters.find((footer: any) => footer.isActive) || defaultFooter,
      activeFooter: serializedFooters.find((footer: any) => footer.isActive) || defaultFooter,
      defaultFooter
    });
    
  } catch (error: any) {
    console.error("Error fetching website footers:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to fetch website footers" 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("Received footer form data:", JSON.stringify(data, null, 2));
    await connectToDatabase();

    // Validate required fields
    if (!data.name || !data.contactInfo || !data.copyrightText) {
      return NextResponse.json(
        { success: false, message: "Name, contact information, and copyright text are required" },
        { status: 400 }
      );
    }

    // Ensure contactInfo has all required fields
    if (!data.contactInfo.email || !data.contactInfo.phone || !data.contactInfo.address) {
      return NextResponse.json(
        { success: false, message: "Email, phone, and address are required in contact information" },
        { status: 400 }
      );
    }

    // Clean up whitespace from text fields
    const cleanFooterData = {
      name: data.name.trim(),
      contactInfo: {
        email: data.contactInfo.email.trim(),
        phone: data.contactInfo.phone.trim(),
        address: data.contactInfo.address.trim()
      },
      socialMedia: {
        facebook: data.socialMedia?.facebook?.trim() || "",
        twitter: data.socialMedia?.twitter?.trim() || "",
        instagram: data.socialMedia?.instagram?.trim() || "",
        youtube: data.socialMedia?.youtube?.trim() || "",
        linkedin: data.socialMedia?.linkedin?.trim() || ""
      },
      companyLinks: Array.isArray(data.companyLinks) 
        ? data.companyLinks.filter(link => link.title && link.url).map(link => ({
            title: link.title.trim(),
            url: link.url.trim()
          }))
        : [],
      shopLinks: Array.isArray(data.shopLinks) 
        ? data.shopLinks.filter(link => link.title && link.url).map(link => ({
            title: link.title.trim(),
            url: link.url.trim()
          }))
        : [],
      helpLinks: Array.isArray(data.helpLinks) 
        ? data.helpLinks.filter(link => link.title && link.url).map(link => ({
            title: link.title.trim(),
            url: link.url.trim()
          }))
        : [],
      copyrightText: data.copyrightText.trim(),
      isActive: Boolean(data.isActive)
    };

    let footer;
    
    // Check if this is an update to an existing footer
    if (data._id) {
      try {
        // If setting as active, deactivate all others first
        if (cleanFooterData.isActive) {
          await WebsiteFooter.updateMany(
            { _id: { $ne: data._id } },
            { $set: { isActive: false } }
          );
        }
        
        // Update the existing footer
        footer = await WebsiteFooter.findByIdAndUpdate(
          data._id,
          { $set: cleanFooterData },
          { new: true, runValidators: true }
        );
        
        if (!footer) {
          return NextResponse.json(
            { success: false, message: "Footer with specified ID not found" },
            { status: 404 }
          );
        }
        
        console.log("Updated existing footer:", data._id);
      } catch (error: any) {
        console.error("Error updating footer:", error);
        return NextResponse.json(
          { success: false, message: `Error updating footer: ${error.message}` },
          { status: 500 }
        );
      }
    } else {
      try {
        // If setting as active, deactivate all others first
        if (cleanFooterData.isActive) {
          await WebsiteFooter.updateMany({}, { $set: { isActive: false } });
        }
        
        // Create new footer configuration
        footer = new WebsiteFooter(cleanFooterData);
        await footer.save();
        console.log("Created new footer successfully");
      } catch (error: any) {
        console.error("Error creating footer:", error);
        return NextResponse.json(
          { success: false, message: `Error creating footer: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: data._id ? "Footer configuration updated successfully" : "Footer configuration created successfully",
      footer: JSON.parse(JSON.stringify(footer)),
    });
  } catch (error: any) {
    console.error("Error in footer API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save website footer",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Footer ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if we're deleting the active footer
    const footer = await WebsiteFooter.findById(id).lean();
    
    if (!footer) {
      return NextResponse.json(
        { success: false, message: "Footer not found" },
        { status: 404 }
      );
    }
    
    const isActiveFooter = footer.isActive;
    
    // Delete the footer configuration
    await WebsiteFooter.findByIdAndDelete(id);
    
    // If this was the active footer, set another one as active if available
    if (isActiveFooter) {
      const remainingFooters = await WebsiteFooter.find().sort({ updatedAt: -1 });
      
      if (remainingFooters.length > 0) {
        // Set the most recently updated footer as active
        await WebsiteFooter.findByIdAndUpdate(
          remainingFooters[0]._id,
          { $set: { isActive: true } }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Footer configuration deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting footer:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete footer configuration",
      },
      { status: 500 }
    );
  }
}