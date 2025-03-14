"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import LikeButton from './LikeButton';
import { getBatchLikeStatus } from '@/app/actions/likes';
import { deleteImage } from '@/app/actions/images';
import { Trash2 } from 'lucide-react';

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
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '400px 0px',
  });
  const userName = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL = 2000; // 2 seconds

  useEffect(() => {
    userName.current = localStorage.getItem('userName');

    // Set up polling for real-time updates
    const pollLikeUpdates = async () => {
      if (!userName.current) return;

      const visibleImageIds = queryClient
        .getQueriesData<InfiniteData<ApiResponse>>({ queryKey: ['images'] })
        .flatMap(([, data]) => 
          data?.pages.flatMap(page => page.images.map(img => img.id)) ?? []
        );

      if (visibleImageIds.length === 0) return;

      try {
        const response = await fetch(
          `/api/likes/poll?ids=${visibleImageIds.join(',')}&userName=${encodeURIComponent(userName.current)}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch like updates');
        }

        const likeStatusMap = await response.json();
        
        queryClient.setQueriesData<InfiniteData<ApiResponse>>(
          { queryKey: ['images'] },
          (oldData) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                images: page.images.map((image) => {
                  const newStatus = likeStatusMap[image.id];
                  if (newStatus) {
                    return {
                      ...image,
                      likes: {
                        ...image.likes,
                        count: newStatus.count,
                        liked: newStatus.liked ? 1 : 0
                      }
                    };
                  }
                  return image;
                })
              }))
            };
          }
        );
      } catch (error) {
        console.error('Error polling like updates:', error);
      }
    };

    // Start polling when the component mounts
    const startPolling = () => {
      pollLikeUpdates(); // Initial poll
      pollingIntervalRef.current = setInterval(pollLikeUpdates, POLLING_INTERVAL);
    };

    // Stop polling when the tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      } else if (!document.hidden && !pollingIntervalRef.current) {
        startPolling();
      }
    };

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start initial polling
    startPolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [queryClient]);

  const handleDelete = useCallback(async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    const result = await deleteImage(imageId);
    if (result.success) {
      // The revalidatePath in the server action will trigger a refetch
    } else {
      alert('Failed to delete image');
    }
  }, []);

  const fetchImages = async ({ pageParam = 1 }): Promise<ApiResponse> => {
    const response = await fetch(`/api/images?page=${pageParam}`);
    const data = await response.json();
    
    // Batch fetch likes for all images on the page
    const imageIds = data.images.map((image: ImageData) => image.id);
    const likeStatusMap = await getBatchLikeStatus(imageIds, userName.current || '');
    
    // Merge like status with image data
    const imagesWithLikes = data.images.map((image: ImageData) => {
      const likeStatus = likeStatusMap[image.id] || { success: true, liked: false, count: 0 };
      return {
        ...image,
        likes: {
          count: likeStatus.count,
          liked: likeStatus.liked ? 1 : 0
        }
      };
    });

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
          <div key={image.id} className="group relative aspect-square bg-gray-100 overflow-hidden">
            <Image
              src={image.gallery_url}
              alt={image.description || 'Uploaded image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={pageIndex === 0}
            />
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <LikeButton
                imageId={image.id}
                initialLiked={Boolean(image.likes?.liked)}
                initialCount={image.likes?.count || 0}
                userName={userName.current || ''}
              />
              {userName.current === image.uploaded_by && (
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                  aria-label="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm mb-2">{image.description || 'No description'}</p>
                <div className="flex items-center">
                  <span className="text-xs">By {image.uploaded_by || 'Anonymous'}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      {hasNextPage && (
        <div 
          ref={ref} 
          className="col-span-full h-px"
          aria-hidden="true"
        />
      )}
      {isFetchingNextPage && (
        <div className="col-span-full h-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
        </div>
      )}
    </div>
  );
}
