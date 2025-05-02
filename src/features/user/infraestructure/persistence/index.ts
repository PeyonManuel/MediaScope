import {
  GetUserLogInput,
  GetUserLogResponse,
  ProfileFormData,
  ProfileResponse,
  UserPort,
} from '../../domain';
import {
  invokeEdgeFunction,
  supabase,
} from '../../../../shared/infraestructure/lib/supabaseClient';

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

  async getUserLog(input: GetUserLogInput): Promise<GetUserLogResponse> {
    const functionNameWithParam = `get-user-log-list?userId=${encodeURIComponent(input.profileId)}&type=${input.type}`;
    const response = await invokeEdgeFunction(functionNameWithParam, {
      method: 'GET',
    });
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format from get-user-log-list');
    }
    if ('error' in response && response.error) {
      throw new Error(String(response.error));
    }
    return response as GetUserLogResponse;
  }
}
