'use client';

import { useEffect, useState } from 'react';
import { Image } from '../types/images';
import { fetchImages } from '../services/imageService';

export default function ImageGallery() {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await fetchImages();
        setImages(response.images);
      } catch (err) {
        setError('Failed to load images');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

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
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {images.map((image) => (
        <div key={image.id} className="relative group overflow-hidden rounded-lg shadow-lg">
          <img
            src={image.gallery_url}
            alt={image.description}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
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