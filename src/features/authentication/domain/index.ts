import { Session, User } from '@supabase/supabase-js';

// Define los datos de sesión que maneja el núcleo/aplicación
export interface UserSession extends Session {
  // ...otros datos de sesión
}
export interface RegisterAuth {
  user: User | null;
  session: UserSession | null;
}
// Define la interfaz (contrato) para la autenticación
export interface AuthenticationPort {
  signUpAuth(
    email: string,
    password: string,
    username: string
  ): Promise<RegisterAuth>;
  signIn(email: string, password: string): Promise<UserSession>;
  //   signOut(): Promise<void>;
  //   getCurrentUser(): Promise<{ id: string; email?: string } | null>;
  // ...otros métodos necesarios
}
