import { User } from '@supabase/supabase-js';
import { MediaItem } from '../../../shared/infraestructure/lib/types/media.types';

export interface ProfileFormData {
  username: string | null;
  bio: string | null;
  avatar_url?: string | null;
  user_id: string;
}

export interface ProfileResponse extends Omit<ProfileFormData, 'avatar_url'> {
  user_id: string;
  updated_at?: string;
  avatar_url: string | null;
  bio: string;
}

export interface GetUserLogInput {
  profileId: string;
  type: string;
}

export interface GetUserLogResponse {
  // Renamed from SearchMovieSuccess
  page: number;
  results: MediaItem[]; // Use the generic MediaItem
  total_pages: number;
  total_results: number;
}

export interface UserPort {
  //   getUserProfile(userId: string): Promise<User>;
  updateUserProfile(formData: ProfileFormData): Promise<ProfileResponse>;
  getUserLog(input: GetUserLogInput): Promise<GetUserLogResponse>;
}
