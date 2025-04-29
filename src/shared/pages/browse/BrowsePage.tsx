// src/pages/BrowsePage.tsx
import React from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useMovieGenres } from '../../hooks/useMovieGenres';
import styles from './BrowsePage.module.css';
import { browseRoute } from '../../../routes/routes';
import { DiscoverMovieOptions } from '../../../lib/types/tmdb';
import { discoverMovies } from '../../../lib/tmdb';
import FiltersSidebar from '../../infraestructure/components/ui/filter/FiltersSideBar';
import Pagination from '../../infraestructure/components/ui/pagination/Pagination';
import MovieList from '../../../features/movie/infraestructure/ui/components/MovieList/MovieList';

function BrowsePage() {
  const search = useSearch({ from: browseRoute.id });
  const navigate = useNavigate({ from: browseRoute.id });

  const currentPage = search.page;
  const sortBy = search.sort_by;
  const genreParam = search.with_genres; // String of IDs
  const currentMinVotes = search.min_votes; // Number

  const currentSelectedGenres = genreParam ? genreParam.split(',') : [];

  const { data: genres, isLoading: isLoadingGenres } = useMovieGenres();

  const discoverOptions: DiscoverMovieOptions = React.useMemo(
    () => ({
      page: currentPage,
      sort_by: sortBy,
      // Only include with_genres if it's not an empty string
      with_genres: genreParam || undefined,
      // Only include vote_count.gte if minVotes is greater than 0
      'vote_count.gte':
        currentMinVotes && currentMinVotes > 0 ? currentMinVotes : undefined,
    }),
    [currentPage, sortBy, genreParam, currentMinVotes]
  );

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
