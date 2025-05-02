import {
  MediaItem,
  MediaListApiResponse,
  SteamSpyApp,
  SteamSpyDetailResponse,
  SteamSpyListResponse,
} from './types/media.types';

const API_KEY = import.meta.env.VITE_STEAMSPY_API_KEY; // May not be needed
const BASE_URL = 'https://steamspy.com/api.php';

// --- Normalization Helper ---
// Takes raw SteamSpy app data and returns a standardized MediaItem object
function normalizeSteamSpyGame(item: SteamSpyApp): MediaItem | null {
  if (!item || !item.appid || !item.name) return null;
  const id = `game-${item.appid}`; // Use appid

  // --- Images ---
  // Use header_image for both poster and backdrop as it's often the only one
  const posterUrl = item.header_image || null;
  const backdropUrl = item.header_image || null;

  // --- Date ---
  // Attempt to parse textual date (e.g., "Oct 2, 2007")
  let releaseDate: string | null = null;
  if (item.release_date) {
    try {
      // Simple parsing attempt, might need a more robust library for various formats
      const parsed = new Date(item.release_date);
      if (!isNaN(parsed.getTime())) {
        releaseDate = parsed.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn(
        `Could not parse SteamSpy release date: ${item.release_date}`
      );
    }
  }

  // --- Categories ---
  // Use 'genre' field (comma-separated) and 'tags' object
  const genres =
    item.genre
      ?.split(',')
      .map((g) => g.trim())
      .filter(Boolean) ?? [];
  const tags = item.tags ? Object.keys(item.tags) : [];

  // --- Companies ---
  const developers =
    item.developer
      ?.split(',')
      .map((d) => d.trim())
      .filter(Boolean) ?? [];
  const publishers =
    item.publisher
      ?.split(',')
      .map((p) => p.trim())
      .filter(Boolean) ?? [];

  // --- Rating ---
  // Calculate positive ratio, store total votes. No average score.
  const positiveVotes = item.positive ?? 0;
  const negativeVotes = item.negative ?? 0;
  const totalVotes = positiveVotes + negativeVotes;
  // Calculate a 0-10 score based on positive percentage *if* there are enough votes
  const averageScore =
    (
      totalVotes > 10 // Threshold for calculation
    ) ?
      parseFloat(((positiveVotes / totalVotes) * 10).toFixed(1))
    : null;
  const voteCount = totalVotes > 0 ? totalVotes : null;

  // --- Playtime ---
  // Convert average_forever (minutes) to hours
  const playtimeHours =
    item.average_forever ? Math.round(item.average_forever / 60) : null;

  // --- Links ---
  const externalLinks = [
    {
      site: 'Steam',
      url: `https://store.steampowered.com/app/${item.appid}`,
      category: 'steam',
    },
  ];
  // if (item.website) externalLinks.push({ site: 'Official', url: item.website, category: 'official' }); // Website not usually in API

  return {
    // Core Identifiers
    id: id,
    externalId: String(item.appid), // Steam App ID
    mediaType: 'game',
    slug: null, // No slug from SteamSpy

    // Titles
    title: item.name,
    originalTitle: item.name, // Assume same

    // Imagery
    posterUrl: posterUrl,
    backdropUrl: backdropUrl,
    screenshots: null, // Not provided by SteamSpy

    // Descriptions
    description: item.about_the_game || item.short_description || null, // Use longer description if available
    tagline: item.short_description || null, // Use short desc as tagline
    // storyline: null,

    // Dates & Status
    releaseDate: releaseDate,
    status:
      releaseDate && new Date(releaseDate) > new Date() ?
        'Upcoming'
      : 'Released', // Basic inference
    // originalLanguage: null, // Not directly provided
    // countryOfOrigin: [],

    // Categorization
    genres: genres,
    // tags: tags,
    // themes: [], // No specific themes field

    // Ratings & Popularity
    averageScore: averageScore, // Calculated positive ratio (0-10)
    scoreSource: 'Steam User Votes',
    voteCount: voteCount, // Total positive + negative votes
    // // popularity:
    //   item.owners ?
    //     parseInt(item.owners.split(' .. ')[0].replace(/,/g, ''), 10)
    //   : null, // Use lower bound of owner estimate
    // ageRating: null, // No ESRB/PEGI
    // metacriticScore: null,

    // Links
    // homepage: null, // Not directly provided
    externalLinks: externalLinks,

    // Credits
    // directors: [],
    authors: [],
    artists: [],
    developers: developers,
    publishers: publishers,
    production_companies: null,

    // Videos
    primaryVideo: null,

    // Type-Specific Length/Size
    runtimeMinutes: null,
    numberOfSeasons: null,
    numberOfEpisodes: null,
    pageCount: null,
    chapters: null,
    volumes: null,
    playtimeHours: playtimeHours, // Added playtime
    platforms: [], // SteamSpy often focuses on Steam data, platforms might need other source
  };
}

// --- API Fetch Helper for SteamSpy ---
// Handles fetching and adding format=json
async function fetchSteamSpy<T>(
  params: Record<string, string | number>
): Promise<T> {
  // Add API key if required by the endpoint/your plan
  const urlParams = new URLSearchParams({
    // request: endpointName, // Parameter name might vary, e.g., 'request'
    ...Object.entries(params).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    ),
  });
  // if (API_KEY) urlParams.append('key', API_KEY); // Add key if needed

  const url = `${BASE_URL}?${urlParams.toString()}`;
  console.log('Fetching SteamSpy URL:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SteamSpy API error (${response.status}): ${errorText}`);
      throw new Error(
        `SteamSpy request failed: ${response.statusText || errorText}`
      );
    }
    // SteamSpy returns JSON
    return (await response.json()) as T;
  } catch (error) {
    console.error(
      `Network or parsing error fetching from SteamSpy endpoint:`,
      error
    );
    throw error;
  }
}

// --- Adapter Functions (Exported) ---

// Search Games (using the 'all' endpoint and filtering client-side)
// NOTE: This is inefficient! Fetches ALL games. Not recommended for production search.
// A better approach might use their tag/genre endpoints if applicable.
export const searchMediaSteamSpy = async (
  query: string,
  page: number = 1
): Promise<MediaListApiResponse> => {
  console.warn(
    "SteamSpy search uses the 'all' endpoint - may be very slow and incomplete."
  );
  if (!query) return { page: 1, results: [], total_pages: 0, total_results: 0 };

  // Fetch ALL games (no pagination, no server-side search query param)
  const apiResponse = await fetchSteamSpy<SteamSpyListResponse>({
    request: 'all',
  });
  const lowerCaseQuery = query.toLowerCase();

  // Client-side filter
  const filteredResults = Object.values(apiResponse ?? {})
    .filter((item) => item.name?.toLowerCase().includes(lowerCaseQuery))
    .map((item) => normalizeSteamSpyGame(item))
    .filter((item): item is MediaItem => item !== null);

  // Fake pagination for consistency (only returns first page)
  const pageSize = 20;
  const resultsPage = filteredResults.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const totalResults = filteredResults.length;
  const totalPages = Math.ceil(totalResults / pageSize);

  return {
    page: page,
    results: resultsPage,
    total_pages: totalPages,
    total_results: totalResults,
  };
};

// Get Game Details by Steam AppID
export const getMediaDetailsSteamSpy = async (
  appid: string | number
): Promise<MediaItem | null> => {
  const apiResponse = await fetchSteamSpy<SteamSpyDetailResponse>({
    request: 'appdetails',
    appid: String(appid),
  });
  return apiResponse ? normalizeSteamSpyGame(apiResponse) : null;
};

// Get Popular Games (using top100in2weeks endpoint)
export const getPopularGamesSteamSpy = async (
  page: number = 1
): Promise<MediaListApiResponse> => {
  // This endpoint doesn't support pagination, returns top 100 only
  if (page > 1)
    return { page: page, results: [], total_pages: 1, total_results: 0 };

  const apiResponse = await fetchSteamSpy<SteamSpyListResponse>({
    request: 'top100in2weeks',
  });
  const normalizedResults = Object.values(apiResponse ?? {})
    .map(normalizeSteamSpyGame)
    .filter((item): item is MediaItem => item !== null);

  return {
    page: 1,
    results: normalizedResults,
    total_pages: 1,
    total_results: normalizedResults.length,
  };
};

// Get Top Rated Games (using positive vote count as proxy)
// NOTE: This fetches ALL games and sorts client-side - VERY INEFFICIENT
export const getHighlyRatedGamesSteamSpy = async (
  page: number = 1
): Promise<MediaListApiResponse> => {
  console.warn(
    "SteamSpy 'top rated' fetches ALL games and sorts by positive votes - may be very slow."
  );
  const apiResponse = await fetchSteamSpy<SteamSpyListResponse>({
    request: 'all',
  });

  const allGames = Object.values(apiResponse ?? {});

  // Sort by positive votes descending
  allGames.sort((a, b) => (b.positive ?? 0) - (a.positive ?? 0));

  // Client-side pagination
  const pageSize = 20;
  const resultsPage = allGames
    .slice((page - 1) * pageSize, page * pageSize)
    .map((item) => normalizeSteamSpyGame(item))
    .filter((item): item is MediaItem => item !== null);
  const totalResults = allGames.length;
  const totalPages = Math.ceil(totalResults / pageSize);

  return {
    page: page,
    results: resultsPage,
    total_pages: totalPages,
    total_results: totalResults,
  };
};
