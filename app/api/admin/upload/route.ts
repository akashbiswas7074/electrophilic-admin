import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Check if all required environment variables are set
const cloudinaryConfigured =
  process.env.CLOUDINARY_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_SECRET;

// Configure cloudinary if all environment variables are available
if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });
} else {
  console.warn('Cloudinary credentials not found. Using placeholder image service for development.');
}

export async function POST(request: Request) {
  try {
    // Process form data with file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // If cloudinary is not configured, return a placeholder image URL
    if (!cloudinaryConfigured) {
      // For development purposes, return a placeholder image URL
      const imageType = file.type.startsWith('image/') ? 'image' : 'video';
      const placeholderUrl =
        imageType === 'image'
          ? `https://placehold.co/600x400?text=${encodeURIComponent(file.name.substring(0, 20))}`
          : 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

      console.log('Using placeholder URL:', placeholderUrl);

      return NextResponse.json({
        success: true,
        url: placeholderUrl,
        publicId: 'placeholder',
      });
    }

    // If we reach here, Cloudinary is configured, so we'll use it
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hero-sections',
          resource_type: 'auto', // Automatically detect if it's an image or video
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
            return;
          }
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    // Wait for upload to complete
    console.log('Uploading to Cloudinary...');
    const result: any = await uploadPromise;
    console.log('Upload successful:', result.secure_url);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}