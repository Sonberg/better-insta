'use client';

import ImageGallery from '@/components/ImageGallery';
import FloatingUploadButton from '@/components/FloatingUploadButton';

export default function Home() {
  const handleUpload = async (file: File) => {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('image', file);

      // Send the file to your API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Handle successful upload
      // You might want to refresh the image gallery or show a success message
      console.log('Upload successful');
    } catch (error) {
      console.error('Upload error:', error);
      // Handle error (show error message to user)
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <ImageGallery />
      <FloatingUploadButton onUpload={handleUpload} />
    </main>
  );
}
