'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchImages } from '../services/imageService';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

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
    return null;
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
        {allImages.map((image, index) => (
          <div 
            key={image.id} 
            className={`break-inside-avoid mb-4 transition-opacity duration-300 ${
              loadedImages.has(image.id) ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ minHeight: loadedImages.has(image.id) ? 'auto' : '300px' }}
          >
            <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
              <div className="relative w-full">
                <Image
                  src={image.gallery_url}
                  alt={image.description}
                  width={800}
                  height={600}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={75}
                  priority={index < 3}
                  onLoad={() => handleImageLoad(image.id)}
                  className="w-full"
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                  }}
                />
              </div>
              <div className="p-4 flex flex-col gap-1">
                <p className="text-sm font-medium">{image.description}</p>
                <p className="text-xs text-muted-foreground">Uploaded by {image.uploaded_by}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>
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