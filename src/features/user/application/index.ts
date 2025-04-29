import { ProfileFormData, UserPort } from '../domain';

export class UpdateUserProfileUseCase {
  constructor(private readonly userPort: UserPort) {}
  async execute(input: ProfileFormData) {
    if (!input.bio || !input.username) {
      throw new Error('Faltan datos para actualizar el perfil');
    }
    try {
      const response = await this.userPort.updateUserProfile(input);
      return response;
    } catch (error) {
      throw error;
    }
  }
}
