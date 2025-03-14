"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchImages } from "../services/imageService";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function ImageGallery() {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["images"],
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
    setLoadedImages((prev) => new Set([...prev, imageId]));
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
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[3/4]">
            <div className="w-full h-full  bg-background shadow-sm overflow-hidden">
              <div className="animate-pulse bg-muted h-full w-full" />
              <div className="p-4">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">Failed to load images</div>
    );
  }

  // Flatten all pages of images into a single array
  const allImages = data?.pages.flatMap((page) => page.images) ?? [];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {allImages.map((image, index) => (
          <div
            key={image.id}
            className={`transition-opacity duration-300 ${
              loadedImages.has(image.id) ? "opacity-100" : "opacity-0"
            }`}
            style={{ minHeight: loadedImages.has(image.id) ? "auto" : "300px" }}
          >
            <div className="bg-background overflow-hidden">
              <div className="relative aspect-[3/4]">
                <Image
                  src={image.gallery_url}
                  alt={image.description}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={75}
                  priority={index < 3}
                  onLoad={() => handleImageLoad(image.id)}
                  className="object-cover"
                />
              </div>
              <div className="p-4 flex flex-col gap-1">
                <p className="text-sm font-medium">{image.description}</p>
                <p className="text-xs text-muted-foreground">
                  Uploaded by {image.uploaded_by}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator and observer target */}
      <div ref={observerTarget} className="w-full py-8 flex justify-center mb-48">
        {isFetchingNextPage && (
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-1 border-gray-900"></div>
        )}
      </div>
    </>
  );
}
