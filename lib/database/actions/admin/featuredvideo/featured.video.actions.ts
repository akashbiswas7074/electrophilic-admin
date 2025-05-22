"use server";

import { connectToDatabase } from "@/lib/database/connect";
import FeaturedVideo, { IFeaturedVideo } from "@/lib/database/models/featured.video.model";
import { revalidatePath } from "next/cache";

// Helper to handle errors
const handleError = (error: unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
  console.error(`[FEATURED_VIDEO_ACTION_ERROR${context ? ` - ${context}` : ''}]: ${errorMessage}`, error);
  return { success: false, message: errorMessage };
};

// Get all featured videos for the admin panel
export async function getAllFeaturedVideosForAdmin(): Promise<{ success: boolean; videos: IFeaturedVideo[] | null; message?: string }> {
  try {
    await connectToDatabase();
    const videos = await FeaturedVideo.find().sort({ createdAt: -1 }); // Sort by newest first
    if (!videos || videos.length === 0) {
      return { success: true, videos: [], message: "No featured videos found." };
    }
    return { success: true, videos: JSON.parse(JSON.stringify(videos)) };
  } catch (error) {
    const errResponse = handleError(error, "getAllFeaturedVideosForAdmin");
    return { ...errResponse, videos: null };
  }
}

// Add a new featured video
export async function addFeaturedVideo(
  youtubeLink: string,
  description: string,
  isActive: boolean = true // Default to active
): Promise<{ success: boolean; message: string; video: IFeaturedVideo | null }> {
  try {
    await connectToDatabase();

    if (!youtubeLink || !description) {
      return { success: false, message: "YouTube link and description are required.", video: null };
    }

    const newVideo = new FeaturedVideo({
      youtubeLink,
      description,
      isActive,
    });

    await newVideo.save();
    
    revalidatePath("/"); 
    revalidatePath("/admin/dashboard/featuredyoutube");

    return {
      success: true,
      message: "Featured video added successfully.",
      video: JSON.parse(JSON.stringify(newVideo)),
    };
  } catch (error) {
    const errResponse = handleError(error, "addFeaturedVideo");
    return { ...errResponse, video: null };
  }
}

// Update an existing featured video
export async function updateFeaturedVideo(
  videoId: string,
  updates: Partial<Pick<IFeaturedVideo, 'youtubeLink' | 'description' | 'isActive'>>
): Promise<{ success: boolean; message: string; video: IFeaturedVideo | null }> {
  try {
    await connectToDatabase();

    if (!videoId) {
      return { success: false, message: "Video ID is required to update.", video: null };
    }
    if (Object.keys(updates).length === 0) {
        return { success: false, message: "No updates provided.", video: null };
    }

    const video = await FeaturedVideo.findByIdAndUpdate(
      videoId,
      updates,
      { new: true, runValidators: true }
    );

    if (!video) {
      return { success: false, message: "Failed to find and update the video.", video: null };
    }
    
    revalidatePath("/"); 
    revalidatePath("/admin/dashboard/featuredyoutube");

    return {
      success: true,
      message: "Featured video updated successfully.",
      video: JSON.parse(JSON.stringify(video)),
    };
  } catch (error) {
    const errResponse = handleError(error, "updateFeaturedVideo");
    return { ...errResponse, video: null };
  }
}

// Delete a featured video
export async function deleteFeaturedVideo(
  videoId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();

    if (!videoId) {
      return { success: false, message: "Video ID is required to delete." };
    }

    const deletedVideo = await FeaturedVideo.findByIdAndDelete(videoId);

    if (!deletedVideo) {
      return { success: false, message: "Featured video not found or already deleted." };
    }
    
    revalidatePath("/"); 
    revalidatePath("/admin/dashboard/featuredyoutube");

    return {
      success: true,
      message: "Featured video deleted successfully.",
    };
  } catch (error) {
    return handleError(error, "deleteFeaturedVideo");
  }
}