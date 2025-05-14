import { User } from '@supabase/supabase-js';

export interface CurrentUserResponse {
  user: User | null;
}
export interface PaginationType {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface SupabaseClientPort {
  getCurrentUser(): Promise<CurrentUserResponse>;
}
