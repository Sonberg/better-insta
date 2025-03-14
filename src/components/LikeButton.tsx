'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { likeImage } from '@/app/actions/likes';

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
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLike = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const result = await likeImage(imageId, userName);
      
      if (result.success && typeof result.liked === 'boolean') {
        setIsLiked(result.liked);
        setLikeCount(prev => result.liked ? prev + 1 : prev - 1);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isUpdating}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full 
        transition-all duration-200 ${
        isLiked 
          ? 'bg-red-100 text-red-500 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Heart
        className={`w-4 h-4 ${
          isLiked ? 'fill-current' : 'fill-none'
        } ${isUpdating ? 'animate-pulse' : ''}`}
      />
      <span className="text-sm font-medium">
        {likeCount}
      </span>
    </button>
  );
} 