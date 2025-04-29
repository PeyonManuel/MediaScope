import { useQueries } from '@tanstack/react-query';
import { WatchedItem } from '../../../../../../lib/types/supabase';
import { Movie } from '../../../../../../lib/types/tmdb';
import { fetchMovieDetails } from '../../../../../../lib/tmdb';
import styles from './WatchedMovieList.module.css'; // Create or use existing CSS Module
import WatchedMovieCard from '../watchedMovieCard/WatchedMovieCard';

interface WatchedMovieListProps {
  watchedItems: WatchedItem[];
}

function WatchedMovieList({ watchedItems }: WatchedMovieListProps) {
  // --- Fetch TMDB Details for all Watched Movies using useQueries ---
  const movieDetailQueries = useQueries({
    // Create an array of query options, one for each watched movie
    queries: watchedItems.map((item) => {
      return {
        queryKey: ['movie', 'minimal', item.movie_id], // Unique key per movie
        queryFn: async (): Promise<Movie | null> => {
          // Fetch minimal details needed for the card
          // Using fetchMovieDetails might be overkill if it fetches everything.
          // Consider creating a fetchMovieSummary function if needed.
          // For now, we assume fetchMovieDetails returns enough data compatible with MovieSearchResult
          try {
            // Using fetchMovieDetails, ensure it returns data compatible with MovieSearchResult
            const details = await fetchMovieDetails(String(item.movie_id));
            // Return only the necessary fields if fetchMovieDetails returns more
            return details ?
                {
                  adult: details.adult,
                  backdrop_path: details.backdrop_path,
                  genre_ids: details.genres?.map((g) => g.id) ?? [], // Map genres if needed
                  id: details.id,
                  original_language: details.original_language,
                  original_title: details.original_title,
                  overview: details.overview,
                  popularity: details.popularity,
                  poster_path: details.poster_path,
                  release_date: details.release_date,
                  title: details.title,
                  video: details.video,
                  vote_average: details.vote_average,
                  vote_count: details.vote_count,
                }
              : null;
          } catch (error) {
            console.error(
              `Failed to fetch details for movie ${item.movie_id}`,
              error
            );
            return null; // Return null on error for this specific movie
          }
        },
        staleTime: Infinity, // Movie details rarely change, cache indefinitely
        cacheTime: Infinity,
        enabled: !!item.movie_id, // Ensure movie_id exists
        retry: 1, // Retry once on failure
      };
    }),
    // Optional: Configure combine behavior if needed
    // combine: (results) => { ... }
  });

  // --- Render Logic ---
  if (!watchedItems || watchedItems.length === 0) {
    return null; // Should be handled by parent, but good fallback
  }

  console.log('WatchedMovieList received items:', watchedItems);
  console.log('Movie Detail Query Results:', movieDetailQueries);

  return (
    <div className={styles.listGrid}>
      {/* Map over the original watchedItems array */}
      {watchedItems.map((item, index) => {
        // Find the corresponding query result for this item
        const queryResult = movieDetailQueries[index];
        return (
          <WatchedMovieCard
            key={item.movie_id} // Use movie_id as key
            watchedItem={item}
            // Pass the fetched movie details, loading, and error states
            movieDetails={queryResult?.data} // Data can be MovieSearchResult | null | undefined
            isLoadingDetails={queryResult?.isLoading || queryResult?.isFetching}
            isErrorDetails={queryResult?.isError}
          />
        );
      })}
    </div>
  );
}

export default WatchedMovieList;
