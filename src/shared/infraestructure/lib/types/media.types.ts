// --- Common Normalized Media Item Structure ---

import { UserMediaLog } from '../../../../features/item/domain';

// This is the shape we want to use throughout the UI and application layer
export type MediaType = 'movie' | 'tv' | 'book' | 'manga';

// --- Placeholder types for nested data (define these more specifically) ---
// These should ideally match the structure returned by your normalization functions
export interface MediaCreditPerson {
  id: number | string;
  name: string;
  character?: string; // For cast
  job?: string; // For crew
  profile_path?: string | null;
  credit_id?: string; // Often useful as key
}
export interface MediaCredits {
  cast?: MediaCreditPerson[];
  crew?: MediaCreditPerson[];
}
interface MediaVideo {
  id: string;
  key: string; // e.g., YouTube key
  name: string;
  site: string; // e.g., "YouTube"
  type: string; // e.g., "Trailer", "Clip"
}
interface MediaVideos {
  results?: MediaVideo[];
}
interface MediaProductionCompany {
  id: number | string;
  name: string;
  logo_path?: string | null;
}
export interface MediaExternalLink {
  site: string;
  url: string;
  category: string;
}
// --- Common Normalized Media Item Structure (Updated) ---
// This is the shape we want to use throughout the UI and application layer
export interface MediaItem {
  id: string; // Unique identifier within our app (e.g., `${mediaType}-${externalId}`)
  externalId: string; // ID from the source API (TMDB, Google Books, RAWG, AniList)
  mediaType: MediaType;
  title: string;
  screenshots?: string[] | null;
  originalTitle?: string | null;
  posterUrl: string | null;
  backdropUrl?: string | null;
  description: string | null;
  releaseDate: string | null; // Normalized to YYYY-MM-DD or just YYYY if possible
  genres?: string[]; // Simple array of genre names/strings
  averageScore?: number | null; // Normalized score (e.g., out of 10). Null for games.
  scoreSource?: string; // e.g., 'TMDB', 'AniList', 'Google Books', 'RAWG'
  voteCount?: number | null;
  status?: string | null; // Released, Airing, Publishing, etc.
  tagline?: string | null;
  credits?: MediaCredits | null; // Optional credits object
  videos?: MediaVideos | null; // Optional videos object
  production_companies?: MediaProductionCompany[] | null; // Optional companies
  slug?: string | null;
  // Type-specific details (optional)
  runtime?: number | null; // For movies/tv (minutes)
  pageCount?: number | null; // For books
  chapters?: number | null; // For manga/books
  volumes?: number | null; // For manga/books
  platforms?: string[]; // For games
  developers?: string[]; // For games
  publishers?: string[]; // For games
  authors?: string[]; // For books
  artists?: string[]; // For manga
  director?: string | null; // For movie/tv (can be derived from credits.crew)
  externalLinks?: MediaExternalLink[] | null;
  originalWatchedItem?: UserMediaLog;
}

export interface MediaListApiResponse {
  page: number;
  results: MediaItem[]; // Contains normalized items
  total_pages?: number;
  total_results?: number;
}
// --- Source-Specific API Response Types (Basic Examples) ---
// These should be expanded based on the actual data needed from each API

// --- TMDB Specific Type Definitions ---
// Based on TMDB API documentation and provided example

interface Genre {
  id: number;
  name: string;
}

interface ProductionCompanyTmdb {
  // Renamed to avoid conflict if MediaProductionCompany is different
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

interface CastMember {
  adult: boolean;
  gender: number | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id?: number; // For movies
  character?: string;
  credit_id: string;
  order?: number;
}

interface CrewMember {
  adult: boolean;
  gender: number | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  credit_id: string;
  department?: string;
  job?: string;
}

interface CreditsTmdb {
  // Renamed to avoid conflict
  cast: CastMember[];
  crew: CrewMember[];
}

interface VideoTmdb {
  // Renamed to avoid conflict
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string; // YouTube key
  site: string; // e.g., "YouTube"
  size: number; // e.g., 1080
  type: string; // e.g., "Trailer", "Clip", "Featurette"
  official: boolean;
  published_at: string; // ISO date string
  id: string; // Video ID (e.g., "6294053ba410c8009b0fc163")
}

interface VideosTmdb {
  // Renamed to avoid conflict
  results: VideoTmdb[];
}

// Base type for items in list results (Search, Popular, Top Rated etc.)
export interface TmdbMediaResult {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[]; // Lists have genre IDs
  id: number;
  original_language: string;
  original_title?: string; // Movie specific
  original_name?: string; // TV specific
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  release_date?: string; // Movie specific (YYYY-MM-DD)
  first_air_date?: string; // TV specific (YYYY-MM-DD)
  title?: string; // Movie specific
  name?: string; // TV specific
  video?: boolean; // Movie specific
  vote_average: number;
  vote_count: number;
  // Fields below might not be present in all list types
  origin_country?: string[]; // TV specific
}

// Type for the overall response from TMDB list endpoints
export interface TmdbListResponse {
  page: number;
  results: TmdbMediaResult[]; // Contains raw list items
  total_pages: number;
  total_results: number;
}

// Type for the full /movie/{id} response
export interface MovieDetails extends TmdbMediaResult {
  belongs_to_collection: object | null; // Define further if needed
  budget: number;
  genres: Genre[]; // Details have full genre objects
  homepage: string | null;
  imdb_id: string | null;
  // production_companies defined below to avoid conflict if structure differs slightly
  production_companies: ProductionCompanyTmdb[];
  production_countries: ProductionCountry[];
  revenue: number;
  runtime: number | null;
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string | null;
  // Appended responses
  credits?: CreditsTmdb;
  videos?: VideosTmdb;
}

// Type for the full /tv/{id} response
export interface TvDetails extends TmdbMediaResult {
  // Extends base list item
  created_by?: {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: string | null;
  }[];
  episode_run_time: number[];
  genres: Genre[]; // Details have full genre objects
  homepage: string | null;
  in_production: boolean;
  languages?: string[];
  last_air_date: string | null;
  last_episode_to_air?: object; // Define further if needed
  next_episode_to_air?: object | null; // Define further if needed
  networks?: ProductionCompanyTmdb[]; // Reusing company type for networks
  number_of_episodes: number;
  number_of_seasons: number;
  // origin_country defined in TmdbMediaResult
  // production_companies defined below
  production_companies: ProductionCompanyTmdb[];
  production_countries: ProductionCountry[];
  seasons?: object[]; // Define Season type if needed
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string | null;
  type?: string; // e.g., "Scripted"
  // Appended responses
  credits?: CreditsTmdb;
  videos?: VideosTmdb;
}

// src/types/openlibrary.types.ts (Example path)

// --- Open Library Search Result Document ---
export interface OpenLibrarySearchDoc {
  key: string; // Work key, e.g., "/works/OL45883W"
  type: string; // e.g., "work"
  title: string;
  // Titles can also be objects in some cases
  // title_suggest?: string;

  // Authors
  author_key?: string[];
  author_name?: string[];

  // Publication Info
  first_publish_year?: number;
  publish_date?: string[]; // Array of dates as strings
  publisher?: string[];

  // Identifiers (arrays)
  isbn?: string[];
  lccn?: string[];
  oclc?: string[];
  olid?: string; // Edition OLID (sometimes present)

  // Cover
  cover_i?: number; // Cover ID (integer)
  cover_edition_key?: string; // OLID of edition with cover

  // Other potentially useful fields
  subject?: string[]; // Genres/subjects/tags
  language?: string[];
  number_of_pages_median?: number;
  first_sentence?: string[];
  ratings_average?: number; // Scale seems variable, often 1-5? Needs verification.
  ratings_count?: number;
  // ... many other fields available
}

// --- Open Library Search Response ---
export interface OpenLibrarySearchResponse {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: OpenLibrarySearchDoc[];
  num_found: number; // Duplicate?
  q: string;
  offset: number | null;
}

// --- Open Library Work/Edition Details (Simplified) ---
// Fetched from endpoints like /works/{OLID}.json or /books/{OLID}.json
export interface OpenLibraryWork {
  key: string; // e.g., "/works/OL45883W"
  title: string;
  description?: string | { type: string; value: string }; // Can be string or object
  subjects?: string[];
  subject_places?: string[];
  subject_people?: string[];
  subject_times?: string[];
  authors?: { author: { key: string } }[]; // Reference to author records
  covers?: number[]; // Array of cover IDs
  first_publish_date?: string; // Textual date
  // ... many other fields
}

export interface OpenLibraryAuthor {
  key: string; // e.g., "/authors/OL34184A"
  name: string;
  personal_name?: string;
  birth_date?: string;
  death_date?: string;
  bio?: string | { type: string; value: string };
  photos?: number[]; // Array of photo IDs
  // ...
}

// Edition details might be fetched separately or included sometimes
export interface OpenLibraryEdition {
  key: string; // e.g., "/books/OL27320736M"
  title: string;
  authors?: { key: string }[]; // Reference author OLIDs
  publishers?: string[];
  publish_date?: string; // Textual date
  number_of_pages?: number;
  isbn_10?: string[];
  isbn_13?: string[];
  covers?: number[];
  // ...
}

export interface SteamSpyApp {
  appid: number; // Steam App ID
  name: string;
  developer?: string; // Can be comma-separated string
  publisher?: string; // Can be comma-separated string
  score_rank?: string | number; // Usually empty string or rank number
  positive?: number; // Number of positive ratings
  negative?: number; // Number of negative ratings
  userscore?: number; // Usually 0, not a reliable average score
  owners?: string; // Estimated owners range string, e.g., "1,000,000 .. 2,000,000"
  average_forever?: number; // Average playtime (total) in minutes
  average_2weeks?: number; // Average playtime (last 2 weeks) in minutes
  median_forever?: number; // Median playtime (total) in minutes
  median_2weeks?: number; // Median playtime (last 2 weeks) in minutes
  price?: string; // Price in cents (e.g., "1999" for $19.99)
  initialprice?: string; // Initial price in cents
  discount?: string; // Discount percentage string "0"
  ccu?: number; // Peak concurrent users yesterday
  languages?: string; // Comma-separated string
  genre?: string; // Comma-separated string of genres/tags
  tags?: { [tagName: string]: number }; // Object with tag names as keys, votes as values
  // Details endpoint might add more:
  about_the_game?: string; // HTML description
  short_description?: string;
  header_image?: string; // URL for the header image
  release_date?: string; // Often textual like "Oct 2, 2007" - needs parsing
  // website?: string; // Sometimes available
}

// --- SteamSpy API List Response (e.g., from /all or /top100) ---
// The response is often an object where keys are appids (as strings)
export interface SteamSpyListResponse {
  [appid: string]: SteamSpyApp;
}

// --- SteamSpy API Detail Response (/appdetails) ---
// This endpoint returns a single SteamSpyApp object directly
export type SteamSpyDetailResponse = SteamSpyApp;

interface AniListCharacter {
  role: {
    node: {
      id: string;
      name: {
        full: string;
      };
      image: {
        large: string;
      };
    };
  };
}

// AniList API (Media Object - Simplified, GraphQL response)
// GraphQL responses are nested, define based on your query
export interface AniListMedia {
  id: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  description?: string; // Can contain HTML
  format?: string; // e.g., MANGA, ONE_SHOT
  status?: string; // e.g., FINISHED, RELEASING
  startDate?: { year?: number; month?: number; day?: number };
  endDate?: { year?: number; month?: number; day?: number };
  chapters?: number | null;
  volumes?: number | null;
  genres?: string[];
  averageScore?: number | null; // Score out of 100
  meanScore?: number | null; // Score out of 100
  popularity?: number;
  coverImage?: {
    extraLarge?: string;
    large?: string;
    medium?: string;
    color?: string;
  };
  bannerImage?: string;
  characters: {
    edges?: {
      role: string;
      node: { id: string; name: { full: string }; image: { large: string } };
    }[];
  };
  staff?: {
    // Example for authors/artists
    edges?: {
      role: string;
      node: { id: string; name: { full: string }; image: { large: string } };
    }[];
  };
  siteUrl?: string;
  // ... other fields based on your GraphQL query
}
// Example GraphQL response structure (highly dependent on your query)
export interface AniListApiResponse {
  data: {
    Page?: {
      // If using pagination
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
      media: AniListMedia[];
    };
    Media?: AniListMedia; // If querying a single item
  };
  // errors?: ... // GraphQL errors
}
