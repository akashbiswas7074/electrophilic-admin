// File: /home/akashbiswas7797/Desktop/vibecart-admin/co-pal-ecom-admin/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true, // Use https
});

// Helper function to convert ReadableStream to Buffer
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadPreset = formData.get('upload_preset') as string | 'website'; // Default preset if needed

    if (!file) {
      console.error("API Route Error: No file provided in form data.");
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    console.log(`API Route: Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    console.log(`API Route: Using upload preset: ${uploadPreset}`);
    console.log(`API Route: Using cloud name: ${process.env.CLOUDINARY_NAME ? '******' : 'NOT FOUND'}`); // Check if env var is loaded

    // Convert file stream to buffer
    const fileBuffer = await streamToBuffer(file.stream());
    console.log(`API Route: File converted to buffer, length: ${fileBuffer.length}`);

    // Upload using Cloudinary SDK
    console.log("API Route: Attempting Cloudinary upload...");
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: uploadPreset,
          resource_type: 'auto', // Detect resource type automatically
        },
        (error, result) => {
          if (error) {
            console.error('API Route Cloudinary SDK Error:', error);
            // Return a structured error response
            reject({ error: error.message || 'Cloudinary SDK upload failed' });
          } else {
            console.log("API Route: Cloudinary upload successful:", result?.secure_url);
            resolve(result);
          }
        }
      );
      // Pipe buffer to Cloudinary stream
      const readableStream = new Readable();
      readableStream._read = () => {}; // _read is required
      readableStream.push(fileBuffer);
      readableStream.push(null); // Signal end of stream
      readableStream.pipe(uploadStream);
    });

    // Return the successful Cloudinary response
    return NextResponse.json(uploadResult);

  } catch (error: any) {
    console.error('API Route General Error:', error);
    // Ensure a JSON response even for caught errors
    return NextResponse.json(
        { error: error.error || error.message || 'Internal Server Error during upload' }, // Use error.error if it came from the promise reject
        { status: 500 }
    );
  }
}

// Optional: Add a GET handler for testing the route exists
export async function GET() {
  return NextResponse.json({ message: "Upload API route is active." });
}