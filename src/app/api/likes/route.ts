import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { imageId, userName } = await request.json();

    if (!imageId || !userName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has already liked the image
    const { data: existingLike } = await supabase
      .from('likes')
      .select()
      .eq('image_id', imageId)
      .eq('user_name', userName)
      .single();

    if (existingLike) {
      // Unlike: Delete the like record
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('image_id', imageId)
        .eq('user_name', userName);

      if (deleteError) throw deleteError;

      // Get updated like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('image_id', imageId);

      return NextResponse.json({
        success: true,
        liked: false,
        count: count || 0,
      });
    } else {
      // Like: Insert new like record
      const { error: insertError } = await supabase
        .from('likes')
        .insert([
          {
            image_id: imageId,
            user_name: userName,
          },
        ]);

      if (insertError) throw insertError;

      // Get updated like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('image_id', imageId);

      return NextResponse.json({
        success: true,
        liked: true,
        count: count || 0,
      });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];
    const userName = searchParams.get('userName') || '';

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image IDs provided' },
        { status: 400 }
      );
    }

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

    // Combine the results
    const result = ids.reduce((acc, id) => {
      acc[id] = {
        liked: Boolean(likedMap[id]),
        count: countMap[id] || 0,
      };
      return acc;
    }, {} as Record<string, { liked: boolean; count: number }>);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 