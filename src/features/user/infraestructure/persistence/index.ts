import { ProfileFormData, ProfileResponse, UserPort } from '../../domain';
import { supabase } from '../../../../lib/supabaseClient';

export class SupabaseUserAdapter implements UserPort {
  async updateUserProfile(formData: ProfileFormData): Promise<ProfileResponse> {
    const { data, error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('user_id', formData.user_id)
      .select('user_id, username, bio, updated_at, avatar_url') // Select relevant fields
      .single();
    if (error) {
      if (error.code === '23505')
        throw new Error(`Username "${formData.username}" is already taken.`);
      throw new Error(error.message || 'Failed to update profile');
    }
    return data;
  }
}
