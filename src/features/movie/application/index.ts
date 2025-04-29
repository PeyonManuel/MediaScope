import { LogMovieData, MoviePort } from '../domain';

export interface GetMovieInput {
  movieId: number;
}

export interface RemoveMovieInput {
  movieId: number;
}

export interface ToggleWatchlistInput {
  shouldAdd: boolean;
  movieId: number;
}

export interface LogWatchedMovieInput {
  movieId: number;
  watchedData: LogMovieData;
}

export interface SearchMovieInput {
  query: string;
  page: number;
}

export class GetWatchlistStatusUseCase {
  constructor(private readonly MoviePort: MoviePort) {}
  async execute(input: GetMovieInput) {
    if (!input.movieId) {
      throw new Error('MovieId es requerido');
    }
    try {
      const watchlistStatus = await this.MoviePort.getWatchlistStatus(
        input.movieId
      );
      if ('error' in watchlistStatus) throw new Error(watchlistStatus.error);
      return watchlistStatus;
    } catch (error) {
      throw error;
    }
  }
}

export class GetWatchedStatusUseCase {
  constructor(private readonly MoviePort: MoviePort) {}
  async execute(input: GetMovieInput) {
    if (!input.movieId) {
      throw new Error('MovieId es requerido');
    }
    try {
      const watchedStatus = await this.MoviePort.getWatchedStatus(
        input.movieId
      );
      if ('error' in watchedStatus) throw new Error(watchedStatus.error);
      return watchedStatus;
    } catch (error) {
      throw error;
    }
  }
}

export class ToggleWatchListUseCase {
  constructor(private readonly MoviePort: MoviePort) {}
  async execute(input: ToggleWatchlistInput) {
    if (!input.movieId || input.shouldAdd === undefined) {
      throw new Error(
        'Llamada faltante de datos para cambiar estado de watchlist'
      );
    }
    try {
      const watchlistStatus = await this.MoviePort.toggleWatchlist(
        input.shouldAdd,
        input.movieId
      );
      if ('error' in watchlistStatus) throw new Error(watchlistStatus.error);
      return watchlistStatus;
    } catch (error) {
      throw error;
    }
  }
}

export class LogWatchedMovieUseCase {
  constructor(private readonly MoviePort: MoviePort) {}
  async execute(input: LogWatchedMovieInput) {
    if (!input.movieId || !input.watchedData) {
      throw new Error(
        'No se introdujeron los datos necesarios para loguear una pelicula'
      );
    }
    try {
      const response = await this.MoviePort.logWatchedMovie(
        input.movieId,
        input.watchedData
      );
      if ('error' in response) throw new Error(response.error);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export class SearchMovieUseCase {
  constructor(private readonly MoviePort: MoviePort) {}
  async execute(input: SearchMovieInput) {
    if (!input.query) {
      throw new Error('Query de busqueda requerida para hacer busqueda');
    }
    try {
      const response = await this.MoviePort.searchMovies(
        input.query,
        input.page
      );
      if ('error' in response) throw new Error(response.error);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export class RemoveMovieUseCase {
  constructor(private readonly MoviePort: MoviePort) {}
  async execute(input: RemoveMovieInput) {
    if (!input.movieId) {
      throw new Error('Falta el id de la pelicula para eliminarla');
    }
    const response = await this.MoviePort.removeLoggedMovie(input.movieId);
    if ('error' in response) throw new Error(response.error);
    return response;
  }
}
