// src/features/search/components/SearchPage.tsx (Example path in vertical slice)
// Or src/pages/SearchPage.tsx in horizontal structure
// Refactored to use a Use Case following Hexagonal principles + Pagination
// Corrected for TanStack Query v5 placeholderData

import React, { useState, useEffect } from 'react';
// --- Import keepPreviousData from TanStack Query v5 ---
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import styles from './SearchMoviesPage.module.css'; // CSS Module
import { searchMoviesUseCase } from '../../../../useCases';
import { ResponseError, SearchMovieSuccess } from '../../../../domain';
import Pagination from '../../../../../../shared/infraestructure/components/ui/pagination/Pagination';
import MovieList from '../../components/MovieList/MovieList';

const DEBOUNCE_DELAY = 500; // Delay in ms before triggering search

function SearchMoviesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const searchResultsQueryKey = [
    'search',
    'movies',
    debouncedSearchTerm,
    currentPage,
  ];
  const {
    data: searchResults,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<SearchMovieSuccess, ResponseError>({
    queryKey: searchResultsQueryKey,
    queryFn: async (): Promise<SearchMovieSuccess> => {
      console.log(
        `UI: Calling SearchMoviesUseCase for query: "${debouncedSearchTerm}", page: ${currentPage}`
      );
      const response = await searchMoviesUseCase.execute({
        query: debouncedSearchTerm,
        page: currentPage,
      });
      return response;
    },
    enabled: !!debouncedSearchTerm, // Only run if debounced term exists
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData, // <-- Replaced keepPreviousData: true
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate total pages (handle potential TMDB limit of 500)
  const totalPages =
    searchResults ? Math.min(searchResults.total_pages, 500) : 0;

  return (
    <div className={styles.searchPageContainer}>
      <h1 className={styles.pageTitle}>Search Movies</h1>

      <div className={styles.searchBar}>
        <input
          autoFocus
          type="search"
          placeholder="Search for a movie..."
          value={searchTerm}
          onChange={handleInputChange}
          className={styles.searchInput}
          aria-label="Search for movies"
        />
      </div>

      <div className={styles.resultsContainer}>
        {isLoading && !searchResults && (
          <p className={styles.loadingMessage}>Searching...</p>
        )}

        {isError && (
          <p className={styles.errorMessage}>
            Error searching movies: {error?.error || 'Unknown error'}
          </p>
        )}

        {!isLoading &&
          !isError &&
          debouncedSearchTerm &&
          searchResults?.results.length === 0 && (
            <p className={styles.noResultsMessage}>
              No results found for "{debouncedSearchTerm}".
            </p>
          )}

        {searchResults && searchResults.results.length > 0 && (
          <>
            <MovieList
              movies={searchResults.results}
              isLoading={isFetching && !isLoading}
            />
            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  isDisabled={isFetching} // Disable pagination while fetching new page
                />
              </div>
            )}
          </>
        )}

        {/* Initial State / Empty Query */}
        {!debouncedSearchTerm && !isLoading && !isError && (
          <p className={styles.infoMessage}>Type above to search for movies.</p>
        )}
      </div>
    </div>
  );
}

export default SearchMoviesPage;
