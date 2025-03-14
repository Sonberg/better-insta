'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import ImageGallery from './ImageGallery';
import FloatingUploadButton from './FloatingUploadButton';
import UserNameDialog from './UserNameDialog';
import { uploadImage } from '@/app/actions';
import UploadDialog from './UploadDialog';

interface UploadError {
  message: string;
  timestamp: number;
}

export default function UploadGallery() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<UploadError | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragging to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setDroppedFile(file);
      setIsDialogOpen(true);
    } else {
      setError({
        message: 'Please drop an image file',
        timestamp: Date.now(),
      });
    }
  }, []);

  if (!userName) {
    return <UserNameDialog onNameSubmit={setUserName} />;
  }

  return (
    <div 
      className="relative min-h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/10 border-2 black-blue-500 border-dashed z-50 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg text-lg font-medium text-black-600">
              Drop image here to upload
            </div>
          </div>
        </div>
      )}
      <ImageGallery />
      <FloatingUploadButton onUpload={handleUpload} />
      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setDroppedFile(null);
        }}
        onUpload={handleUpload}
        initialFile={droppedFile}
      />
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