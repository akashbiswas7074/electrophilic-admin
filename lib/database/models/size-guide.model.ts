import mongoose, { Schema, Document, models, model } from "mongoose";

// Interface for size chart entry
export interface ISizeChartEntry {
  size: string;
  chest?: string;
  waist?: string;
  hip?: string;
  length?: string;
  shoulder?: string;
  sleeve?: string;
  neck?: string;
  inseam?: string;
  [key: string]: string | undefined; // Allow additional measurements
}

// Interface for size chart category
export interface ISizeChart {
  categoryName: string;
  description?: string;
  measurements: ISizeChartEntry[];
  measurementUnits: string; // "inches", "cm", etc.
  isActive: boolean;
  order: number;
}

// Interface for size guide document
export interface ISizeGuide extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  sizeCharts: ISizeChart[];
  fittingTips?: string[];
  measurementInstructions?: string;
  additionalInfo?: string;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  customCSS?: string;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Size Chart Entry Schema
const SizeChartEntrySchema = new Schema<ISizeChartEntry>({
  size: {
    type: String,
    required: [true, "Size is required"],
    trim: true,
  },
  chest: { type: String, trim: true },
  waist: { type: String, trim: true },
  hip: { type: String, trim: true },
  length: { type: String, trim: true },
  shoulder: { type: String, trim: true },
  sleeve: { type: String, trim: true },
  neck: { type: String, trim: true },
  inseam: { type: String, trim: true },
}, { 
  _id: false,
  strict: false // Allow additional measurement fields
});

// Size Chart Schema
const SizeChartSchema = new Schema<ISizeChart>({
  categoryName: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  measurements: [SizeChartEntrySchema],
  measurementUnits: {
    type: String,
    required: true,
    enum: ["inches", "cm"],
    default: "inches",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: false });

// Size Guide Schema
const SizeGuideSchema = new Schema<ISizeGuide>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    default: "Size Guide",
  },
  subtitle: {
    type: String,
    trim: true,
    default: "Find your perfect fit",
  },
  description: {
    type: String,
    trim: true,
    default: "Use our size guide to find the perfect fit for your body type.",
  },
  sizeCharts: [SizeChartSchema],
  fittingTips: [{
    type: String,
    trim: true,
  }],
  measurementInstructions: {
    type: String,
    default: "",
  },
  additionalInfo: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  customCSS: {
    type: String,
    default: "",
  },
  lastUpdatedBy: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// Only one size guide can be active at a time
SizeGuideSchema.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Create and export the model
const SizeGuide = models.SizeGuide || model<ISizeGuide>("SizeGuide", SizeGuideSchema);

export default SizeGuide;