import {
  MediaItem,
  MediaListApiResponse,
  MediaType,
  OpenLibrarySearchDoc,
  OpenLibrarySearchResponse,
  OpenLibraryWork,
} from './types/media.types';

const BASE_URL = 'https://openlibrary.org';
const COVER_BASE_URL = 'https://covers.openlibrary.org/b'; // Base URL for covers

// --- Image URL Helper ---
// Sizes: S, M, L
const getOpenLibraryCoverUrl = (
  coverId?: number | string | null,
  size: 'S' | 'M' | 'L' = 'L'
): string | null => {
  if (!coverId) return null;
  return `${COVER_BASE_URL}/id/${coverId}-${size}.jpg`;
};

// --- Normalization Helper ---
// Takes a search document and normalizes it
// For full details, a separate call to /works/{workId}.json might be needed
function normalizeOpenLibraryDoc(doc: OpenLibrarySearchDoc): MediaItem | null {
  if (!doc || !doc.key || !doc.title) return null;

  // Extract Work ID from key like "/works/OL45883W"
  const workIdMatch = doc.key.match(/\/works\/(OL\d+W)/);
  if (!workIdMatch) return null; // Only process works for now
  const externalId = workIdMatch[1]; // e.g., OL45883W

  // Determine type (basic guess)
  const mediaType: MediaType =
    doc.subject?.some((s) => /comics|graphic novels/i.test(s)) ?
      'manga'
    : 'book';
  const id = `${mediaType}-${externalId}`;

  // Basic details from search result
  const title = doc.title;
  const authors = doc.author_name ?? [];
  const releaseYear = doc.first_publish_year ?? null;
  const releaseDate = releaseYear ? `${releaseYear}-01-01` : null; // Only year usually available in search
  const posterUrl = getOpenLibraryCoverUrl(doc.cover_i, 'L');
  const genres = doc.subject?.slice(0, 5) ?? []; // Take first few subjects as genres

  // Rating needs checking - OpenLibrary ratings are less standard
  const averageScore =
    doc.ratings_average ? Math.round(doc.ratings_average * 2) : null; // Assume 0-5 -> 0-10?
  const voteCount = doc.ratings_count ?? null;

  return {
    id: id,
    externalId: externalId, // Open Library Work ID
    mediaType: mediaType,
    title: title,
    posterUrl: posterUrl,
    releaseDate: releaseDate,
    genres: genres,
    authors: authors,
    averageScore: averageScore,
    scoreSource: 'Open Library',
    voteCount: voteCount,
    // --- Fields likely needing details fetch ---
    originalTitle: null,
    backdropUrl: null,
    screenshots: null,
    description: null,
    // storyline: null,
    tagline: null,
    status: null,
    // originalLanguage: null,
    // countryOfOrigin: [],
    // tags: [],
    // themes: [],
    // ageRating: null,
    // metacriticScore: null,
    // homepage: null,
    externalLinks: null,
    // directors: [],
    artists: [],
    developers: [],
    publishers: doc.publisher ?? [],
    production_companies: null,
    // primaryVideo: null,
    videos: null,
    // runtimeMinutes: null,
    // numberOfSeasons: null,
    // numberOfEpisodes: null,
    pageCount: doc.number_of_pages_median ?? null,
    chapters: null,
    volumes: null,
    // playtimeHours: null,
    platforms: [],
    // popularity: null,
    slug: null,
  };
}

// --- API Fetch Helper ---
async function fetchOpenLibrary<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.append(key, String(value));
    }
  });
  // Always request JSON
  const url = `${BASE_URL}${endpoint}.json?${urlParams.toString()}`;
  console.log('Fetching Open Library URL:', url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Open Library API error (${response.status}): ${errorText}`
      );
      throw new Error(
        `Open Library request failed: ${response.statusText || errorText}`
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(
      `Network or parsing error fetching from Open Library endpoint "${endpoint}":`,
      error
    );
    throw error;
  }
}

// --- Adapter Functions ---

// Search Books/Manga
export const searchMediaOpenLibrary = async (
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<MediaListApiResponse> => {
  if (!query) return { page: 1, results: [], total_pages: 0, total_results: 0 };
  // Open Library uses 'page' parameter directly
  const apiResponse = await fetchOpenLibrary<OpenLibrarySearchResponse>(
    '/search',
    {
      q: query,
      page: page,
      limit: limit,
      // Optional: add fields param if needed, e.g., fields=key,title,author_name,cover_i,first_publish_year
    }
  );

  const normalizedResults = (apiResponse.docs ?? [])
    .map(normalizeOpenLibraryDoc) // Normalize search results
    .filter((item): item is MediaItem => item !== null); // Type guard

  const totalResults = apiResponse.numFound ?? 0;
  const totalPages = totalResults ? Math.ceil(totalResults / limit) : 0;

  return {
    page: page,
    results: normalizedResults,
    total_pages: totalPages,
    total_results: totalResults,
  };
};

// Get Book/Manga Details by Open Library Work ID (e.g., OL45883W)
export const getMediaDetailsOpenLibrary = async (
  workId: string
): Promise<MediaItem | null> => {
  if (!workId) return null;
  try {
    const workDetails = await fetchOpenLibrary<OpenLibraryWork>(
      `/works/${workId}`
    );
    if (!workDetails) return null;

    // --- Refined Normalization using Work details ---
    const mediaType: MediaType =
      workDetails.subjects?.some((s) => /comics|graphic novels/i.test(s)) ?
        'manga'
      : 'book';
    const id = `${mediaType}-${workId}`;
    const title = workDetails.title;
    const description =
      typeof workDetails.description === 'string' ?
        workDetails.description
      : workDetails.description?.value;
    const posterUrl = getOpenLibraryCoverUrl(workDetails.covers?.[0], 'L'); // Use first cover ID
    let releaseDate = null;
    if (workDetails.first_publish_date) {
      // Often just year or textual date
      const yearMatch = workDetails.first_publish_date.match(/\d{4}/);
      if (yearMatch) releaseDate = `${yearMatch[0]}-01-01`;
    }
    const genres = workDetails.subjects?.slice(0, 10) ?? []; // Limit subjects

    // Fetch author names (requires extra API calls - potentially slow)
    // Placeholder: Use author keys for now or implement author fetching
    const authors = workDetails.authors?.map((a) => a.author.key) ?? [];

    // Construct MediaItem
    const mediaItem: MediaItem = {
      id: id,
      externalId: workId,
      mediaType: mediaType,
      title: title,
      posterUrl: posterUrl,
      description: description || null,
      releaseDate: releaseDate,
      genres: genres,
      authors: authors,
      // Fill other fields with null/defaults or fetch more details (e.g., edition for page count)
      originalTitle: null,
      backdropUrl: null,
      screenshots: null,
      // storyline: null,
      tagline: null,
      status: 'Published',
      // originalLanguage: null,
      // countryOfOrigin: [],
      // tags: [],
      // themes: [],
      averageScore: null,
      scoreSource: 'Open Library',
      voteCount: null,
      // popularity: null,
      // ageRating: null,
      // metacriticScore: null,
      // homepage: null,
      externalLinks: [
        {
          site: 'Open Library',
          url: `https://openlibrary.org/works/${workId}`,
          category: 'official_site',
        },
      ],
      // directors: [],
      artists: [],
      developers: [],
      publishers: [],
      production_companies: null,
      // primaryVideo: null,
      videos: null,
      // runtimeMinutes: null,
      // numberOfSeasons: null,
      // numberOfEpisodes: null,
      pageCount: null,
      chapters: null,
      volumes: null,
      // playtimeHours: null,
      platforms: [],
    };

    // Optional: Fetch first edition details for page count/ISBNs (adds another API call)
    // const editionsResponse = await fetchOpenLibrary(`/works/${workId}/editions`, { limit: 1 });
    // const firstEdition = editionsResponse?.entries?.[0];
    // if (firstEdition?.number_of_pages) mediaItem.pageCount = firstEdition.number_of_pages;
    // Add ISBNs to externalLinks...

    return mediaItem;
  } catch (error) {
    console.error(`Error fetching Open Library details for ${workId}:`, error);
    return null; // Return null on error
  }
};

// Get Newest/Popular Books (Open Library doesn't have simple endpoints for this)
// You might query subjects like 'new releases' or sort search results by date,
// but it's less direct than other APIs.
export const getNewestBooksOpenLibrary = async (
  page: number = 1
): Promise<MediaListApiResponse> => {
  console.warn(
    "Open Library doesn't have a direct 'newest' endpoint. Using recent subject search as proxy."
  );
  // Example: Search for books published recently in a subject
  // This requires knowing subject keys or using text search
  return searchMediaOpenLibrary(
    'subject:"new books" OR subject:"fiction"',
    page
  ); // Example proxy
};
