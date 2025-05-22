import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IBanner extends Document {
  url: string;
  public_id: string;
  type: "website";
  platform: "desktop" | "mobile";
  linkUrl?: string;
  altText?: string;
  startDate?: Date | null; // Added startDate
  endDate?: Date | null;   // Added endDate
  isActive?: boolean;      // Added isActive
  priority?: number;       // Added priority
  impressions?: number;    // Added impressions
  clicks?: number;         // Added clicks
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true, unique: true },
    type: { type: String, enum: ["website"], required: true },
    platform: { type: String, enum: ["desktop", "mobile"], required: true },
    linkUrl: { type: String },
    altText: { type: String },
    startDate: { type: Date, default: null }, // Added startDate to schema
    endDate: { type: Date, default: null },   // Added endDate to schema
    isActive: { type: Boolean, default: true }, // Added isActive to schema
    priority: { type: Number, default: 10 },   // Added priority to schema
    impressions: { type: Number, default: 0 }, // Added impressions
    clicks: { type: Number, default: 0 },      // Added clicks
  },
  { timestamps: true }
);

const Banner = models.Banner || model<IBanner>("Banner", BannerSchema);

export default Banner;
