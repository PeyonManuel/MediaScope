// src/core/ports/MediaInteraction.port.ts (Example path)

import {
  MediaItem,
  MediaType,
} from '../../../shared/infraestructure/lib/types/media.types';

// Import necessary generic types

// --- Generic Response Types ---

// Generic error response
export interface ResponseError {
  error: string;
  // Optional: Add error code or details
  // code?: string;
}

// Generic success response for toggle operations
export interface ToggleSuccessResponse {
  success: true;
  message: string;
}

// Response for checking backlog/watchlist status
export interface MediaBacklogStatusResponse {
  success: true;
  isOnBacklog: boolean; // Renamed from isOnWatchlist
}

export interface UserMediaLog {
  // Composite key fields
  user_id: string; // UUID of the user
  media_type: MediaType; // 'movie', 'tv', 'book', 'game', 'manga'
  external_id: string; // ID from the source API (TMDB, RAWG, etc.)

  // User interaction data (nullable)
  rating: number | null; // User's rating (e.g., 1-10), null if not rated or not applicable (game)
  liked: boolean | null; // If the user liked the item
  watched_date: string | null; // Date watched/read/played (YYYY-MM-DD)
  review: string | null; // User's review text

  // Timestamps (managed by DB or set on creation/update)
  created_at: string; // ISO timestamp string
  updated_at: string; // ISO timestamp string
}

// Response for getting a specific log entry
export interface MediaLogResponse {
  // Renamed from WatchedItemResponseSuccess
  mediaLog: UserMediaLog | null; // Use the generic log type
}

// Response for successfully logging/updating an item
export interface LogMediaSuccessResponse {
  // Renamed from LogWatchedMovieSuccess
  mediaLog: UserMediaLog; // Use the generic log type
}

// Response for searching media items
export interface SearchMediaSuccessResponse {
  // Renamed from SearchMovieSuccess
  page: number;
  results: MediaItem[]; // Use the generic MediaItem
  total_pages?: number;
  total_results?: number;
}

// Type for data used when logging/updating a media item
// Omit fields managed by the system or defined by the primary key
export type LogMediaData = Partial<
  Omit<
    UserMediaLog, // Use the generic log type
    'user_id' | 'media_type' | 'external_id' | 'created_at' | 'updated_at'
  >
>;

export interface GetMediaDetailsResponse {
  mediaItem: MediaItem | null; // Return the normalized MediaItem or null if not found
}
export interface GetMediaInput {
  mediaType: MediaType;
  externalId: string;
  // userId?: string; // Usually obtained from context
}
// --- Generic Port Interface ---

export interface MediaInteractionPort {
  // Check if an item is in the user's backlog (previously watchlist)
  getBacklogStatus(input: {
    // userId: string; // Often obtained from auth context in implementation
    mediaType: MediaType;
    externalId: string;
  }): Promise<MediaBacklogStatusResponse | ResponseError>;

  // Get a specific logged item (previously watched item)
  getMediaLog(input: {
    // userId: string;
    mediaType: MediaType;
    externalId: string;
  }): Promise<MediaLogResponse | ResponseError>;

  // Add/Remove an item from the backlog (previously watchlist)
  toggleBacklog(input: {
    // userId: string;
    shouldAdd: boolean;
    mediaType: MediaType;
    externalId: string;
  }): Promise<ToggleSuccessResponse | ResponseError>;

  // Log or update an item as consumed/interacted with (previously logWatchedMovie)
  logMediaItem(input: {
    // userId: string;
    mediaType: MediaType;
    externalId: string;
    logData: LogMediaData; // Contains rating, liked, review, watched_date etc.
  }): Promise<LogMediaSuccessResponse | ResponseError>;

  // Remove an item from the logged/watched list
  removeMediaLog(input: {
    // userId: string;
    mediaType: MediaType;
    externalId: string;
  }): Promise<ToggleSuccessResponse | ResponseError>; // Reusing ToggleSuccessResponse

  // Search across potentially multiple media types (or a specific one)
  // This might need refinement depending on how search across APIs is handled
  searchMedia(input: {
    query: string;
    page?: number;
    mediaType?: MediaType; // Optional: filter search by type
  }): Promise<SearchMediaSuccessResponse | ResponseError>;

  getMediaDetails(
    input: GetMediaInput
  ): Promise<GetMediaDetailsResponse | ResponseError>;

  // --- Add other methods as needed ---
  // e.g., getMediaDetails, discoverMedia (for browsing)
}
