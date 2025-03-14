-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Add unique constraint to prevent duplicate likes
  CONSTRAINT unique_image_user_like UNIQUE (image_id, user_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_likes_image_id ON likes(image_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_name ON likes(user_name); 