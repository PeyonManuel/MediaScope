import {
  GetUserLogInput,
  GetUserLogResponse,
  ProfileFormData,
  UserPort,
} from '../domain';

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

export class GetUserLogUseCase {
  constructor(private readonly userPort: UserPort) {}
  async execute(input: GetUserLogInput): Promise<GetUserLogResponse> {
    if (!input.profileId || !input.type) {
      throw new Error('Input fields profileId and type required');
    }
    try {
      const response = await this.userPort.getUserLog(input);
      return response;
    } catch (error) {
      throw error;
    }
  }
}
