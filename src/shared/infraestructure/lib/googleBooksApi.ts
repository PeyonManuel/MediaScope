import {
  GoogleBooksApiResponse,
  GoogleBooksVolumeItem,
  MediaItem,
  MediaListApiResponse,
} from './types/media.types';

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY; // Get from .env
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// --- Normalization Helper ---
// Takes a raw Google Books Volume item and returns a standardized MediaItem
function normalizeGoogleBook(item: GoogleBooksVolumeItem): MediaItem | null {
  // Basic check for essential data
  if (!item?.id || !item?.volumeInfo?.title) return null;

  const vi = item.volumeInfo;
  // Determine media type based on categories (simple check)
  const mediaType =
    vi.categories?.some((cat) => /comics|graphic novels/i.test(cat)) ?
      'manga'
    : 'book';
  const id = `${mediaType}-${item.id}`; // Use composite ID

  // Normalize release date (YYYY, YYYY-MM, YYYY-MM-DD)
  let releaseDate = null;
  if (vi.publishedDate) {
    if (/^\d{4}$/.test(vi.publishedDate)) {
      // Year only
      releaseDate = `${vi.publishedDate}-01-01`;
    } else if (/^\d{4}-\d{2}$/.test(vi.publishedDate)) {
      // Year-Month
      releaseDate = `${vi.publishedDate}-01`;
    } else {
      // Assume full date or other format, take first part
      releaseDate = vi.publishedDate.split('T')[0];
    }
  }

  // Normalize rating (Google Books uses 0-5, convert to 0-10)
  const averageScore =
    vi.averageRating ? Math.round(vi.averageRating * 2) : null;

  // Extract external links (ISBNs, Google links)
  const externalLinks = [];
  if (vi.infoLink)
    externalLinks.push({ site: 'Google Books', url: vi.infoLink });

  // Return the normalized MediaItem structure
  return {
    id: id,
    externalId: item.id, // Google Books ID is a string
    mediaType: mediaType,
    title: vi.title,
    originalTitle: null, // Google Books API doesn't typically provide a separate original title
    posterUrl:
      vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail || null,
    backdropUrl: vi.imageLinks?.thumbnail || null, // Use larger images as backdrop fallback
    description: vi.description || null,
    releaseDate: releaseDate,
    genres: vi.categories || [],
    averageScore: averageScore,
    scoreSource: 'Google Books',
    voteCount: vi.ratingsCount ?? null, // Use ratingsCount if available
    pageCount: vi.pageCount ?? null,
    authors: vi.authors || [], // Authors array
    publishers: vi.publisher ? [vi.publisher] : [], // Publisher string to array
    status: 'Published', // Assume published if found via API
    // originalLanguage: vi.language, // e.g., 'en'
    // externalLinks: externalLinks.length > 0 ? externalLinks : null,
    // Fields less relevant to books often set to null/empty
    tagline: null,
    // runtimeMinutes: null,
    // popularity: null, // No direct popularity metric
    // ageRating: null,
  };
}

// --- API Fetch Helper ---
// Handles fetching from Google Books API, accepting query params and optional path
async function fetchGoogleBooks(params = {}, path = '') {
  if (!API_KEY) {
    console.error('Google Books API Key is missing!');
    throw new Error('Google Books API Key missing');
  }
  // Ensure path starts with '/' if provided
  const pathSegment =
    path && path.startsWith('/') ? path
    : path ? `/${path}`
    : '';
  const urlParams = new URLSearchParams({ key: API_KEY });

  // Append other parameters, ensuring values are strings
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.append(key, String(value));
    }
  });

  const url = `${BASE_URL}${pathSegment}?${urlParams.toString()}`;
  console.log('Fetching Google Books URL:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      console.error(`Google Books API error (${response.status}):`, errorBody);
      // Extract error message if possible
      const message =
        errorBody?.error?.message || errorBody?.message || response.statusText;
      throw new Error(`Google Books request failed: ${message}`);
    }
    return await response.json(); // Return parsed JSON
  } catch (error) {
    console.error(
      `Network or parsing error fetching Google Books URL "${url}":`,
      error
    );
    throw error; // Re-throw
  }
}

// --- Adapter Functions (Exported) ---

// Define MediaListApiResponse using the generic MediaItem for consistency
// interface MediaListApiResponse { page?: number; results: MediaItem[]; total_pages?: number; total_results?: number; } // Assuming MediaItem is imported

// Search Books/Manga
export const searchMediaGoogleBooks = async (
  query: string,
  page = 1,
  maxResults = 20
) => {
  if (!query) return { page: 1, results: [], total_pages: 0, total_results: 0 };
  const pageIndex = Math.max(0, page - 1);
  const apiResponse = await fetchGoogleBooks({
    q: query,
    startIndex: pageIndex * maxResults,
    maxResults: maxResults,
    // projection: 'lite' // Use 'lite' for potentially faster search results
  });
  const normalizedResults: GoogleBooksApiResponse = (apiResponse.items ?? [])
    .map(normalizeGoogleBook)
    .filter((item: GoogleBooksVolumeItem) => item !== null); // Filter out nulls from normalization
  const totalPages =
    apiResponse.totalItems ? Math.ceil(apiResponse.totalItems / maxResults) : 0;
  return {
    page: page,
    results: normalizedResults,
    total_pages: totalPages,
    total_results: apiResponse.totalItems ?? 0,
  };
};

// Get Details for a specific Book/Manga by its Google Books Volume ID
export const getMediaDetailsGoogleBooks = async (
  id: string
): Promise<MediaItem | null> => {
  if (!id) return null;
  // Fetch details using the volume ID in the path
  const item = await fetchGoogleBooks({}, `/${id}`); // Pass ID as path segment
  return normalizeGoogleBook(item); // Normalize the single result
};

// Get Newest Books (example implementation)
export const getNewestBooks = async (
  page = 1,
  maxResults = 20
): Promise<MediaListApiResponse> => {
  const pageIndex = Math.max(0, page - 1);
  // Using a broad subject search combined with newest ordering
  const apiResponse = await fetchGoogleBooks({
    q: 'subject:fiction', // Example broad query, adjust as needed
    orderBy: 'newest',
    startIndex: pageIndex * maxResults,
    maxResults: maxResults,
  });
  const normalizedResults: MediaItem[] = (apiResponse.items ?? [])
    .map(normalizeGoogleBook)
    .filter((item: GoogleBooksVolumeItem) => item !== null);
  const totalPages =
    apiResponse.totalItems ? Math.ceil(apiResponse.totalItems / maxResults) : 0;
  return {
    page: page,
    results: normalizedResults,
    total_pages: totalPages, // May be inaccurate for broad queries
    total_results: apiResponse.totalItems ?? 0,
  };
};
