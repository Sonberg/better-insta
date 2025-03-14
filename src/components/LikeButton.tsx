'use client';

import { useState, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';
import { likeImage } from '@/app/actions/likes';
import { useConfetti } from '@/hooks/useConfetti';

interface LikeButtonProps {
  imageId: string;
  initialLiked: boolean;
  initialCount: number;
  userName: string;
}

export default function LikeButton({ 
  imageId, 
  initialLiked, 
  initialCount, 
  userName 
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { showConfetti } = useConfetti();

  const handleClick = useCallback(async () => {
    if (!userName || isLoading) return;

    setIsLoading(true);
    try {
      const result = await likeImage(imageId, userName);
      if (result.success) {
        const newLiked = Boolean(result.liked);
        setLiked(newLiked);
        setCount(prev => newLiked ? prev + 1 : prev - 1);

        // Show confetti only when liking (not unliking)
        if (newLiked && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          showConfetti(x, y);
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
    } finally {
      setIsLoading(false);
    }
  }, [imageId, userName, isLoading, showConfetti]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={!userName || isLoading}
      className={`p-2 rounded-full transition-colors ${
        liked
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white text-gray-600 hover:bg-gray-100'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={liked ? 'Unlike image' : 'Like image'}
    >
      <Heart
        className={`w-4 h-4 ${liked ? 'fill-current' : ''} ${
          isLoading ? 'animate-pulse' : ''
        }`}
      />
      <span className="sr-only">{count} likes</span>
    </button>
  );
} 