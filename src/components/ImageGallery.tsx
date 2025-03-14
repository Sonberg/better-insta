'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchImages } from '../services/imageService';
import { useState, useEffect, useRef } from 'react';

export default function ImageGallery() {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['images'],
    queryFn: ({ pageParam = 1 }) => fetchImages(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_more) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]));
  };

  // Reset loaded images when data changes
  useEffect(() => {
    setLoadedImages(new Set());
  }, [data]);

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  // Flatten all pages of images into a single array
  const allImages = data?.pages.flatMap(page => page.images) ?? [];

  return (
    <>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 p-4 space-y-4">
        {allImages.map((image) => (
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
      
      {/* Loading indicator and observer target */}
      <div ref={observerTarget} className="w-full py-8 flex justify-center">
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        )}
      </div>
    </>
  );
} 