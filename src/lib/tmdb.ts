// src/lib/tmdb.ts
import axios from 'axios';
import type {
  DiscoverMovieOptions,
  Genre,
  GenresResponse,
  MovieDetails,
  PaginatedMoviesResponse,
} from '../types/tmdb'; // Adjust path

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  throw new Error('TMDB API Key is missing in environment variables.');
}

// Create an Axios instance (optional but good practice)
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'en-US', // Optional: Set default language
  },
});

// Function to fetch popular movies
export const fetchPopularMovies = async (
  page: number = 1
): Promise<PaginatedMoviesResponse> => {
  const response = await tmdbApi.get('/movie/popular', {
    params: { page },
  });
  return response.data;
};

// Function to fetch top-rated movies
export const fetchTopRatedMovies = async (
  page: number = 1
): Promise<PaginatedMoviesResponse> => {
  const response = await tmdbApi.get('/movie/top_rated', {
    params: { page },
  });
  return response.data;
};

// Helper to get full image URL
export const getImageUrl = (
  path: string | null | undefined,
  size: string = 'w500'
): string | null => {
  if (!path) return null; // Or return a placeholder image URL
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const discoverMovies = async (
  options: DiscoverMovieOptions
): Promise<PaginatedMoviesResponse> => {
  // Ensure only valid keys are passed (optional but good practice)
  const validOptions: Record<string, any> = {
    include_adult: false,
    include_video: false,
    language: 'en-US',
    page: options.page || 1,
    sort_by: options.sort_by || 'popularity.desc',
  };

  // Add optional parameters if they exist and have a value
  if (options.with_genres) validOptions.with_genres = options.with_genres;
  if (
    options['vote_count.gte'] !== undefined &&
    options['vote_count.gte'] > 0
  ) {
    // Only add if > 0
    validOptions['vote_count.gte'] = options['vote_count.gte'];
  }

  const response = await tmdbApi.get('/discover/movie', {
    params: validOptions,
  });
  return response.data;
};

// Function to fetch movie genres
export const fetchMovieGenres = async (): Promise<Genre[]> => {
  const response = await tmdbApi.get<GenresResponse>('/genre/movie/list');
  return response.data.genres;
};

// --- Function to fetch movie details ---
export const fetchMovieDetails = async (
  movieId: string | number
): Promise<MovieDetails> => {
  console.log('Fetching movie details');
  if (!movieId) throw new Error('Movie ID is required');
  const response = await tmdbApi.get(`/movie/${movieId}`, {
    params: {
      append_to_response: 'credits,videos,images', // Append extra data
    },
  });
  return response.data;
};
