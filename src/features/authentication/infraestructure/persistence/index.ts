import { supabase } from '../../../../shared/infraestructure/lib/supabaseClient';
import { AuthenticationPort, RegisterAuth, UserSession } from '../../domain';

export class SupabaseAuthenticationAdapter implements AuthenticationPort {
  async signIn(email: string, password: string): Promise<UserSession> {
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: email,
        password: password,
      }
    );

    if (signInError) {
      throw signInError;
    }
    return data.session;
  }

  async signUpAuth(
    email: string,
    password: string,
    userName: string
  ): Promise<RegisterAuth> {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userName.trim(),
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }
    return data;
  }
}
