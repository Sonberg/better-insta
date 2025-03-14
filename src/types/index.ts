export interface ImageData {
  id: string;
  description: string;
  uploaded_by: string;
  created_at: string;
  original_url: string;
  gallery_url: string;
  thumbnail_url: string;
  likes?: {
    count: number | null;
    liked: number;
  };
}

export interface ApiResponse {
  images: ImageData[];
  pagination: {
    has_more: boolean;
    current_page: number;
    total_pages: number;
  };
} 