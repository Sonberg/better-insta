'use client';

import { useState } from 'react';
import UploadDialog from './UploadDialog';

interface FloatingUploadButtonProps {
  onUpload: (file: File, description: string) => Promise<void>;
}

export default function FloatingUploadButton({ onUpload }: FloatingUploadButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    setIsDialogOpen(true);
  };

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 z-50 ${
          isDragging ? 'scale-110' : 'scale-100'
        } transition-transform duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          onClick={() => setIsDialogOpen(true)}
          className={`flex items-center justify-center w-14 h-14 
            bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600
            hover:from-blue-500 hover:via-blue-600 hover:to-purple-700
            rounded-full shadow-lg cursor-pointer transition-all duration-300
            hover:shadow-blue-500/25 hover:shadow-xl
            ${isDragging ? 'ring-4 ring-blue-300 animate-pulse' : ''}`}
          style={{
            backgroundSize: '200% 200%',
            animation: 'gradient 5s ease infinite'
          }}
        >
          <svg
            className="w-6 h-6 text-white drop-shadow"
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
        </button>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUpload={onUpload}
      />
    </>
  );
} 