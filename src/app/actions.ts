'use server';

import { revalidatePath } from 'next/cache';

interface UploadMetadata {
  description: string;
  uploadedBy: string;
}

export async function uploadImage(formData: FormData) {
  try {
    const image = formData.get('image') as File;
    const metadataStr = formData.get('metadata') as string;
    const metadata: UploadMetadata = JSON.parse(metadataStr);

    // Validate file size (max 6MB to be safe with Edge Function limits)
    const maxSize = 6 * 1024 * 1024; // 6MB in bytes
    if (image.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 6MB limit'
      };
    }

    // Create a new FormData instance for the external API
    const apiFormData = new FormData();
    apiFormData.append('image', image);
    apiFormData.append('metadata', JSON.stringify(metadata));

    const response = await fetch('https://wkuhfuofhpjuwilhhtnj.supabase.co/functions/v1/upload-image', {
      method: 'POST',
      body: apiFormData,
    });

    // Handle specific error status codes
    if (response.status === 413) {
      return {
        success: false,
        error: 'File size too large for the server'
      };
    }

    if (response.status === 504) {
      return {
        success: false,
        error: 'Upload timed out. Please try again with a smaller file'
      };
    }

    if (response.status === 546) {
      return {
        success: false,
        error: 'Server resource limit reached. Please try again'
      };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Upload failed with status:', response.status, errorData);
      throw new Error(errorData?.message || `Upload failed with status ${response.status}`);
    }

    // Validate response format
    const result = await response.json();
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response format from server');
    }
    
    // Revalidate the page to show new images
    revalidatePath('/');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
} 