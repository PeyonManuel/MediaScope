// src/pages/SearchMediaPage/SearchMediaPage.tsx (Example path)
// Generic search page using SearchMediaUseCase

import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import styles from './SearchMediaPage.module.css'; // Rename CSS file accordingly
import { MediaType } from '../../../../../../shared/infraestructure/lib/types/media.types';
import { SearchMediaSuccessResponse } from '../../../../domain';
import { searchMediaUseCase } from '../../../../useCases';
import MediaList from '../../components/MediaList/MediaList';
import Pagination from '../../../../../../shared/infraestructure/components/ui/pagination/Pagination';
// --- Import generic types and components ---

const DEBOUNCE_DELAY = 500; // Delay in ms before triggering search

function SearchMediaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  // --- NEW: State for media type filter ---
  const [selectedMediaType, setSelectedMediaType] = useState<
    MediaType | undefined
  >(undefined); // Undefined means search all (if supported) or default

  // Debounce effect for search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1); // Reset page when search term changes
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when media type filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMediaType]);

  // TanStack Query using generic SearchMediaUseCase
  const searchResultsQueryKey = [
    'search',
    'media',
    selectedMediaType ?? 'all', // Include type in key ('all' if undefined)
    debouncedSearchTerm,
    currentPage,
  ];
  const {
    data: searchMediaResults, // Renamed variable
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<
    SearchMediaSuccessResponse, // Use generic success type
    Error // Use standard Error type
  >({
    queryKey: searchResultsQueryKey,
    queryFn: async (): Promise<SearchMediaSuccessResponse> => {
      console.log(
        `UI: Calling SearchMediaUseCase for query: "${debouncedSearchTerm}", type: ${selectedMediaType ?? 'all'}, page: ${currentPage}`
      );
      // Call the generic use case, passing the optional mediaType filter
      const response = await searchMediaUseCase.execute({
        query: debouncedSearchTerm,
        page: currentPage,
        mediaType: selectedMediaType, // Pass selected type
      });
      // Assuming use case throws Error on failure or returns SearchMediaSuccessResponse
      return response;
    },
    enabled: !!debouncedSearchTerm, // Only run if debounced term exists
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData, // v5 syntax
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle media type filter change
  const handleMediaTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    // Set to undefined if 'all' is selected, otherwise set to the MediaType
    setSelectedMediaType(value === 'all' ? undefined : (value as MediaType));
  };

  // Calculate total pages
  const totalPages =
    searchMediaResults ? Math.min(searchMediaResults.total_pages ?? 0, 500) : 0; // Handle TMDB limit if applicable
  const items = searchMediaResults?.results ?? []; // Get the items array

  return (
    <div className={styles.searchPageContainer}>
      <h1 className={styles.pageTitle}>Search Media</h1>

      {/* Search Bar and Filters */}
      <div className={styles.controlsContainer}>
        <div className={styles.searchBar}>
          <input
            autoFocus
            type="search"
            placeholder="Search movies, TV, books, games, manga..."
            value={searchTerm}
            onChange={handleInputChange}
            className={styles.searchInput}
            aria-label="Search all media"
          />
        </div>
        {/* Media Type Filter */}
        <div className={styles.filterGroup}>
          <label htmlFor="media-type-select">Type:</label>
          <select
            id="media-type-select"
            value={selectedMediaType ?? 'movie'}
            onChange={handleMediaTypeChange}
            className={styles.selectInput}>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
            <option value="book">Books</option>
            <option value="game">Games</option>
            <option value="manga">Manga</option>
          </select>
        </div>
      </div>

      {/* Results Section */}
      <div className={styles.resultsContainer}>
        {/* Loading State */}
        {isLoading && !searchMediaResults && (
          <p className={styles.loadingMessage}>Searching...</p>
        )}

        {/* Error State */}
        {isError && (
          <p className={styles.errorMessage}>
            Error searching media: {error?.message || 'Unknown error'}
          </p>
        )}

        {/* No Results State */}
        {!isLoading &&
          !isError &&
          debouncedSearchTerm &&
          items.length === 0 && (
            <p className={styles.noResultsMessage}>
              No {selectedMediaType || 'media'} found for "{debouncedSearchTerm}
              ".
            </p>
          )}

        {/* Results Display using MediaList */}
        {items.length > 0 && (
          <>
            <MediaList
              items={items} // Pass generic MediaItem array
              isLoading={isFetching && !isLoading} // Subtle loading for pagination
            />
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  isDisabled={isFetching}
                />
              </div>
            )}
          </>
        )}

        {/* Initial State / Empty Query */}
        {!debouncedSearchTerm && !isLoading && !isError && (
          <p className={styles.infoMessage}>Type above to search for media.</p>
        )}
      </div>
    </div>
  );
}

export default SearchMediaPage;
