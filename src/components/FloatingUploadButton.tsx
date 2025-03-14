'use client';

import { useState } from 'react';

interface FloatingUploadButtonProps {
  onUpload: (file: File) => void;
}

export default function FloatingUploadButton({ onUpload }: FloatingUploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
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
        className={`flex items-center justify-center w-14 h-14 bg-blue-500 hover:bg-blue-600 
          rounded-full shadow-lg cursor-pointer transition-colors duration-200
          ${isDragging ? 'ring-4 ring-blue-300' : ''}`}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
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
      </label>
    </div>
  );
} 