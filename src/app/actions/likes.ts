'use server';

import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';

export async function likeImage(imageId: string, userName: string) {
  try {
    const key = `image:${imageId}:likes`;
    const userLikeKey = `image:${imageId}:likedBy`;

    // Check if user already liked the image
    const hasLiked = await redis.sismember(userLikeKey, userName);
    
    if (hasLiked) {
      // Unlike: Remove user from set and decrease count
      await redis.srem(userLikeKey, userName);
      await redis.decr(key);
      revalidatePath('/');
      return { success: true, liked: false };
    } else {
      // Like: Add user to set and increase count
      await redis.sadd(userLikeKey, userName);
      await redis.incr(key);
      revalidatePath('/');
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error('Like error:', error);
    return { success: false, error: 'Failed to update like' };
  }
}

export async function getLikeStatus(imageId: string, userName: string) {
  try {
    const userLikeKey = `image:${imageId}:likedBy`;
    const likesKey = `image:${imageId}:likes`;

    const [hasLiked, likesCount] = await Promise.all([
      redis.sismember(userLikeKey, userName),
      redis.get<number>(likesKey) || 0
    ]);

    return {
      success: true,
      liked: hasLiked,
      count: likesCount
    };
  } catch (error) {
    console.error('Get likes error:', error);
    return { success: false, error: 'Failed to get like status' };
  }
} 