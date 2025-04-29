import { GetCurrentUserUseCase } from '../../../shared/application';
import { SupabaseClientAdapter } from '../../../shared/infraestructure';
import {
  GetWatchedStatusUseCase,
  GetWatchlistStatusUseCase,
  LogWatchedMovieUseCase,
  RemoveMovieUseCase,
  SearchMovieUseCase,
  ToggleWatchListUseCase,
} from '../application';
import { MovieAdapter } from '../infraestructure/persistence';

const movieAdapter = new MovieAdapter();
const getWatchlistStatusUseCase = new GetWatchlistStatusUseCase(movieAdapter);
const getWatchedStatusUseCase = new GetWatchedStatusUseCase(movieAdapter);
const toggleWatchlistUseCase = new ToggleWatchListUseCase(movieAdapter);
const logWatchedMovieUseCase = new LogWatchedMovieUseCase(movieAdapter);
const searchMoviesUseCase = new SearchMovieUseCase(movieAdapter);
const removeLoggedMovieUseCase = new RemoveMovieUseCase(movieAdapter);

const supabaseClientAdapter = new SupabaseClientAdapter();
const getCurrentUserUseCase = new GetCurrentUserUseCase(supabaseClientAdapter);

export {
  getWatchlistStatusUseCase,
  getCurrentUserUseCase,
  getWatchedStatusUseCase,
  toggleWatchlistUseCase,
  logWatchedMovieUseCase,
  searchMoviesUseCase,
  removeLoggedMovieUseCase,
};
