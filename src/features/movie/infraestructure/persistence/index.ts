import { invokeEdgeFunction } from '../../../../lib/supabaseClient';
import { searchMovies } from '../../../../lib/tmdb';
import {
  LogMovieData,
  LogWatchedMovieSuccess,
  MoviePort,
  RemoveMovieSuccess,
  ResponseError,
  SearchMovieSuccess,
  ToggleWatchListResponseSuccess,
  WatchStatusSuccess,
} from '../../domain';

export class MovieAdapter implements MoviePort {
  async toggleWatchlist(
    shouldAdd: boolean,
    movieId: number
  ): Promise<ToggleWatchListResponseSuccess | ResponseError> {
    const functionName =
      shouldAdd ? 'add-to-watchlist' : 'remove-from-watchlist';
    console.log(`Calling ${functionName} for movieId: ${movieId}`);
    return await invokeEdgeFunction(functionName, { movieId: Number(movieId) });
  }
  async getWatchlistStatus(
    movieId: number
  ): Promise<WatchStatusSuccess | ResponseError> {
    return await invokeEdgeFunction('get-watchlist-status', {
      movieId: Number(movieId),
    });
  }
  async getWatchedStatus(movieId: number): Promise<ResponseError> {
    return await invokeEdgeFunction('get-watched-item', {
      movieId: Number(movieId),
    });
  }
  logWatchedMovie(
    movieId: number,
    watchedData: LogMovieData
  ): Promise<LogWatchedMovieSuccess | ResponseError> {
    console.log(
      `MUTATION FN: Calling log-watched-movie for ${movieId} with`,
      watchedData
    );
    return invokeEdgeFunction('log-watched-movie', {
      movieId: Number(movieId),
      watchedData,
    });
  }
  searchMovies(
    query: string,
    page: number
  ): Promise<SearchMovieSuccess | ResponseError> {
    return searchMovies(query, page);
  }
  removeLoggedMovie(
    movieId: Number
  ): Promise<RemoveMovieSuccess | ResponseError> {
    console.log(
      `MUTATION FN: Calling remove-watched-movie for ${movieId} with`
    );
    return invokeEdgeFunction('remove-watched-movie', {
      movieId: Number(movieId),
    });
  }
}
