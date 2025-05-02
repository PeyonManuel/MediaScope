import { GetUserLogUseCase, UpdateUserProfileUseCase } from '../application';
import { SupabaseUserAdapter } from '../infraestructure/persistence';

const supabaseUserAdapter = new SupabaseUserAdapter();
const updateUserProfileUseCase = new UpdateUserProfileUseCase(
  supabaseUserAdapter
);
const getUserLogUseCase = new GetUserLogUseCase(supabaseUserAdapter);

export { updateUserProfileUseCase, getUserLogUseCase };
