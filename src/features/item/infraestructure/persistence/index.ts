// src/infrastructure/persistence/supabase/SupabaseMediaAdapter.ts (Example path)
// Implements the generic MediaInteractionPort
// Added getMediaDetails method

import {
  getMediaDetailsAniList,
  searchMediaAniList,
} from '../../../../shared/infraestructure/lib/anilistApi';
import {
  getMediaDetailsOpenLibrary,
  searchMediaOpenLibrary,
} from '../../../../shared/infraestructure/lib/googleBooksApi';
import { invokeEdgeFunction } from '../../../../shared/infraestructure/lib/supabaseClient';
import {
  getMediaDetailsTmdb,
  searchMediaTmdb,
} from '../../../../shared/infraestructure/lib/tmdbApi';
import {
  MediaItem,
  MediaType,
} from '../../../../shared/infraestructure/lib/types/media.types';
import {
  LogMediaItemInput,
  RemoveMediaLogInput,
  SearchMediaInput,
  ToggleBacklogInput,
} from '../../application';
// Import the generic Port and related types/interfaces
import type {
  MediaInteractionPort,
  MediaBacklogStatusResponse,
  MediaLogResponse,
  ToggleSuccessResponse,
  LogMediaSuccessResponse,
  SearchMediaSuccessResponse,
  GetMediaDetailsResponse, // Import new response type
  ResponseError,
  GetMediaInput,
} from '../../domain/index'; // Adjust path

// --- Import functions from specific external API adapters ---
// Ensure these functions return Promise<MediaItem | null>
// --- ---

// Renamed class and implements the generic port
export class SupabaseMediaAdapter implements MediaInteractionPort {
  // Helper (no change)
  private ensureNumericId(id: string, mediaType: MediaType): number {
    /* ... */ return Number(id);
  }

  // --- Backlog Methods (no change) ---
  async getBacklogStatus(
    input: GetMediaInput
  ): Promise<MediaBacklogStatusResponse | ResponseError> {
    /* ... */
    try {
      const response = await invokeEdgeFunction('get-backlog-status', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (response?.error) throw new Error(response.error);
      return { success: true, isOnBacklog: response?.isOnBacklog ?? false };
    } catch (error: any) {
      return { error: error.message || 'Failed to get backlog status' };
    }
  }
  async toggleBacklog(
    input: ToggleBacklogInput
  ): Promise<ToggleSuccessResponse | ResponseError> {
    /* ... */
    const functionName =
      input.shouldAdd ? 'add-to-backlog' : 'remove-from-backlog';
    try {
      const response = await invokeEdgeFunction(functionName, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (response?.error) throw new Error(response.error);
      return { success: true, message: response?.message || 'Backlog updated' };
    } catch (error: any) {
      return { error: error.message || 'Failed to toggle backlog item' };
    }
  }

  // --- Media Log Methods (no change) ---
  async getMediaLog(
    input: GetMediaInput
  ): Promise<MediaLogResponse | ResponseError> {
    /* ... */
    try {
      const response = await invokeEdgeFunction('get-media-log-item', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (response?.error) throw new Error(response.error);
      return { mediaLog: response?.mediaLog ?? null };
    } catch (error: any) {
      return { error: error.message || 'Failed to get media log item' };
    }
  }
  async logMediaItem(
    input: LogMediaItemInput
  ): Promise<LogMediaSuccessResponse | ResponseError> {
    /* ... */
    try {
      const response = await invokeEdgeFunction('log-media-item', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (response?.error) throw new Error(response.error);
      if (!response?.mediaLog)
        throw new Error('Log operation succeeded but returned no data.');
      return { mediaLog: response.mediaLog };
    } catch (error: any) {
      return { error: error.message || 'Failed to log media item' };
    }
  }
  async removeMediaLog(
    input: RemoveMediaLogInput
  ): Promise<ToggleSuccessResponse | ResponseError> {
    /* ... */
    try {
      const response = await invokeEdgeFunction('remove-media-log-item', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (response?.error) throw new Error(response.error);
      return {
        success: true,
        message: response?.message || 'Media log item removed',
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to remove media log item' };
    }
  }

  // --- Search Method (no change) ---
  async searchMedia(
    input: SearchMediaInput
  ): Promise<SearchMediaSuccessResponse | ResponseError> {
    console.log(
      `ADAPTER: searchMedia for query "${input.query}", type: ${input.mediaType ?? 'all'}`
    );
    const { query, page = 1, mediaType } = input;
    try {
      switch (mediaType) {
        case 'movie':
          return await searchMediaTmdb(query, page, 'movie');
        case 'tv':
          return await searchMediaTmdb(query, page, mediaType);
        case 'book':
          return await searchMediaOpenLibrary(query, page);
        case 'manga':
          return await searchMediaAniList(query, page);
        default:
          console.warn(
            'Search across all media types not fully implemented yet.'
          );
          return {
            page: 1,
            total_pages: 1,
            error: '',
            results: [],
            total_results: 0,
          };
      }
    } catch (error: any) {
      return {
        error: error.message || `Failed to search ${mediaType ?? 'media'}`,
      };
    }
  }

  // --- NEW: Implement getMediaDetails ---
  async getMediaDetails(
    input: GetMediaInput
  ): Promise<GetMediaDetailsResponse | ResponseError> {
    const { mediaType, externalId } = input;
    console.log(`ADAPTER: getMediaDetails for ${mediaType} - ${externalId}`);

    try {
      let mediaItem: MediaItem | null = null;

      // Delegate to the appropriate external API adapter based on type
      switch (mediaType) {
        case 'movie':
        case 'tv':
          // Ensure the ID is numeric for TMDB if needed by your function
          mediaItem = await getMediaDetailsTmdb(
            this.ensureNumericId(externalId, mediaType),
            mediaType
          );
          break;
        case 'book':
          // Google Books uses string IDs
          mediaItem = await getMediaDetailsOpenLibrary(externalId);
          break;
        case 'manga':
          // AniList uses numeric IDs
          mediaItem = await getMediaDetailsAniList(
            this.ensureNumericId(externalId, mediaType)
          );
          break;
        default:
          // Handle unknown type - return error or null?
          console.error(
            `Unsupported mediaType for getMediaDetails: ${mediaType}`
          );
          return { error: `Unsupported media type: ${mediaType}` };
      }

      // Return the normalized MediaItem (or null if not found)
      return { mediaItem: mediaItem };
    } catch (error: any) {
      console.error(
        `ADAPTER: Error getting details for ${mediaType} - ${externalId}`,
        error
      );
      return {
        error: error.message || `Failed to get details for ${mediaType} item`,
      };
    }
  }
  // --- END NEW ---
}
