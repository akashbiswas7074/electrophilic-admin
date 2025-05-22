import { Metadata } from "next";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteFooter from "@/lib/database/models/website.footer.model";

import { PageHeader } from "@/components/ui/page-header";
import { SiteFooterForm } from "@/components/admin/site-footer/site-footer-form";

export const metadata: Metadata = {
  title: "Site Footer",
  description: "Manage your website footer content",
};

// Prevent page from being cached to ensure fresh data on each load
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SiteFooterPage() {
  // Fetch all footer configurations for display in the admin panel
  try {
    await connectToDatabase();

    // Explicitly sort by active status first, then by update time
    const footers = await WebsiteFooter.find()
      .sort({
        isActive: -1,
        updatedAt: -1,
      })
      .lean();

    // Convert mongoose documents to plain objects
    const serializedFooters = JSON.parse(JSON.stringify(footers));

    // If no footers found, provide an empty array
    return (
      <div className="flex flex-col gap-8 pb-10">
        <PageHeader
          heading="Site Footer"
          text="Manage your website footer content and links"
        />

        <SiteFooterForm initialData={serializedFooters || []} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching footer data:", error);

    // Return form with empty data if there's an error
    return (
      <div className="flex flex-col gap-8 pb-10">
        <PageHeader
          heading="Site Footer"
          text="Manage your website footer content and links"
        />

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4 text-amber-800">
          Failed to load existing footer data. You can still create a new footer.
        </div>

        <SiteFooterForm initialData={[]} />
      </div>
    );
  }
}