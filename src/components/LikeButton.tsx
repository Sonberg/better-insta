'use client';

import { useRef, useCallback, useState } from 'react';
import { Heart } from 'lucide-react';
import { useConfetti } from '@/hooks/useConfetti';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import type { ImageData, ApiResponse } from '@/types';

interface LikeButtonProps {
  imageId: string;
  initialLiked: boolean;
  initialCount: number;
  userName: string;
}

export default function LikeButton({ imageId, initialLiked, initialCount, userName }: LikeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { showConfetti } = useConfetti();
  const queryClient = useQueryClient();
  const [optimisticLiked, setOptimisticLiked] = useState(initialLiked);
  const [optimisticCount, setOptimisticCount] = useState(initialCount);

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

    // Show confetti immediately for likes
    if (newLiked && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      showConfetti(x, y);
    }

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
  }, [imageId, userName, optimisticLiked, optimisticCount, initialLiked, initialCount, showConfetti, queryClient]);

  return (
    <div className="flex items-center gap-2">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`p-2 rounded-full transition-colors ${
          optimisticLiked
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-white/90 hover:bg-white'
        }`}
        aria-label={optimisticLiked ? 'Unlike image' : 'Like image'}
      >
        <Heart
          className={`w-4 h-4 ${optimisticLiked ? 'text-white fill-current' : 'text-gray-700'}`}
        />
        <span className="sr-only">{optimisticCount} likes</span>
      </button>
      <span className="text-sm font-medium text-white bg-black/50 px-2 py-1 rounded-full">
        {optimisticCount}
      </span>
    </div>
  );
} 