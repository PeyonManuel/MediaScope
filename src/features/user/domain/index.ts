import { User } from '@supabase/supabase-js';

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

export interface UserPort {
  //   getUserProfile(userId: string): Promise<User>;
  updateUserProfile(formData: ProfileFormData): Promise<ProfileResponse>;
}
