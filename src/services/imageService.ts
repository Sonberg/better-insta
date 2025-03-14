import { ImagesResponse } from '../types/images';

export async function fetchImages(): Promise<ImagesResponse> {
  const response = await fetch('/api/images');
  
  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }

  return response.json();
} 