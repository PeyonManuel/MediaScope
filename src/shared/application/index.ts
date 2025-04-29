import { CurrentUserResponse, SupabaseClientPort } from '../domain';

export class GetCurrentUserUseCase {
  constructor(private readonly supabaseClientPort: SupabaseClientPort) {}
  async execute(): Promise<CurrentUserResponse> {
    try {
      const currUser = await this.supabaseClientPort.getCurrentUser();
      return currUser;
    } catch (error) {
      if (error instanceof Error) console.error(error);
      throw error;
    }
  }
}
