'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  existingImageUrl?: string;
  label: string;
  helpText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onUploadComplete, 
  existingImageUrl = '', 
  label,
  helpText
}) => {
  const [imageUrl, setImageUrl] = useState<string>(existingImageUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be smaller than 2MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'website'); // Use a preset configured in Cloudinary

      // Upload the image to Cloudinary via our API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload failed with status: ${response.status}, Response:`, errorText);
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle the updated response format from our API route
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        onUploadComplete(data.secure_url);
      } else if (data.url) {
        setImageUrl(data.url);
        onUploadComplete(data.url);
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(`Failed to upload image: ${error.message || 'Please try again'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}>{label}</Label>
      
      <div className="flex flex-col gap-2">
        {imageUrl ? (
          <div className="relative">
            <div className="relative h-40 w-full border rounded-md overflow-hidden bg-gray-50">
              <img 
                src={imageUrl} 
                alt={`Uploaded ${label}`} 
                className="h-full w-full object-contain p-2" 
              />
            </div>
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 right-2 h-8 w-8 bg-red-600/90 hover:bg-red-700 text-white"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            {isUploading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">Click to upload {label}</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 2MB</p>
                </div>
              </>
            )}
          </div>
        )}
        
        <Input
          ref={fileInputRef}
          id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        {uploadError && (
          <p className="text-sm text-red-500 mt-1">{uploadError}</p>
        )}
        
        {helpText && (
          <p className="text-xs text-gray-500 mt-1">{helpText}</p>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;