import {
  GetBacklogStatusUseCase,
  GetMediaDetailsUseCase,
  GetMediaLogUseCase,
  LogMediaItemUseCase,
  RemoveMediaLogUseCase,
  SearchMediaUseCase,
  ToggleBacklogUseCase,
} from '../application';
import { GetCurrentUserUseCase } from '../../../shared/application';
import { MediaInteractionPort } from '../domain';
import { AuthenticationPort } from '../../authentication';
import { SupabaseMediaAdapter } from '../infraestructure/persistence';
import { SupabaseAuthenticationAdapter } from '../../authentication/infraestructure/persistence';

const supabaseMediaAdapter: MediaInteractionPort = new SupabaseMediaAdapter();
const supabaseAuthAdapter: AuthenticationPort =
  new SupabaseAuthenticationAdapter();

// --- Instantiate Use Cases ---
// Create instances of the use cases, injecting the adapter instances
const getBacklogStatusUseCase = new GetBacklogStatusUseCase(
  supabaseMediaAdapter
);
const getMediaLogUseCase = new GetMediaLogUseCase(supabaseMediaAdapter);
const toggleBacklogUseCase = new ToggleBacklogUseCase(supabaseMediaAdapter);
const logMediaItemUseCase = new LogMediaItemUseCase(supabaseMediaAdapter);
const searchMediaUseCase = new SearchMediaUseCase(supabaseMediaAdapter);
const removeMediaLogUseCase = new RemoveMediaLogUseCase(supabaseMediaAdapter);
const getMediaDetailsUseCase = new GetMediaDetailsUseCase(supabaseMediaAdapter); // Instantiate details use case

// --- Export Use Case Instances ---
// Export the instantiated use cases so they can be provided via Context or used elsewhere
export {
  getBacklogStatusUseCase,
  getMediaLogUseCase,
  toggleBacklogUseCase,
  logMediaItemUseCase,
  searchMediaUseCase,
  removeMediaLogUseCase,
  getMediaDetailsUseCase,
};

// --- Type for App Services Context (if using Context for DI) ---
// This defines the shape of the object provided by your React Context
export interface AppServices {
  getBacklogStatusUseCase: GetBacklogStatusUseCase;
  getMediaLogUseCase: GetMediaLogUseCase;
  toggleBacklogUseCase: ToggleBacklogUseCase;
  logMediaItemUseCase: LogMediaItemUseCase;
  searchMediaUseCase: SearchMediaUseCase;
  removeMediaLogUseCase: RemoveMediaLogUseCase;
  getMediaDetailsUseCase: GetMediaDetailsUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
}
