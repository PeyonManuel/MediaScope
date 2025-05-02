// src/types/supabase.ts
export interface WatchedItem {
  id: number; // Or string if UUID
  user_id: string;
  movie_id: number;
  rating: number | null; // Assuming 1-10 scale for 0.5 stars
  review: string | null;
  liked: boolean | null;
  watched_date: string | null; // Date string "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}
