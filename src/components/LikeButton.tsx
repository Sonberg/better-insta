'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import type { ImageData, ApiResponse } from '@/types';

interface LikeButtonProps {
  imageId: string;
  initialLiked: boolean;
  initialCount: number;
  userName: string;
  onHeartRef?: (el: SVGSVGElement | null) => void;
}

export default function LikeButton({ imageId, initialLiked, initialCount, userName, onHeartRef }: LikeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const heartIconRef = useRef<SVGSVGElement>(null);
  const queryClient = useQueryClient();
  const [optimisticLiked, setOptimisticLiked] = useState(initialLiked);
  const [optimisticCount, setOptimisticCount] = useState(initialCount);

  // Forward the heart icon ref to parent
  useEffect(() => {
    onHeartRef?.(heartIconRef.current);
    return () => onHeartRef?.(null);
  }, [onHeartRef]);

  const handleClick = useCallback(async () => {
    if (!userName) {
      alert('Please set your username first');
      return;
    }

    // Optimistically update UI
    const newLiked = !optimisticLiked;
    const newCount = optimisticCount + (newLiked ? 1 : -1);
    setOptimisticLiked(newLiked);
    setOptimisticCount(newCount);

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          userName,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Revert optimistic update on failure
        setOptimisticLiked(initialLiked);
        setOptimisticCount(initialCount);
        throw new Error('Failed to update like');
      }

      // Update the cache with the server response
      queryClient.setQueriesData<InfiniteData<ApiResponse>>(
        { queryKey: ['images'] },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              images: page.images.map((image: ImageData) => {
                if (image.id === imageId) {
                  return {
                    ...image,
                    likes: {
                      count: result.count,
                      liked: result.liked ? 1 : 0
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
      console.error('Failed to update like:', error);
      // UI has already been reverted above in case of failure
    }
  }, [imageId, userName, optimisticLiked, optimisticCount, initialLiked, initialCount, queryClient]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`group flex items-center gap-1.5 py-1 px-1.5 rounded-full transition-all duration-200
        ${optimisticLiked
          ? 'bg-red-500/10 hover:bg-red-500/20'
          : 'bg-black/10 hover:bg-black/20'
        }`}
      aria-label={optimisticLiked ? 'Unlike image' : 'Like image'}
    >
      <Heart
        ref={heartIconRef}
        className={`w-3.5 h-3.5 transition-colors duration-200 
          ${optimisticLiked 
            ? 'text-red-500 fill-red-500' 
            : 'text-white group-hover:text-white'
          }`}
      />
      <span className={`text-xs font-medium min-w-[1rem] transition-colors duration-200
        ${optimisticLiked 
          ? 'text-red-500' 
          : 'text-white group-hover:text-white'
        }`}
      >
        {optimisticCount}
      </span>
    </button>
  );
} 