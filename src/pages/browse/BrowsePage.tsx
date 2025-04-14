// src/pages/BrowsePage.tsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMovieGenres } from '../../hooks/useMovieGenres'; // Import hook
import FiltersSidebar from '../../components/ui/filter/FiltersSideBar'; // Import sidebar
import MovieList from '../../components/movies/MovieList';
import Pagination from '../../components/ui/pagination/Pagination'; // Correct import path
import styles from './BrowsePage.module.css';
import { DiscoverMovieOptions } from '../../types/tmdb';
import { discoverMovies } from '../../lib/tmdb';

function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Read state from URL ---
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sort_by') || 'popularity.desc';
  const genreParam = searchParams.get('with_genres') || '';
  const minVotesParam = searchParams.get('min_votes') || '0'; // Default to '0' string
  const currentMinVotes = parseInt(minVotesParam, 10) || 0; // Parse, default to 0 number

  const currentSelectedGenres = genreParam ? genreParam.split(',') : [];

  // --- Fetch Genres ---
  const { data: genres, isLoading: isLoadingGenres } = useMovieGenres();

  // --- Prepare Discover Options ---
  const discoverOptions: DiscoverMovieOptions = React.useMemo(
    () => ({
      // Memoize options
      page: currentPage,
      sort_by: sortBy,
      with_genres: genreParam || undefined,
      // Map state name 'minVotes' to API param 'vote_count.gte'
      'vote_count.gte': currentMinVotes > 0 ? currentMinVotes : undefined,
    }),
    [currentPage, sortBy, genreParam, currentMinVotes]
  );

  // --- Fetch Movies Query ---
  const {
    data: movieData,
    isLoading: isLoadingMovies,
    isFetching: isFetchingMovies,
    error: errorMovies,
    isPlaceholderData,
  } = useQuery({
    // Query key MUST include all parameters
    queryKey: ['movies', 'discover', discoverOptions],
    queryFn: () => discoverMovies(discoverOptions),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
  });

  // --- Handlers for Updating URL ---
  const updateSearchParams = (newParams: Record<string, string>) => {
    const currentParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      // Handle removing param if value is empty or default (like 0 for minVotes)
      if (value && !(key === 'min_votes' && value === '0')) {
        currentParams.set(key, value);
      } else {
        currentParams.delete(key);
      }
    });
    currentParams.set('page', '1'); // Reset page on filter change
    setSearchParams(currentParams);
    window.scrollTo(0, 0);
  };

  const handlePageChange = (newPage: number) => {
    /* ... same as before ... */
  };
  const handleSortChange = (newSortBy: string) =>
    updateSearchParams({ sort_by: newSortBy });
  const handleGenreChange = (newSelectedGenreIds: string[]) =>
    updateSearchParams({ with_genres: newSelectedGenreIds.join(',') });
  const handleMinVotesChange = (newMinVotes: string) =>
    updateSearchParams({ min_votes: newMinVotes.toString() }); // Convert number to string for URL

  return (
    <div className={styles.browseContainer}>
      {/* --- Render Filters Sidebar --- */}
      <FiltersSidebar
        genres={genres}
        isLoadingGenres={isLoadingGenres}
        currentSortBy={sortBy}
        currentGenres={currentSelectedGenres}
        currentMinVotes={currentMinVotes} // Pass current value
        onSortChange={handleSortChange}
        onGenreChange={handleGenreChange}
        onMinVotesChange={handleMinVotesChange} // Pass handler
      />

      <main className={styles.mainContent}>
        {/* ... (rest of the component remains the same) ... */}
        <h1 className={styles.pageTitle}>Browse Movies</h1>
        {errorMovies && (
          <p className={styles.errorMessage}>Could not load movies.</p>
        )}
        <MovieList
          movies={movieData?.results}
          isLoading={isLoadingMovies || isFetchingMovies}
        />
        {movieData && movieData.total_pages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.min(movieData.total_pages, 500)}
            onPageChange={handlePageChange}
            isDisabled={isFetchingMovies && isPlaceholderData}
          />
        )}
      </main>
    </div>
  );
}

export default BrowsePage;
