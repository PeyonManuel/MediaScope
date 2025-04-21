// src/pages/BrowsePage.tsx
import React from 'react';
// --- TanStack Router Imports ---
import { useSearch, useNavigate } from '@tanstack/react-router';
// --- TanStack Query Import ---
import { useQuery } from '@tanstack/react-query';

// --- Your Hooks/Components/Lib Imports ---
import { useMovieGenres } from '../../hooks/useMovieGenres';
import FiltersSidebar from '../../components/ui/filter/FiltersSideBar';
import MovieList from '../../components/movies/MovieList';
import Pagination from '../../components/ui/pagination/Pagination';
import styles from './BrowsePage.module.css';
import { DiscoverMovieOptions } from '../../types/tmdb';
import { discoverMovies } from '../../lib/tmdb';
import { browseSearchSchema, browseRoute } from '../../routes/routes.ts'; // Import the schema type if needed elsewhere, or rely on inference

function BrowsePage() {
  // --- Read validated state from URL using TanStack Router ---
  const search = useSearch({ from: browseRoute.id }); // Get parsed & validated search params
  const navigate = useNavigate({ from: browseRoute.id });

  // Directly use the validated/defaulted values from search
  const currentPage = search.page;
  const sortBy = search.sort_by;
  const genreParam = search.with_genres; // String of IDs
  const currentMinVotes = search.min_votes; // Number

  // Derive selected genres array (remains the same logic)
  const currentSelectedGenres = genreParam ? genreParam.split(',') : [];

  // --- Fetch Genres (remains the same) ---
  const { data: genres, isLoading: isLoadingGenres } = useMovieGenres();

  // --- Prepare Discover Options using validated search params ---
  const discoverOptions: DiscoverMovieOptions = React.useMemo(
    () => ({
      page: currentPage,
      sort_by: sortBy,
      // Only include with_genres if it's not an empty string
      with_genres: genreParam || undefined,
      // Only include vote_count.gte if minVotes is greater than 0
      'vote_count.gte': currentMinVotes > 0 ? currentMinVotes : undefined,
    }),
    [currentPage, sortBy, genreParam, currentMinVotes]
  );

  // --- Fetch Movies Query (Query Key depends on derived options) ---
  const {
    data: movieData,
    isLoading: isLoadingMovies,
    isFetching: isFetchingMovies,
    error: errorMovies,
    isPlaceholderData,
  } = useQuery({
    // Query key MUST include all parameters that affect the result
    queryKey: ['movies', 'discover', discoverOptions], // Use the memoized options
    queryFn: () => discoverMovies(discoverOptions),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // --- Handlers for Updating URL using TanStack Router navigate ---

  // Helper to update search params, resetting page and removing defaults
  const updateFilters = (newFilters: Partial<typeof search>) => {
    navigate({
      search: (prev) => {
        const updated = {
          ...prev, // Keep existing params
          ...newFilters, // Overwrite with new ones
          page: 1, // Reset page on filter change
        };

        // Remove keys if they match the default values defined in the schema
        // to keep the URL clean
        if (updated.sort_by === 'popularity.desc') delete updated.sort_by;
        if (updated.with_genres === '') delete updated.with_genres;
        if (updated.min_votes === 0) delete updated.min_votes;
        // Page 1 is default, remove it too? Optional, depends on preference.
        // if (updated.page === 1) delete updated.page;

        return updated;
      },
      replace: true, // Replace history entry for filter changes
    });
    window.scrollTo(0, 0); // Keep scroll reset
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
      // Keep page changes in history (replace: false is default)
      // replace: false, // Optional: be explicit
    });
    // Optional: scroll to top on page change?
    // window.scrollTo(0, 0);
  };

  const handleSortChange = (newSortBy: string) =>
    updateFilters({ sort_by: newSortBy });

  const handleGenreChange = (newSelectedGenreIds: string[]) =>
    // Update with the joined string, or undefined if empty to remove from URL
    updateFilters({ with_genres: newSelectedGenreIds.join(',') || undefined });

  const handleMinVotesChange = (newMinVotesString: string) => {
    // Parse to number before updating state
    const newMinVotes = parseInt(newMinVotesString, 10) || 0;
    // Update with the number, or undefined if 0 to remove from URL
    updateFilters({ min_votes: newMinVotes > 0 ? newMinVotes : undefined });
  };

  // --- Render Logic (Pass validated state and new handlers) ---
  return (
    <div className={styles.browseContainer}>
      <FiltersSidebar
        genres={genres}
        isLoadingGenres={isLoadingGenres}
        currentSortBy={sortBy}
        currentGenres={currentSelectedGenres}
        currentMinVotes={currentMinVotes} // Pass number
        onSortChange={handleSortChange}
        onGenreChange={handleGenreChange}
        onMinVotesChange={handleMinVotesChange}
      />

      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Browse Movies</h1>
        {/* Error display */}
        {errorMovies && (
          <p className={styles.errorMessage}>Could not load movies.</p>
        )}
        {/* Movie List */}
        <MovieList
          movies={movieData?.results}
          isLoading={isLoadingMovies || isFetchingMovies}
        />
        {/* Pagination */}
        {movieData && movieData.total_pages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.min(movieData.total_pages, 500)} // TMDB limit
            onPageChange={handlePageChange}
            isDisabled={isFetchingMovies && isPlaceholderData}
          />
        )}
      </main>
    </div>
  );
}

export default BrowsePage;
