// src/infrastructure/external_apis/tmdb/tmdbApi.ts (Example path)

import {
  MediaItem,
  MediaListApiResponse,
  MovieDetails,
  TmdbListResponse,
  TmdbMediaResult,
  TvDetails,
} from './types/media.types';

// Import specific TMDB response types
// Import generic types used by the application

// Assume constants TMDB_API_KEY and TMDB_BASE_URL are defined/imported
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// --- Image URL Helper ---
export const getImageUrl = (
  path: string | null | undefined,
  size: string = 'w500'
): string | null => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// --- Normalization Helper (Handles basic list item structure) ---
// Takes a raw TMDB list item and converts it to our generic MediaItem
function normalizeTmdbListItem(
  item: TmdbMediaResult,
  mediaType: 'movie' | 'tv'
): MediaItem | null {
  if (!item || !item.id) return null;
  const id = `${mediaType}-${item.id}`;
  const title = item.title ?? item.name ?? 'Unknown Title'; // Use title for movie, name for TV
  const releaseDate = item.release_date ?? item.first_air_date ?? null;
  // List results only have genre_ids, not full genre objects.
  // We'll leave genres array empty here, details fetch can populate it.
  const genres: string[] = [];
  const avgScoreNum =
    typeof item.vote_average === 'number' ? item.vote_average : null;

  return {
    id: id,
    externalId: String(item.id),
    mediaType: mediaType,
    title: title,
    originalTitle: item.original_title ?? item.original_name ?? null,
    posterUrl: getImageUrl(item.poster_path, 'w342'),
    backdropUrl: getImageUrl(item.backdrop_path, 'w780'),
    description: item.overview,
    releaseDate: releaseDate,
    genres: genres, // Empty for list items, populated by details fetch
    averageScore:
      avgScoreNum !== null ? parseFloat(avgScoreNum.toFixed(1)) : null,
    scoreSource: 'TMDB',
    voteCount: item.vote_count,
    // Fields below are typically NOT in list results, set to null/defaults
    runtime: null,
    status: null,
    tagline: null,
    credits: null,
    videos: null,
    production_companies: null,
    // etc.
  };
}

// --- Normalization Helper for Full Details ---
// Takes the richer details object and converts/merges into MediaItem
function normalizeTmdbDetails(
  details: MovieDetails | TvDetails,
  mediaType: 'movie' | 'tv'
): MediaItem | null {
  if (!details || !details.id) return null;
  // Start with the basic normalization
  const baseItem = normalizeTmdbListItem(details as TmdbMediaResult, mediaType); // Cast to basic shape first
  if (!baseItem) return null;

  // Add/Override with details-specific fields
  baseItem.genres = details.genres?.map((g) => g.name) ?? []; // Use full genre names
  if (mediaType === 'movie' && 'runtime' in details) {
    baseItem.runtime = details.runtime ?? null;
  } else if (mediaType === 'tv' && 'episode_run_time' in details) {
    // Access safely, get the first runtime if array is not empty
    baseItem.runtime = details.episode_run_time?.[0] ?? null;
  } else {
    baseItem.runtime = null; // Fallback
  }
  baseItem.status = details.status;
  baseItem.tagline = details.tagline;
  baseItem.credits = details.credits; // Assuming credits structure matches MediaCredits
  baseItem.videos = details.videos; // Assuming videos structure matches MediaVideos
  baseItem.production_companies = details.production_companies; // Assuming structure matches

  // Add other details fields as needed...

  return baseItem;
}

// --- API Fetch Helper ---
async function fetchTmdb<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  // ... (fetchTmdb implementation remains the same) ...
  if (!API_KEY) throw new Error('TMDB API Key missing');
  const urlParams = new URLSearchParams({
    api_key: API_KEY,
    language: 'en-US',
    ...Object.entries(params).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    ),
  });
  const url = `${TMDB_BASE_URL}${endpoint}?${urlParams.toString()}`;
  console.log('Fetching TMDB URL:', url);
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ status_message: response.statusText }));
    console.error(`TMDB API error (${response.status}):`, errorBody);
    throw new Error(
      `TMDB request failed: ${errorBody?.status_message || response.statusText}`
    );
  }
  return (await response.json()) as T;
}

// --- Adapter Functions (Exported, returning normalized data) ---

// Define MediaListApiResponse using the generic MediaItem

// Search (movie or tv)
export const searchMediaTmdb = async (
  query: string,
  page: number = 1,
  type: 'movie' | 'tv'
): Promise<MediaListApiResponse> => {
  // Fetches TmdbListResponse (raw)
  const apiResponse = await fetchTmdb<TmdbListResponse>(`/search/${type}`, {
    query,
    page,
  });
  // Normalizes results to MediaItem[]
  const normalizedResults = apiResponse.results
    .map((item) => normalizeTmdbListItem(item, type)) // Use list item normalizer
    .filter((item): item is MediaItem => item !== null); // Type guard filter
  return {
    page: apiResponse.page,
    results: normalizedResults,
    total_pages: apiResponse.total_pages,
    total_results: apiResponse.total_results,
  };
};

// Get Details (movie or tv)
export const getMediaDetailsTmdb = async (
  id: string | number,
  type: 'movie' | 'tv'
): Promise<MediaItem | null> => {
  // Fetches MovieDetails or TvDetails (raw)
  const details = await fetchTmdb<MovieDetails | TvDetails>(`/${type}/${id}`, {
    append_to_response: 'credits,videos',
  });
  // Normalizes the detailed response to MediaItem
  return normalizeTmdbDetails(details, type);
};

// Popular Movies
export const getPopularMovies = async (
  page: number = 1
): Promise<MediaListApiResponse> => {
  const apiResponse = await fetchTmdb<TmdbListResponse>('/movie/popular', {
    page,
  });
  const normalizedResults = apiResponse.results
    .map((item) => normalizeTmdbListItem(item, 'movie')) // Use list item normalizer
    .filter((item): item is MediaItem => item !== null);
  return { ...apiResponse, results: normalizedResults };
};

// Top Rated Movies
export const getTopRatedMovies = async (
  page: number = 1
): Promise<MediaListApiResponse> => {
  const apiResponse = await fetchTmdb<TmdbListResponse>('/movie/top_rated', {
    page,
  });
  const normalizedResults = apiResponse.results
    .map((item) => normalizeTmdbListItem(item, 'movie')) // Use list item normalizer
    .filter((item): item is MediaItem => item !== null);
  return { ...apiResponse, results: normalizedResults };
};

// Popular TV
export const getPopularTv = async (
  page: number = 1
): Promise<MediaListApiResponse> => {
  const apiResponse = await fetchTmdb<TmdbListResponse>('/tv/popular', {
    page,
  });
  const normalizedResults = apiResponse.results
    .map((item) => normalizeTmdbListItem(item, 'tv')) // Use list item normalizer
    .filter((item): item is MediaItem => item !== null);
  return { ...apiResponse, results: normalizedResults };
};

// Top Rated TV
export const getTopRatedTv = async (
  page: number = 1
): Promise<MediaListApiResponse> => {
  const apiResponse = await fetchTmdb<TmdbListResponse>('/tv/top_rated', {
    page,
  });
  const normalizedResults = apiResponse.results
    .map((item) => normalizeTmdbListItem(item, 'tv')) // Use list item normalizer
    .filter((item): item is MediaItem => item !== null);
  return { ...apiResponse, results: normalizedResults };
};
