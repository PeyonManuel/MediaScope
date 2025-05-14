import { z } from 'zod';
import { createRoute } from '@tanstack/react-router';
import LoginPage from '../features/authentication/infraestructure/pages/login/LoginPage';
import RegisterPage from '../features/authentication/infraestructure/pages/register/RegisterPage';
import { rootRoute } from '../main';
// import BrowsePage from '../shared/pages/browse/BrowsePage';
import HomePage from '../shared/infraestructure/pages/home/HomePage';
import EditProfilePage from '../features/user/infraestructure/ui/pages/EditProfilePage/EditProfilePage';
import ViewProfilePage from '../features/user/infraestructure/ui/pages/ViewProfilePage/ViewProfilePage';
import ItemDetailsPage from '../features/item/infraestructure/ui/pages/ItemDetails/ItemDetailsPage';
import SearchMediaPage from '../features/item/infraestructure/ui/pages/SearchMedia/SearchMediaPage';
import { getMediaDetailsAniList } from '../shared/infraestructure/lib/anilistApi';
import { getMediaDetailsTmdb } from '../shared/infraestructure/lib/tmdbApi';
import {
  MediaItem,
  MediaType,
} from '../shared/infraestructure/lib/types/media.types';
import { QueryClient } from '@tanstack/react-query';
import { getMediaDetailsOpenLibrary } from '../shared/infraestructure/lib/googleBooksApi';

export const browseSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  sort_by: z.string().optional().catch('popularity.desc'),
  with_genres: z.string().optional().catch(''),
  min_votes: z.number().int().min(0).optional().catch(0),
});

export const viewProfileSchema = z.object({
  userId: z.string(),
});

// export const browseRoute = createRoute({
//   getParentRoute: () => rootRoute, // Link to your parent route
//   path: '/browse',
//   component: BrowsePage,
//   validateSearch: (search: Record<string, unknown>) => {
//     return browseSearchSchema.parse(search);
//   },
// });

export const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: SearchMediaPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
});

export const viewProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$userId',
  component: ViewProfilePage,
});

export const editProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/edit/profile',
  component: EditProfilePage,
});

// Define expected parameter types
interface ItemRouteParams {
  itemType: string;
  itemId: string;
}

// Define the expected data type returned by the loader
type ItemRouteLoaderData = MediaItem | null;

// --- Define Router Context Type ---
// This tells TypeScript what's available in the context passed to loaders/actions
interface AppRouterContext {
  queryClient: QueryClient;
  // Add other context properties if needed (e.g., auth state)
  // auth?: YourAuthContextType;
}

// --- Module Augmentation for TanStack Router ---
// This merges our AppRouterContext with the router's expected types
// Place this at the top level of the file or in a global .d.ts file
declare module '@tanstack/react-router' {
  interface Register {
    // router: typeof router; // Instance is created elsewhere, type inference handles it
  }
  // Extend the global RouterContext with our specific context shape
  interface RouterContext extends AppRouterContext {}
}

export const itemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$itemType/$itemId', // Corrected path syntax
  component: ItemDetailsPage,
  loader: async ({ params, context }): Promise<ItemRouteLoaderData> => {
    const { itemType, itemId } = params as ItemRouteParams; // Cast params
    const { queryClient } = context as AppRouterContext; // Get queryClient from context

    // Validate itemType
    const validTypes: MediaType[] = ['movie', 'tv', 'book', 'manga'];
    if (!validTypes.includes(itemType as MediaType)) {
      console.error(`Invalid itemType in URL: ${itemType}`);
      // Throw an error that the errorComponent can catch
      throw new Error(`Invalid media type "${itemType}" in URL.`);
    }
    const mediaType = itemType as MediaType;

    if (!itemId) {
      throw new Error('Missing item ID in URL.');
    }

    console.log(`LOADER: Fetching details for ${mediaType} - ${itemId}`);

    // --- Use ensureQueryData for Caching & Fetching ---
    // ensureQueryData tries to get data from cache. If not found or stale,
    // it calls queryFn, caches the result, and returns it.
    // It throws if queryFn fails.
    const queryKey = ['media', 'details', mediaType, itemId];

    const data = await queryClient.ensureQueryData<
      MediaItem | null,
      Error,
      MediaItem | null,
      typeof queryKey
    >({
      queryKey: queryKey,
      queryFn: async (): Promise<MediaItem | null> => {
        // Delegate to the appropriate external API adapter based on type
        switch (mediaType) {
          case 'movie':
          case 'tv':
            // Ensure ID is numeric if needed by TMDB function (might not be necessary if adapter handles string)
            return getMediaDetailsTmdb(itemId, mediaType);
          case 'book':
            return getMediaDetailsOpenLibrary(itemId);
          case 'manga':
            // Ensure ID is numeric if needed by AniList function
            return getMediaDetailsAniList(itemId);
          default:
            // This case is technically handled by validation above, but good practice
            console.warn(
              `Unsupported mediaType in loader queryFn: ${mediaType}`
            );
            return null;
        }
      },
      staleTime: 1000 * 60 * 60, // Cache details for 1 hour
      // gcTime (cacheTime in v5) defaults usually fine
    });

    return data; // Return the fetched (or cached) MediaItem or null
  },
});

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// TO IMPLEMENT
export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: () => {},
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});
