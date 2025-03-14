'use server';

import { revalidatePath } from 'next/cache';

export async function deleteImage(imageId: string) {
  try {
    const response = await fetch(
      `https://wkuhfuofhpjuwilhhtnj.supabase.co/functions/v1/delete-image?id=${imageId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Delete image error:', error);
    return { success: false, error: 'Failed to delete image' };
  }
} 