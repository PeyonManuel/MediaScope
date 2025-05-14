import {
  GetUserDiaryUseCase,
  GetUserLogUseCase,
  UpdateUserProfileUseCase,
} from '../application';
import { SupabaseUserAdapter } from '../infraestructure/persistence';

const supabaseUserAdapter = new SupabaseUserAdapter();
const updateUserProfileUseCase = new UpdateUserProfileUseCase(
  supabaseUserAdapter
);
const getUserLogUseCase = new GetUserLogUseCase(supabaseUserAdapter);
const getUserDiaryUseCase = new GetUserDiaryUseCase(supabaseUserAdapter);

export { updateUserProfileUseCase, getUserLogUseCase, getUserDiaryUseCase };
