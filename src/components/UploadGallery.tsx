'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import ImageGallery from './ImageGallery';
import FloatingUploadButton from './FloatingUploadButton';
import UserNameDialog from './UserNameDialog';
import { uploadImage } from '@/app/actions';

interface UploadError {
  message: string;
  timestamp: number;
}

export default function UploadGallery() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<UploadError | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleUpload = async (file: File, description: string) => {
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
        description,
        uploadedBy: userName
      };
      formData.append('metadata', JSON.stringify(metadata));

      const result = await uploadImage(formData);

      if (!result.success) {
        throw new Error(result.error);
      }

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

  if (!userName) {
    return <UserNameDialog onNameSubmit={setUserName} />;
  }

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