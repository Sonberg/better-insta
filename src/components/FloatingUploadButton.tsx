'use client';

import { useState } from 'react';

interface FloatingUploadButtonProps {
  onUpload: (file: File) => Promise<void>;
}

export default function FloatingUploadButton({ onUpload }: FloatingUploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        await onUpload(file);
      } finally {
        setIsUploading(false);
        // Reset the input value to allow uploading the same file again
        event.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        await onUpload(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 ${
        isDragging ? 'scale-110' : 'scale-100'
      } transition-transform duration-200`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label
        htmlFor="file-upload"
        className={`flex items-center justify-center w-14 h-14 
          ${isUploading ? 'bg-blue-400 cursor-wait' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'}
          rounded-full shadow-lg transition-colors duration-200
          ${isDragging ? 'ring-4 ring-blue-300' : ''}`}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin" />
        ) : (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        )}
      </label>
    </div>
  );
} 