'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchImages } from '../services/imageService';
import { useState, useEffect } from 'react';

export default function ImageGallery() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['images'],
    queryFn: fetchImages,
  });

  // Track loaded images to enable smooth masonry layout
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]));
  };

  // Reset loaded images when data changes
  useEffect(() => {
    setLoadedImages(new Set());
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load images
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 p-4 space-y-4">
      {data?.images.map((image) => (
        <div 
          key={image.id} 
          className={`break-inside-avoid mb-4 relative group overflow-hidden transition-opacity duration-300 ${
            loadedImages.has(image.id) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={image.gallery_url}
            alt={image.description}
            className="w-full object-cover"
            onLoad={() => handleImageLoad(image.id)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 transform translate-y-full transition-transform duration-300 group-hover:translate-y-0">
            <p className="text-sm">{image.description}</p>
            <p className="text-xs opacity-75">Uploaded by {image.uploaded_by}</p>
            <p className="text-xs opacity-75">
              {new Date(image.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 