import { ImagesResponse } from '../types/images';

export async function fetchImages(page: number = 1): Promise<ImagesResponse> {
  const response = await fetch(`/api/images?page=${page}&limit=16`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }

  return response.json();
} 