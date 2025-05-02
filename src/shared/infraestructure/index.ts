import { supabase } from './lib/supabaseClient';
import { CurrentUserResponse, SupabaseClientPort } from '../domain';

export class SupabaseClientAdapter implements SupabaseClientPort {
  async getCurrentUser(): Promise<CurrentUserResponse> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        throw error;
      }
      return { user };
    } catch (error) {
      throw error;
    }
  }
}
