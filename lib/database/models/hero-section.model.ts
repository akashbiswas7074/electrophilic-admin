import mongoose, { Schema } from 'mongoose';

// Type for button
export interface IButton {
  label: string;
  link: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

// Define pattern types
export type HeroPattern = 'standard' | 'brand-control' | 'partner' | 'dont-miss';

// Define the Hero Section content type
export interface IHeroSection {
  _id?: string;
  title: string;           // The main heading "STRENGTH TAKES SWEAT"
  subtitle: string;        // The text below "The training styles that aren't afraid to put in the work."
  longDescription?: string; // Rich text description for dynamic HTML content
  buttons: IButton[];      // Array of buttons with label and link
  isActive: boolean;       // Whether this section is currently active
  order: number;           // Display order on the page
  pattern: HeroPattern;    // The layout pattern to use
  layoutId?: string;       // Specific layout design identifier
  backgroundImage?: string; // Optional background image URL
  contentAlignment?: 'left' | 'center' | 'right'; // Where to align the content
  mediaUrl?: string;       // URL for media (image or video)
  mediaType?: 'image' | 'video'; // Type of media
  titleColor?: string;     // Color for the title text
  descriptionColor?: string; // Color for the description text
  buttonTextColor?: string; // Color for button text
  buttonBackgroundColor?: string; // Background color for buttons
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema for Button
const ButtonSchema = new Schema({
  label: {
    type: String,
    required: [true, "Button label is required"],
    trim: true,
  },
  link: {
    type: String,
    required: [true, "Button link is required"],
    trim: true,
  },
  variant: {
    type: String,
    enum: ['primary', 'secondary', 'outline', 'ghost'],
    default: 'primary',
  }
});

// Define the schema for Hero Section
const HeroSectionSchema = new Schema<IHeroSection>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      required: [true, "Subtitle is required"],
      trim: true,
    },
    longDescription: {
      type: String,
      default: '',
    },
    buttons: {
      type: [ButtonSchema],
      default: [],
      // Remove the validation that requires at least one button
      // This allows hero sections to exist without buttons
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      default: 10,
    },
    pattern: {
      type: String,
      enum: ['standard', 'dont-miss', 'brand-control', 'partner'],
      default: 'standard',
      required: true,
    },
    layoutId: {
      type: String,
      trim: true,
      default: '',
    },
    contentAlignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'center',
      required: true,
    },
    backgroundImage: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
      required: true,
    },
    titleColor: {
      type: String,
      default: '#000000',
    },
    descriptionColor: {
      type: String,
      default: '#333333',
    },
    buttonTextColor: {
      type: String,
      default: '#ffffff',
    },
    buttonBackgroundColor: {
      type: String,
      default: '#3b82f6',
    },
  },
  { 
    timestamps: true,
    // Ensure all fields in the schema are stored
    strict: true
  }
);

// Create and export the model
const HeroSection = mongoose.models.HeroSection || mongoose.model<IHeroSection>('HeroSection', HeroSectionSchema);

export default HeroSection;