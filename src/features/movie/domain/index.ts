import { WatchedItem } from '../../../lib/types/supabase';
import { Movie } from '../../../lib/types/tmdb';

export interface ResponseError {
  error: string;
}
export interface ToggleWatchListResponseSuccess {
  success: true;
  message: string;
}
export interface RemoveMovieSuccess {
  success: true;
  message: string;
}
export interface WatchStatusSuccess {
  success: true;
  isOnWatchlist: boolean;
}
export interface WatchedItemResponseSuccess {
  watchedItem: WatchedItem | null;
}
export interface LogWatchedMovieSuccess {
  watchedItem: WatchedItem;
}
export interface SearchMovieSuccess {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}
export type LogMovieData = Partial<
  Omit<WatchedItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'movie_id'>
>;

export interface MoviePort {
  getWatchlistStatus(
    movieId: number
  ): Promise<WatchStatusSuccess | ResponseError>;
  getWatchedStatus(
    movieId: number
  ): Promise<WatchedItemResponseSuccess | ResponseError>;
  toggleWatchlist(
    shouldAdd: boolean,
    movieId: number
  ): Promise<ToggleWatchListResponseSuccess | ResponseError>;
  logWatchedMovie(
    movieId: number,
    watchedData: LogMovieData
  ): Promise<LogWatchedMovieSuccess | ResponseError>;
  searchMovies(
    query: string,
    page: number
  ): Promise<SearchMovieSuccess | ResponseError>;
  removeLoggedMovie(
    movieId: Number
  ): Promise<RemoveMovieSuccess | ResponseError>;
}
