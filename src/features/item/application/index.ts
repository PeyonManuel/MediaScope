// src/application/use_cases/ (Example path)

// Import the generic port, types, and error response
import { MediaType } from '../../../shared/infraestructure/lib/types/media.types';
import {
  GetMediaDetailsResponse,
  LogMediaData,
  LogMediaSuccessResponse,
  MediaBacklogStatusResponse,
  MediaInteractionPort,
  MediaLogResponse,
  SearchMediaSuccessResponse,
  ToggleSuccessResponse,
} from '../domain';

// --- Input Type Definitions for Use Cases ---

export interface GetMediaInput {
  // userId?: string; // Typically obtained via auth context within execute if needed
  mediaType: MediaType;
  externalId: string;
}

export interface ToggleBacklogInput {
  // userId?: string;
  shouldAdd: boolean;
  mediaType: MediaType;
  externalId: string;
}

export interface LogMediaItemInput {
  // userId?: string;
  mediaType: MediaType;
  externalId: string;
  logData: LogMediaData; // Contains rating, liked, review, etc.
}

export interface SearchMediaInput {
  query: string;
  page?: number;
  mediaType?: MediaType; // Optional: filter search by type
}

export interface RemoveMediaLogInput {
  // userId?: string;
  mediaType: MediaType;
  externalId: string;
}

// --- Refactored Use Case Classes ---

export class GetBacklogStatusUseCase {
  // Depend on the generic MediaInteractionPort
  constructor(private readonly mediaInteractionPort: MediaInteractionPort) {}

  async execute(input: GetMediaInput): Promise<MediaBacklogStatusResponse> {
    // Basic validation
    if (!input.mediaType || !input.externalId) {
      throw new Error('MediaType and ExternalId are required');
    }
    try {
      // Call the corresponding method on the generic port
      const response = await this.mediaInteractionPort.getBacklogStatus(input);
      // Handle potential ResponseError returned by the port implementation
      if ('error' in response) throw new Error(response.error);
      return response; // Return the success response
    } catch (error) {
      // Re-throw or handle specific application errors
      console.error('Error in GetBacklogStatusUseCase:', error);
      throw error;
    }
  }
}

export class GetMediaLogUseCase {
  // Depend on the generic MediaInteractionPort
  constructor(private readonly mediaInteractionPort: MediaInteractionPort) {}

  async execute(input: GetMediaInput): Promise<MediaLogResponse> {
    if (!input.mediaType || !input.externalId) {
      throw new Error('MediaType and ExternalId are required');
    }
    try {
      // Call the corresponding method on the generic port
      const response = await this.mediaInteractionPort.getMediaLog(input);
      if ('error' in response) throw new Error(response.error);
      return response;
    } catch (error) {
      console.error('Error in GetMediaLogUseCase:', error);
      throw error;
    }
  }
}

export class ToggleBacklogUseCase {
  // Depend on the generic MediaInteractionPort
  constructor(private readonly mediaInteractionPort: MediaInteractionPort) {}

  async execute(input: ToggleBacklogInput): Promise<ToggleSuccessResponse> {
    if (
      !input.mediaType ||
      !input.externalId ||
      input.shouldAdd === undefined
    ) {
      throw new Error('Missing data for toggle backlog operation');
    }
    try {
      // Call the corresponding method on the generic port
      const response = await this.mediaInteractionPort.toggleBacklog(input);
      if ('error' in response) throw new Error(response.error);
      return response;
    } catch (error) {
      console.error('Error in ToggleBacklogUseCase:', error);
      throw error;
    }
  }
}

export class LogMediaItemUseCase {
  // Depend on the generic MediaInteractionPort
  constructor(private readonly mediaInteractionPort: MediaInteractionPort) {}

  async execute(input: LogMediaItemInput): Promise<LogMediaSuccessResponse> {
    if (!input.mediaType || !input.externalId || !input.logData) {
      throw new Error('Missing data for logging media item');
    }
    // Add specific validation for game ratings if needed
    if (
      input.mediaType === 'game' &&
      input.logData.rating !== undefined &&
      input.logData.rating !== null
    ) {
      console.warn(
        'Attempting to log a numeric rating for a game, which might be ignored.'
      );
      // Optionally clear the rating: input.logData.rating = null;
    }
    try {
      // Call the corresponding method on the generic port
      const response = await this.mediaInteractionPort.logMediaItem(input);
      if ('error' in response) throw new Error(response.error);
      return response;
    } catch (error) {
      console.error('Error in LogMediaItemUseCase:', error);
      throw error;
    }
  }
}

export class SearchMediaUseCase {
  // Depend on the generic MediaInteractionPort
  constructor(private readonly mediaInteractionPort: MediaInteractionPort) {}

  async execute(input: SearchMediaInput): Promise<SearchMediaSuccessResponse> {
    if (!input.query) {
      throw new Error('Search query is required');
    }
    try {
      // Call the corresponding method on the generic port
      const response = await this.mediaInteractionPort.searchMedia(input);
      if ('error' in response) throw new Error(response.error);
      return response;
    } catch (error) {
      console.error('Error in SearchMediaUseCase:', error);
      throw error;
    }
  }
}

export class RemoveMediaLogUseCase {
  // Depend on the generic MediaInteractionPort
  constructor(private readonly mediaInteractionPort: MediaInteractionPort) {}

  async execute(input: RemoveMediaLogInput): Promise<ToggleSuccessResponse> {
    if (!input.mediaType || !input.externalId) {
      throw new Error('MediaType and ExternalId are required to remove log');
    }
    try {
      // Call the corresponding method on the generic port
      const response = await this.mediaInteractionPort.removeMediaLog(input);
      if ('error' in response) throw new Error(response.error);
      return response;
    } catch (error) {
      console.error('Error in RemoveMediaLogUseCase:', error);
      throw error;
    }
  }
}

export class GetMediaDetailsUseCase {
  // Depend on the generic MediaInteractionPort
  constructor(private readonly mediaInteractionPort: MediaInteractionPort) {}

  async execute(input: GetMediaInput): Promise<GetMediaDetailsResponse> {
    // Basic validation
    if (!input.mediaType || !input.externalId) {
      throw new Error('MediaType and ExternalId are required to get details');
    }
    console.log(
      `APPLICATION (Use Case): Getting details for ${input.mediaType} - ${input.externalId}`
    );

    try {
      // Call the corresponding method on the generic port
      const response = await this.mediaInteractionPort.getMediaDetails(input);

      // Handle potential ResponseError returned by the port implementation
      if ('error' in response) {
        console.error(
          `APPLICATION (Use Case): Error from port: ${response.error}`
        );
        // You might want to throw a more specific application-level error here
        throw new Error(response.error);
      }

      // Return the successful response containing the MediaItem or null
      return response;
    } catch (error) {
      // Re-throw or handle specific application errors
      console.error('Error in GetMediaDetailsUseCase:', error);
      // Ensure a consistent error type is thrown if needed
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get media details'
      );
    }
  }
}
