import { Metadata } from "next";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteLogo from "@/lib/database/models/website.logo.model";

import { PageHeader } from "@/components/ui/page-header";
import { LogoForm } from "@/components/admin/site-logo/logo-form";

export const metadata: Metadata = {
  title: "Website Logo",
  description: "Manage your website logo",
};

// Prevent page from being cached to ensure fresh data on each load
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SiteLogoPage() {
  try {
    // Fetch all logos for display in the admin panel
    await connectToDatabase();
    
    // Explicitly sort by active status first, then by update time
    const logos = await WebsiteLogo.find().sort({ 
      isActive: -1, 
      updatedAt: -1 
    }).lean();
    
    const serializedLogos = JSON.parse(JSON.stringify(logos));
    
    return (
      <div className="flex flex-col gap-8 pb-10">
        <PageHeader
          heading="Website Logo"
          text="Manage your website logo and branding"
        />

        <LogoForm initialData={serializedLogos || []} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching logo data:", error);
    
    // Return form with empty data if there's an error
    return (
      <div className="flex flex-col gap-8 pb-10">
        <PageHeader
          heading="Website Logo"
          text="Manage your website logo and branding"
        />
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4 text-amber-800">
          Failed to load existing logo data. You can still create a new logo.
        </div>

        <LogoForm initialData={[]} />
      </div>
    );
  }
}