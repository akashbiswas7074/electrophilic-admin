"use server";

import { connectToDatabase } from "@/lib/database/connect";
import HomeScreenOffer from "@/lib/database/models/home.screen.offers";
import cloudinary from "cloudinary";

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Helper function to convert base64 string to buffer
const base64ToBuffer = (base64: string): Buffer => {
  const base64String = base64.split(";base64,").pop();
  if (!base64String) {
    throw new Error("Invalid base64 string");
  }
  return Buffer.from(base64String, "base64");
};

export const createOffer = async (
  title: string,
  offerType: string, // Enum like 'Special Combos' or 'Crazy Deals'
  images: string[] // Array of base64 strings for image uploads
) => {
  try {
    await connectToDatabase();

    if (!title) {
      return {
        message: "Please provide a title for the offer.",
        success: false,
      };
    }
    if (!images || images.length === 0) {
      return {
        message: "Please provide at least one image for the offer.",
        success: false,
      };
    }

    // Check if offer already exists
    const existingOffer = await HomeScreenOffer.findOne({ title });
    if (existingOffer) {
      return {
        message: "Offer with this title already exists.",
        success: false,
      };
    }

    // Upload images to Cloudinary
    const uploadPromises = images.map(async (base64Image: string, index: number) => {
      try {
        const buffer = base64ToBuffer(base64Image);
        const formData = new FormData();
        formData.append("file", new Blob([buffer], { type: "image/jpeg" }));
        formData.append("upload_preset", "website");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();

        if (!response.ok || result.error) {
          console.error(`Failed to upload image ${index} for offer "${title}":`, result.error || `HTTP status ${response.status}`);
          return { error: true, message: result.error?.message || `HTTP status ${response.status}`, index, public_id: null, url: null };
        }

        return {
          url: result.secure_url,
          public_id: result.public_id,
          error: false,
          index,
          message: "",
        };
      } catch (uploadError: any) {
        console.error(`Error processing image ${index} for offer "${title}":`, uploadError);
        return { error: true, message: uploadError.message || "Unknown upload error", index, public_id: null, url: null };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);

    const successfulUploads = uploadResults.filter(r => !r.error);
    const failedUploads = uploadResults.filter(r => r.error);

    if (failedUploads.length > 0) {
      const errorMessages = failedUploads.map(f => `Image ${f.index + 1}: ${f.message}`).join('\n');
      console.error(`Some images failed to upload for offer "${title}":\n${errorMessages}`);
      return {
        message: `Offer creation partially failed. Some images could not be uploaded:\n${errorMessages}`,
        success: false,
      };
    }

    if (successfulUploads.length === 0 && images.length > 0) {
      return {
        message: "All image uploads failed for the offer.",
        success: false,
      };
    }

    const offerImages = successfulUploads.map(upload => ({
      url: upload.url,
      public_id: upload.public_id,
    }));

    // Create a new offer in the database
    await new HomeScreenOffer({
      title,
      offerType,
      images: offerImages,
    }).save();

    const offers = await HomeScreenOffer.find().sort({ updatedAt: -1 });

    return {
      message: `Offer ${title} has been successfully created.`,
      success: true,
      offers: JSON.parse(JSON.stringify(offers)),
    };
  } catch (error: any) {
    console.error("Error creating offer:", error);
    return {
      message: error.message || "An unexpected error occurred while creating the offer.",
      success: false,
    };
  }
};

// Delete an offer and its associated images from Cloudinary
export const deleteOffer = async (offerId: string) => {
  try {
    await connectToDatabase();

    const offer = await HomeScreenOffer.findById(offerId);

    if (!offer) {
      return {
        message: "Offer not found with this Id!",
        success: false,
      };
    }

    // Delete images from Cloudinary
    if (offer.images && offer.images.length > 0) {
      const imagePublicIds = offer.images.map((image: any) => image.public_id).filter(Boolean);
      if (imagePublicIds.length > 0) {
        const deleteImagePromises = imagePublicIds.map((publicId: string) =>
          cloudinary.v2.uploader.destroy(publicId)
        );
        await Promise.all(deleteImagePromises);
      }
    }

    // Delete offer document from MongoDB
    const deletionResult = await HomeScreenOffer.findByIdAndDelete(offerId);

    if (!deletionResult) {
      return {
        message: "Failed to delete offer from database, it might have been already deleted.",
        success: false,
      };
    }

    const offers = await HomeScreenOffer.find().sort({ updatedAt: -1 });

    return {
      message:
        "Successfully deleted offer and associated images from Cloudinary.",
      success: true,
      offers: JSON.parse(JSON.stringify(offers)),
    };
  } catch (error: any) {
    console.error("Error in deleteOffer:", error);
    return {
      message: `Error deleting offer: ${error.message || "Unknown server error."}`,
      success: false,
    };
  }
};

// Get all offers for the home screen
export const getAllOffers = async () => {
  try {
    await connectToDatabase();
    const offers = await HomeScreenOffer.find().sort({ updatedAt: -1 });
    return {
      offers: JSON.parse(JSON.stringify(offers)),
      message: "Successfully fetched all offers.",
      success: true,
    };
  } catch (error: any) {
    console.log(error);
  }
};

// Update the title of an offer by its ID
export const updateOffer = async (
  offerId: string,
  newTitle: string,
  newOfferType: string
) => {
  try {
    await connectToDatabase();

    // Find the offer by its ID
    const offer = await HomeScreenOffer.findById(offerId);

    if (!offer) {
      return {
        message: "Offer not found with this Id!",
        success: false,
      };
    }

    // Update the title and offer type
    offer.title = newTitle;
    offer.offerType = newOfferType;

    // Save the updated offer
    await offer.save();

    const offers = await HomeScreenOffer.find().sort({ updatedAt: -1 });

    return {
      message: "Successfully updated the offer!",
      success: true,
      offers: JSON.parse(JSON.stringify(offers)),
    };
  } catch (error: any) {
    console.log(error);
    return {
      message: "Error updating offer.",
      success: false,
    };
  }
};
