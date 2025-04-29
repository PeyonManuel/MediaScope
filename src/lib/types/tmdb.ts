// src/types/tmdb.ts

// Reusing the Movie interface from before
export interface Movie {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string; // Format "YYYY-MM-DD"
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

// Type for the paginated API response from TMDB list endpoints
export interface PaginatedMoviesResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface GenresResponse {
  genres: Genre[];
}

// Interface for discover options (add more as needed)
export interface DiscoverMovieOptions {
  page?: number;
  sort_by?: string; // e.g., 'popularity.desc', 'vote_average.desc', 'primary_release_date.desc'
  with_genres?: string; // Comma-separated genre IDs (e.g., '28,12')
  'primary_release_date.gte'?: string; // YYYY-MM-DD
  'primary_release_date.lte'?: string; // YYYY-MM-DD
  'vote_average.gte'?: number;
  'vote_average.lte'?: number;
  'vote_count.gte'?: number;
  // Add other discover parameters from TMDB docs as needed
}

// --- Genre Fetching ---
export interface Genre {
  id: number;
  name: string;
}

export interface GenresResponse {
  genres: Genre[];
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}
export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}
export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}
export interface CastMember {
  adult: boolean;
  gender: number | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
}
export interface CrewMember {
  adult: boolean;
  gender: number | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  credit_id: string;
  department: string;
  job: string;
}
export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}
export interface Video {
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
  id: string;
}
export interface Videos {
  results: Video[];
}
export interface Image {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}
export interface Images {
  backdrops: Image[];
  logos: Image[];
  posters: Image[];
}
export interface MovieDetails extends Movie {
  // Extends the basic Movie type
  belongs_to_collection: null | object; // Define more specifically if needed
  budget: number;
  genres: Genre[]; // Overwrites genre_ids with full Genre objects
  homepage: string | null;
  imdb_id: string | null;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  revenue: number;
  runtime: number | null;
  spoken_languages: SpokenLanguage[];
  status: string; // e.g., "Released", "Post Production"
  tagline: string | null;
  // Appended data
  credits?: Credits;
  videos?: Videos;
  images?: Images;
}
