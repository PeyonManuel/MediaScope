import {
  GetUserDiaryInput,
  GetUserDiaryResponse,
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
    if (!input.profileId || !input.type || !input.page) {
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

export class GetUserDiaryUseCase {
  constructor(private readonly userPort: UserPort) {}
  async execute(input: GetUserDiaryInput): Promise<GetUserDiaryResponse> {
    if (!input.profileId) {
      throw new Error('Input field profileId is required');
    }
    try {
      const response = await this.userPort.getUserDiary(input);
      return response;
    } catch (error) {
      throw error;
    }
  }
}
