"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import LikeButton from './LikeButton';
import { deleteImage } from '@/app/actions/images';
import { Trash2, Expand } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useConfetti } from '@/hooks/useConfetti';
import ImageDialog from './ImageDialog';
import type { ImageData, ApiResponse } from '@/types';

interface LikeRecord {
  id: string;
  image_id: string;
  user_name: string;
  created_at: string;
}

// Type guard to check if an object is a LikeRecord
function isLikeRecord(obj: unknown): obj is LikeRecord {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'image_id' in obj &&
    'user_name' in obj
  );
}

export default function ImageGallery() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '400px 0px',
  });
  const userName = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { showConfetti } = useConfetti();
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const heartIconRefs = useRef<Map<string, SVGSVGElement>>(new Map());
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  useEffect(() => {
    userName.current = localStorage.getItem('userName');

    // Set up realtime subscription for likes
    const subscription = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'likes',
        },
        async (payload: RealtimePostgresChangesPayload<LikeRecord>) => {
          // Only show confetti for new likes (INSERT), never for unlikes (DELETE)
          // This ensures confetti only appears when someone likes an image
          if (payload.eventType === 'INSERT' && isLikeRecord(payload.new)) {
            // Skip confetti for our own likes (those are handled in LikeButton)
            if (payload.new.user_name === userName.current) return;

            // Find the heart icon element and show confetti from its position
            const heartIcon = heartIconRefs.current.get(payload.new.image_id);
            if (heartIcon) {
              const rect = heartIcon.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              showConfetti(x, y);
            }
          }

          const record = payload.new || payload.old;
          if (!isLikeRecord(record)) return;

          // Fetch updated like status for the affected image
          const response = await fetch(
            `/api/likes?ids=${record.image_id}&userName=${encodeURIComponent(userName.current || '')}`
          );
          
          if (!response.ok) return;
          
          const likeStatusMap = await response.json();
          
          // Update the cache with new like status
          queryClient.setQueriesData<InfiniteData<ApiResponse>>(
            { queryKey: ['images'] },
            (oldData) => {
              if (!oldData) return oldData;
              
              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  images: page.images.map((image) => {
                    if (image.id === record.image_id) {
                      const newStatus = likeStatusMap[record.image_id];
                      return {
                        ...image,
                        likes: {
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
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      imageRefs.current.clear();
      heartIconRefs.current.clear();
    };
  }, [queryClient, showConfetti]);

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
    
    // Get initial like status
    const imageIds = data.images.map((image: ImageData) => image.id);
    const likeResponse = await fetch(
      `/api/likes?ids=${imageIds.join(',')}&userName=${encodeURIComponent(userName.current || '')}`
    );
    const likeStatusMap = await likeResponse.json();
    
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
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="relative aspect-square bg-gray-100 overflow-hidden animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return <div>Error loading images</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {data.pages.map((page, pageIndex) =>
          page.images.map((image) => (
            <div 
              key={image.id} 
              className="group relative aspect-square bg-gray-100 overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(image)}
              ref={(el) => {
                if (el) {
                  imageRefs.current.set(image.id, el);
                } else {
                  imageRefs.current.delete(image.id);
                }
              }}
            >
              <Image
                src={image.gallery_url}
                alt={image.description || 'Uploaded image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={pageIndex === 0}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200">
                <button
                  className="p-3 rounded-full bg-black/50 text-white transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200"
                  aria-label="View full image"
                >
                  <Expand className="w-6 h-6" />
                </button>
              </div>
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <LikeButton
                    key={`${image.id}-${image.likes?.count}-${image.likes?.liked}`}
                    imageId={image.id}
                    initialLiked={Boolean(image.likes?.liked)}
                    initialCount={image.likes?.count || 0}
                    userName={userName.current || ''}
                    onHeartRef={(el) => {
                      if (el) {
                        heartIconRefs.current.set(image.id, el);
                      } else {
                        heartIconRefs.current.delete(image.id);
                      }
                    }}
                  />
                </div>
                {userName.current === image.uploaded_by && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent image dialog from opening
                      handleDelete(image.id);
                    }}
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

      {selectedImage && (
        <ImageDialog
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.original_url}
          description={selectedImage.description || 'Uploaded image'}
        />
      )}
    </>
  );
}
