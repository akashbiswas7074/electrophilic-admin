import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IBannerImage extends Document {
  imageUrl: string;
  altText?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BannerImageSchema = new Schema<IBannerImage>(
  {
    imageUrl: { type: String, required: true },
    altText: { type: String },
  },
  { timestamps: true }
);

const BannerImage = models.BannerImage || model<IBannerImage>("BannerImage", BannerImageSchema);

export default BannerImage;
