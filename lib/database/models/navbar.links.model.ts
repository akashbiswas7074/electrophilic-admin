import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for navbar link document
export interface INavbarLink extends Document {
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for navbar links
const NavbarLinkSchema = new Schema<INavbarLink>(
  {
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
    },
    href: {
      type: String,
      required: [true, 'URL/path is required'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isExternal: {
      type: Boolean,
      default: false,
    },
    // For dropdown menus if needed in the future
    children: {
      type: [
        {
          label: String,
          href: String,
          isExternal: Boolean,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create or get the model
const NavbarLink: Model<INavbarLink> = mongoose.models.NavbarLink ||
  mongoose.model<INavbarLink>('NavbarLink', NavbarLinkSchema);

export default NavbarLink;