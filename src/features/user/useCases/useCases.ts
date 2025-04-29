import { UpdateUserProfileUseCase } from '../application';
import { SupabaseUserAdapter } from '../infraestructure/persistence';

const supabaseUserAdapter = new SupabaseUserAdapter();
const updateUserProfileUseCase = new UpdateUserProfileUseCase(
  supabaseUserAdapter
);

export { updateUserProfileUseCase };
