// src/infrastructure/external_apis/anilist/anilistApi.ts (Example path)

import {
  AniListApiResponse,
  AniListMedia,
  MediaItem,
  MediaListApiResponse,
} from './types/media.types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// --- GraphQL Queries ---
// Query for searching/listing Manga with sorting options
const LIST_MANGA_QUERY = `
  query ($search: String, $page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage perPage }
      media(search: $search, type: MANGA, sort: $sort) {
        id
        title { romaji english native }
        description(asHtml: false)
        format status startDate { year month day }
        chapters volumes genres averageScore meanScore popularity
        coverImage { extraLarge large color }
        bannerImage siteUrl
        staff(sort: RELEVANCE, perPage: 1, page: 1) { edges { role node { name { full } } } }
      }
    }
  }
`;
// Query for details
// --- FIXED: Replaced /* comment with # or removed ---
const GET_MANGA_DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA) {
      # Request all fields needed for details page
      id
      title { romaji english native }
      description(asHtml: false) # Request description as plain text
      format
      status
      startDate { year month day }
      endDate { year month day }
      chapters
      volumes
      genres
      averageScore # Score out of 100
      meanScore # Score out of 100
      popularity
      coverImage { extraLarge large medium color } # Get multiple cover sizes
      bannerImage
      staff(sort: RELEVANCE) { # Get staff (authors/artists)
        edges {
          role # e.g., "Story & Art", "Story", "Art"
          node { id name { full } }
        }
      }
      characters(sort: [ROLE, RELEVANCE], perPage: 10) { # Get main characters
        edges {
          role # MAIN, SUPPORTING, BACKGROUND
          node { id name { full } image { large } }
        }
      }
      siteUrl # Link to AniList page
      externalLinks { site url id } # Links to other sites (e.g., MyAnimeList)
    }
  }
`;

// --- Normalization Helper ---
function normalizeAniListMedia(item: AniListMedia): MediaItem | null {
  /* ... same as before ... */
  if (!item) return null;
  const id = `manga-${item.id}`;
  const title =
    item.title?.english ||
    item.title?.romaji ||
    item.title?.native ||
    'Unknown Title';
  let releaseDate = null;
  if (item.startDate?.year) {
    releaseDate = `${item.startDate.year}-${String(item.startDate.month ?? 1).padStart(2, '0')}-${String(item.startDate.day ?? 1).padStart(2, '0')}`;
  }
  const authors =
    item.staff?.edges
      ?.filter((e) => e.role === 'Story & Art' || e.role === 'Story')
      .map((e) => e.node.name.full) ?? [];
  const artists =
    item.staff?.edges
      ?.filter((e) => e.role === 'Art')
      .map((e) => e.node.name.full) ?? [];
  return {
    id: id,
    externalId: String(item.id),
    mediaType: 'manga',
    title: title,
    originalTitle: item.title?.native,
    posterUrl: item.coverImage?.extraLarge || item.coverImage?.large || null,
    backdropUrl: item.bannerImage,
    description: item.description || null,
    releaseDate: releaseDate,
    genres: item.genres || [],
    averageScore: item.averageScore ? item.averageScore / 10 : null,
    scoreSource: 'AniList',
    voteCount: item.popularity,
    chapters: item.chapters,
    volumes: item.volumes,
    status: item.status,
    authors: authors,
    artists: artists,
  };
}

// --- API Fetch Helper (no change) ---
async function fetchAniList<T>(
  query: string,
  variables: Record<string, any>
): Promise<T> {
  /* ... same as before ... */
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: query, variables: variables }),
  };
  try {
    const response = await fetch(ANILIST_API_URL, options);
    if (!response.ok) {
      throw new Error(`AniList API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.errors) {
      console.error('AniList GraphQL Errors:', data.errors);
      throw new Error(
        `GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`
      );
    }
    return data as T;
  } catch (error) {
    console.error('Error fetching from AniList:', error);
    throw error;
  }
}

// --- Adapter Functions ---

// Search (no change)
export const searchMediaAniList = async (
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  page: number;
  results: MediaItem[];
  total_pages: number;
  total_results: number;
}> => {
  /* ... same as before ... */
  const variables = { search: query, page, perPage, sort: ['SEARCH_MATCH'] }; // Sort by relevance for search
  const apiResponse = await fetchAniList<AniListApiResponse>(
    LIST_MANGA_QUERY,
    variables
  );
  const pageData = apiResponse.data?.Page;
  const normalizedResults = (pageData?.media ?? [])
    .map(normalizeAniListMedia)
    .filter((item) => item !== null) as MediaItem[];
  return {
    page: pageData?.pageInfo?.currentPage ?? 1,
    results: normalizedResults,
    total_pages: pageData?.pageInfo?.lastPage ?? 0,
    total_results: pageData?.pageInfo?.total ?? 0,
  };
};

// Get Details (no change)
export const getMediaDetailsAniList = async (
  id: string | number
): Promise<MediaItem | null> => {
  /* ... same as before ... */
  const variables = { id: Number(id) };
  const apiResponse = await fetchAniList<AniListApiResponse>(
    GET_MANGA_DETAILS_QUERY,
    variables
  );
  const mediaData = apiResponse.data?.Media;
  return mediaData ? normalizeAniListMedia(mediaData) : null;
};

// --- NEW: Trending Manga ---
export const getTrendingManga = async (
  page: number = 1,
  perPage: number = 20
): Promise<MediaListApiResponse> => {
  const variables = {
    page,
    perPage,
    sort: ['TRENDING_DESC', 'POPULARITY_DESC'],
  }; // Sort by trending, then popularity
  const apiResponse = await fetchAniList<AniListApiResponse>(
    LIST_MANGA_QUERY,
    variables
  );
  const pageData = apiResponse.data?.Page;
  const normalizedResults = (pageData?.media ?? [])
    .map(normalizeAniListMedia)
    .filter((item) => item !== null) as MediaItem[];
  return {
    page: pageData?.pageInfo?.currentPage ?? 1,
    results: normalizedResults,
    total_pages: pageData?.pageInfo?.lastPage ?? 0,
    total_results: pageData?.pageInfo?.total ?? 0,
  };
};

// --- NEW: Popular Manga ---
export const getPopularManga = async (
  page: number = 1,
  perPage: number = 20
): Promise<MediaListApiResponse> => {
  const variables = { page, perPage, sort: ['POPULARITY_DESC'] }; // Sort by popularity
  const apiResponse = await fetchAniList<AniListApiResponse>(
    LIST_MANGA_QUERY,
    variables
  );
  const pageData = apiResponse.data?.Page;
  const normalizedResults = (pageData?.media ?? [])
    .map(normalizeAniListMedia)
    .filter((item) => item !== null) as MediaItem[];
  return {
    page: pageData?.pageInfo?.currentPage ?? 1,
    results: normalizedResults,
    total_pages: pageData?.pageInfo?.lastPage ?? 0,
    total_results: pageData?.pageInfo?.total ?? 0,
  };
};

export const getTopRatedManga = async (
  page: number = 1,
  perPage: number = 20
): Promise<MediaListApiResponse> => {
  // Use SCORE_DESC for sorting by average score
  const variables = { page, perPage, sort: ['SCORE_DESC', 'POPULARITY_DESC'] }; // Sort by score, then popularity
  const apiResponse = await fetchAniList<AniListApiResponse>(
    LIST_MANGA_QUERY,
    variables
  );
  const pageData = apiResponse.data?.Page;
  const normalizedResults = (pageData?.media ?? [])
    .map(normalizeAniListMedia)
    .filter((item): item is MediaItem => item !== null); // Use type predicate
  return {
    page: pageData?.pageInfo?.currentPage ?? 1,
    results: normalizedResults,
    total_pages: pageData?.pageInfo?.lastPage ?? 0,
    total_results: pageData?.pageInfo?.total ?? 0,
  };
};
