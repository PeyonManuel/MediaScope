import { AuthenticationPort, RegisterAuth, UserSession } from '../domain';

export interface RegisterInput {
  email: string;
  password: string;
  userName: string;
}

export interface AuthInput {
  email: string;
  password: string;
}

export class LoginUseCase {
  constructor(private readonly authPort: AuthenticationPort) {}
  async execute(input: AuthInput): Promise<UserSession> {
    if (!input.email || !input.password) {
      throw new Error('Email y contraseña requeridos');
    }

    try {
      const session = await this.authPort.signIn(input.email, input.password);
      return session;
    } catch (error) {
      throw error;
    }
  }
}

export class RegisterUseCase {
  constructor(private readonly authPort: AuthenticationPort) {}
  async execute(input: RegisterInput): Promise<RegisterAuth> {
    if (!input.email || !input.password || !input.userName) {
      throw new Error('Email y contraseña requeridos');
    }
    try {
      const register = await this.authPort.signUpAuth(
        input.email,
        input.password,
        input.userName
      );
      return register;
    } catch (error) {
      throw error;
    }
  }
}
