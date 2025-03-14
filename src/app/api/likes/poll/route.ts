import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',') || [];
  const userName = searchParams.get('userName') || '';

  if (ids.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No image IDs provided' },
      { status: 400 }
    );
  }

  try {
    // Get like counts for all images
    const { data: likeCounts } = await supabase
      .from('likes')
      .select('image_id')
      .in('image_id', ids);

    // Get user's likes
    const { data: userLikes } = await supabase
      .from('likes')
      .select('image_id')
      .in('image_id', ids)
      .eq('user_name', userName);

    // Create a map of image_id to like count
    const countMap = ids.reduce((acc, id) => {
      acc[id] = (likeCounts || []).filter(like => like.image_id === id).length;
      return acc;
    }, {} as Record<string, number>);

    // Create a map of image_id to liked status
    const likedMap = (userLikes || []).reduce((acc, like) => {
      acc[like.image_id] = true;
      return acc;
    }, {} as Record<string, boolean>);

    // Combine results into a map
    const likeStatusMap = ids.reduce((acc, id) => {
      acc[id] = {
        success: true,
        liked: Boolean(likedMap[id]),
        count: countMap[id] || 0
      };
      return acc;
    }, {} as Record<string, { success: true; liked: boolean; count: number; }>);

    return NextResponse.json(likeStatusMap);
  } catch (error) {
    console.error('Error fetching like status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch like status' },
      { status: 500 }
    );
  }
} 