'use client';

import ImageGallery from '@/components/ImageGallery';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import { useQueryClient } from '@tanstack/react-query';

export default function Home() {
  const queryClient = useQueryClient();

  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Add metadata
      const metadata = {
        description: file.name.split('.')[0], // Use filename as default description
        uploadedBy: 'user' // You might want to replace this with actual user info
      };
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('https://wkuhfuofhpjuwilhhtnj.supabase.co/functions/v1/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // Invalidate and refetch images query to show new image
      await queryClient.invalidateQueries({ queryKey: ['images'] });
    } catch (error) {
      console.error('Upload error:', error);
      // You might want to add proper error handling/notification here
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <ImageGallery />
      <FloatingUploadButton onUpload={handleUpload} />
    </main>
  );
}
