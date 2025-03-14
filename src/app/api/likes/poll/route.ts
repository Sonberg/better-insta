import { redis } from '@/lib/redis';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const imageIds = request.nextUrl.searchParams.get('ids')?.split(',') || [];
  const userName = request.nextUrl.searchParams.get('userName') || '';

  if (imageIds.length === 0) {
    return Response.json({ error: 'No image IDs provided' }, { status: 400 });
  }

  try {
    // Create arrays of promises for both likes count and user like status
    const likesCountPromises = imageIds.map(id => 
      redis.get<number>(`image:${id}:likes`).then(count => count || 0)
    );
    
    const userLikePromises = imageIds.map(id => 
      redis.sismember(`image:${id}:likedBy`, userName).then(result => Boolean(result))
    );

    // Execute all promises in parallel
    const [likeCounts, userLikes] = await Promise.all([
      Promise.all(likesCountPromises),
      Promise.all(userLikePromises)
    ]);

    // Combine results into a map
    const likeStatusMap = imageIds.reduce((acc, id, index) => {
      acc[id] = {
        success: true,
        liked: userLikes[index],
        count: likeCounts[index]
      };
      return acc;
    }, {} as Record<string, { success: true; liked: boolean; count: number; }>);

    return Response.json(likeStatusMap);
  } catch (error) {
    console.error('Error fetching like status:', error);
    return Response.json({ error: 'Failed to fetch like status' }, { status: 500 });
  }
} 