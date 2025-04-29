// src/lib/tmdb.ts
import axios from 'axios';
import type {
  DiscoverMovieOptions,
  Genre,
  GenresResponse,
  MovieDetails,
  PaginatedMoviesResponse,
} from './types/tmdb'; // Adjust path

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
  options: DiscoverMovieOptions = {}
): Promise<PaginatedMoviesResponse> => {
  // Use Vite's way of accessing environment variables for frontend code
  const apiKey = import.meta.env.VITE_TMDB_API_KEY || TMDB_API_KEY; // Fallback if needed

  if (!apiKey) {
    console.error('TMDB API Key is missing!');
    throw new Error('TMDB API Key is not configured.');
  }

  // Start building the query string
  const params = new URLSearchParams({
    api_key: apiKey,
    include_adult: 'false', // Usually default to false
    // Default language, adjust if needed
    language: 'en-US',
    // Default page if not provided
    page: (options.page ?? 1).toString(),
    // Default sort order if not provided
    sort_by: options.sort_by ?? 'popularity.desc',
  });

  // Conditionally add other parameters from options if they have a value
  if (options.with_genres) {
    params.append('with_genres', options.with_genres);
  }
  if (options['vote_count.gte'] && options['vote_count.gte'] > 0) {
    params.append('vote_count.gte', options['vote_count.gte'].toString());
  }
  if (options['vote_average.gte'] && options['vote_average.gte'] > 0) {
    params.append('vote_average.gte', options['vote_average.gte'].toString());
  }
  // Add other options here in the same way...
  // if (options.primary_release_year) { params.append(...) }

  const url = `${TMDB_BASE_URL}/discover/movie?${params.toString()}`;
  console.log('Fetching TMDB Discover URL:', url); // Log the URL for debugging

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      console.error(`TMDB API error (${response.status}):`, errorBody);
      throw new Error(
        `Failed to discover movies: ${errorBody?.message || response.statusText}`
      );
    }
    const data = (await response.json()) as PaginatedMoviesResponse;
    return data;
  } catch (error) {
    console.error('Network or parsing error discovering movies:', error);
    throw error; // Re-throw the error to be caught by TanStack Query or the caller
  }
};

export const searchMovies = async (
  query: string,
  page: number = 1
): Promise<PaginatedMoviesResponse> => {
  // Handle empty query to avoid unnecessary API call or error
  if (!query || query.trim() === '') {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
  // Construct the TMDB API URL
  const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      // Log or handle TMDB specific errors
      const errorBody = await response.text();
      console.error(
        `TMDB API error (${response.status}) searching for "${query}": ${errorBody}`
      );
      throw new Error(`Failed to search movies: ${response.statusText}`);
    }
    // Parse and return the JSON data, asserting the type
    const data = (await response.json()) as PaginatedMoviesResponse;
    return data;
  } catch (error) {
    console.error(
      `Network or parsing error searching movies for "${query}":`,
      error
    );
    throw error;
  }
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
