'use client';

import { useRef, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useConfetti } from '@/hooks/useConfetti';
import { useQueryClient } from '@tanstack/react-query';

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

  const handleClick = useCallback(async () => {
    if (!userName) {
      alert('Please set your username first');
      return;
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

      if (result.success) {
        // Show confetti only when liking (not unliking)
        if (!initialLiked && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          showConfetti(x, y);
        }

        // Invalidate the query to trigger a refetch
        queryClient.invalidateQueries({ queryKey: ['images'] });
      }
    } catch (error) {
      console.error('Failed to update like:', error);
    }
  }, [imageId, userName, initialLiked, showConfetti, queryClient]);

  return (
    <div className="flex items-center gap-2">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`p-2 rounded-full transition-colors ${
          initialLiked
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-white/90 hover:bg-white'
        }`}
        aria-label={initialLiked ? 'Unlike image' : 'Like image'}
      >
        <Heart
          className={`w-4 h-4 ${initialLiked ? 'text-white fill-current' : 'text-gray-700'}`}
        />
        <span className="sr-only">{initialCount} likes</span>
      </button>
      <span className="text-sm font-medium text-white bg-black/50 px-2 py-1 rounded-full">
        {initialCount}
      </span>
    </div>
  );
} 