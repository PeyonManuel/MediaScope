import { useState, useMemo, useEffect } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import styles from './HomePage.module.css'; // Ensure this CSS module exists
import {
  MediaItem,
  MediaType,
} from '../../infraestructure/lib/types/media.types';
import {
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTopRatedTv,
} from '../../infraestructure/lib/tmdbApi';
import { getNewestBooks } from '../../infraestructure/lib/googleBooksApi';
import {
  getTopRatedManga,
  getTrendingManga,
} from '../../infraestructure/lib/anilistApi';
import MediaList from '../../../features/item/infraestructure/ui/components/MediaList/MediaList';
import Pagination from '../../infraestructure/components/ui/pagination/Pagination';
import { getPopularGamesSteamSpy } from '../../infraestructure/lib/steamSpyApi';

// Define the structure returned by our list fetching functions
interface MediaListApiResponse {
  page?: number;
  results: MediaItem[];
  total_pages?: number;
  total_results?: number;
}

// Define available media types and list types
const AVAILABLE_MEDIA_TYPES: MediaType[] = [
  'movie',
  'tv',
  'game',
  'book',
  'manga',
];
// Define list types - map to display name and function key
const LIST_TYPES = {
  popular: 'Popular',
  top_rated: 'Top Rated',
  trending: 'Trending', // Specific to AniList?
  newest: 'Newest', // Specific to Books?
};
type ListTypeKey = keyof typeof LIST_TYPES;

function HomePage() {
  // --- State for selected types ---
  const [selectedMediaType, setSelectedMediaType] =
    useState<MediaType>('movie'); // Default to movie
  const [selectedListType, setSelectedListType] =
    useState<ListTypeKey>('popular'); // Default to popular
  const [page, setPage] = useState<number>(1);

  // --- Determine available list types for the selected media type ---
  const availableListTypes = useMemo((): ListTypeKey[] => {
    switch (selectedMediaType) {
      case 'movie':
        return ['popular', 'top_rated'];
      case 'tv':
        return ['popular', 'top_rated'];
      case 'game':
        return ['popular', 'top_rated']; // Using 'highly rated' for top_rated
      case 'book':
        return ['newest']; // Google Books primarily offers 'newest' easily
      case 'manga':
        return ['trending', 'top_rated']; // AniList offers these
      default:
        return [];
    }
  }, [selectedMediaType]);

  // --- Effect to reset list type if not available for new media type ---
  useEffect(() => {
    if (!availableListTypes.includes(selectedListType)) {
      setSelectedListType(availableListTypes[0] || 'popular'); // Default to first available or popular
    }
  }, [selectedMediaType, availableListTypes, selectedListType]);

  useEffect(() => {
    setPage(1);
  }, [selectedMediaType, selectedListType]);

  // --- Dynamic Query ---
  const queryKey = ['media', selectedListType, selectedMediaType, page]; // Key changes based on selection

  const {
    data: listData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<MediaListApiResponse, Error>({
    queryKey: queryKey, // Dynamic query key
    queryFn: async (): Promise<MediaListApiResponse> => {
      // --- Dynamically call the correct fetch function ---
      switch (selectedMediaType) {
        case 'movie':
          return selectedListType === 'popular' ?
              getPopularMovies(page)
            : getTopRatedMovies(page);
        case 'tv':
          return selectedListType === 'popular' ?
              getPopularTv(page)
            : getTopRatedTv(page);
        case 'game':
          // Map 'top_rated' to 'highly_rated' for games
          return getPopularGamesSteamSpy(page);
        case 'book':
          // Only 'newest' is easily available via Google Books API
          if (selectedListType === 'newest') return getNewestBooks(page);
          // Fallback for other list types for books (return empty or search a default term?)
          console.warn(
            `List type "${selectedListType}" not directly supported for Books.`
          );
          return { results: [], page: 1, total_pages: 0, total_results: 0 };
        case 'manga':
          return selectedListType === 'trending' ?
              getTrendingManga(page)
            : getTopRatedManga(page);
        default:
          // Should not happen with MediaType type safety, but include fallback
          console.error(`Unsupported media type: ${selectedMediaType}`);
          return { results: [], page: 1, total_pages: 0, total_results: 0 };
      }
    },
    staleTime: 1000 * 60 * 30, // Cache lists for 30 mins
    placeholderData: keepPreviousData, // Keep data while switching tabs/types
  });

  const items = listData?.results ?? [];
  const sectionTitle = `${LIST_TYPES[selectedListType]} ${selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)}s`; // Dynamic title

  return (
    <div className={styles.homeContainer}>
      {/* Media Type Selection Tabs */}
      <nav className={styles.mediaTypeTabs}>
        {AVAILABLE_MEDIA_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedMediaType(type)}
            className={`${styles.tabButton} ${selectedMediaType === type ? styles.active : ''}`}>
            {/* Capitalize for display */}
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </button>
        ))}
      </nav>

      {/* List Type Selection Tabs (conditional based on media type) */}
      <nav className={styles.listTypeTabs}>
        {availableListTypes.map((listType) => (
          <button
            key={listType}
            onClick={() => setSelectedListType(listType)}
            className={`${styles.subTabButton} ${selectedListType === listType ? styles.active : ''}`}>
            {LIST_TYPES[listType]} {/* Display friendly name */}
          </button>
        ))}
      </nav>

      {/* Dynamic Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{sectionTitle}</h2>

        {/* Error Display */}
        {isError && (
          <p className={styles.errorMessage}>
            Could not load {sectionTitle.toLowerCase()}: {error?.message}
          </p>
        )}

        {/* Media List */}
        <MediaList
          items={items}
          isLoading={isFetching}
          emptyMessage={`Could not load ${sectionTitle.toLowerCase()}.`}
        />
        <Pagination
          currentPage={page}
          totalPages={listData?.total_pages ?? 1}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </section>
    </div>
  );
}

export default HomePage;
