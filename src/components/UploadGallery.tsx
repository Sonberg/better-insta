'use client';

import { useQueryClient } from '@tanstack/react-query';
import ImageGallery from './ImageGallery';
import FloatingUploadButton from './FloatingUploadButton';
import { useState } from 'react';

interface UploadError {
  message: string;
  timestamp: number;
}

export default function UploadGallery() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<UploadError | null>(null);

  const handleUpload = async (file: File) => {
    try {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      const formData = new FormData();
      formData.append('image', file);
      
      // Add metadata
      const metadata = {
        description: file.name.split('.')[0], // Use filename as default description
        uploadedBy: 'user' // You might want to replace this with actual user info
      };
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('https://wkuhfuofhpjuwilhhtnj.supabase.co/functions/v1/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // Clear any existing error
      setError(null);

      // Invalidate and refetch images query to show new image
      await queryClient.invalidateQueries({ queryKey: ['images'] });
    } catch (error) {
      console.error('Upload error:', error);
      setError({
        message: error instanceof Error ? error.message : 'Failed to upload image',
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="relative">
      <ImageGallery />
      <FloatingUploadButton onUpload={handleUpload} />
      {error && (
        <div 
          className="fixed bottom-24 right-6 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
          key={error.timestamp}
        >
          {error.message}
        </div>
      )}
    </div>
  );
} 