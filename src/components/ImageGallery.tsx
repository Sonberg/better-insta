"use client";

import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import LikeButton from './LikeButton';
import { getLikeStatus } from '@/app/actions/likes';

interface ImageData {
  id: string;
  description: string;
  uploaded_by: string;
  created_at: string;
  original_url: string;
  gallery_url: string;
  thumbnail_url: string;
  likes?: {
    count: number | null;
    liked: number;
  };
}

interface ApiResponse {
  images: ImageData[];
  pagination: {
    has_more: boolean;
    current_page: number;
    total_pages: number;
  };
}

export default function ImageGallery() {
  const { ref, inView } = useInView();
  const userName = useRef<string | null>(null);

  useEffect(() => {
    userName.current = localStorage.getItem('userName');
  }, []);

  const fetchImages = async ({ pageParam = 1 }): Promise<ApiResponse> => {
    const response = await fetch(`/api/images?page=${pageParam}`);
    const data = await response.json();
    
    // Fetch like status for each image
    const imagesWithLikes = await Promise.all(
      data.images.map(async (image: ImageData) => {
        const likeStatus = await getLikeStatus(image.id, userName.current || '');
        return {
          ...image,
          likes: {
            count: likeStatus.success ? likeStatus.count : 0,
            liked: likeStatus.success ? (likeStatus.liked ? 1 : 0) : 0
          }
        };
      })
    );

    return {
      images: imagesWithLikes,
      pagination: data.pagination
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['images'],
    queryFn: fetchImages,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.has_more) return undefined;
      return lastPage.pagination.current_page + 1;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="relative aspect-square bg-gray-100 overflow-hidden animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return <div>Error loading images</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {data.pages.map((page, pageIndex) =>
        page.images.map((image) => (
          <div key={image.id} className="relative aspect-square bg-gray-100 overflow-hidden">
            <Image
              src={image.gallery_url}
              alt={image.description || 'Uploaded image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={pageIndex === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm mb-2">{image.description || 'No description'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs">By {image.uploaded_by || 'Anonymous'}</span>
                  <LikeButton
                    imageId={image.id}
                    initialLiked={Boolean(image.likes?.liked)}
                    initialCount={image.likes?.count || 0}
                    userName={userName.current || ''}
                  />
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={ref} className="col-span-full h-20 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
        )}
      </div>
    </div>
  );
}
