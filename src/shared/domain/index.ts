import { User } from '@supabase/supabase-js';

export interface CurrentUserResponse {
  user: User | null;
}

export interface SupabaseClientPort {
  getCurrentUser(): Promise<CurrentUserResponse>;
}
