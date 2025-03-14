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

    // Create a new FormData instance for the external API
    const apiFormData = new FormData();
    apiFormData.append('image', image);
    apiFormData.append('metadata', JSON.stringify(metadata));

    const response = await fetch('https://wkuhfuofhpjuwilhhtnj.supabase.co/functions/v1/upload-image', {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Upload failed');
    }

    const result = await response.json();
    
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