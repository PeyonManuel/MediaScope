// src/pages/HomePage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPopularMovies, fetchTopRatedMovies } from '../../lib/tmdb'; // Adjust path
import MovieList from '../../components/movies/MovieList'; // Adjust path
import styles from './HomePage.module.css'; // Create this file next

function HomePage() {
  // Fetch Popular Movies using TanStack Query
  const {
    data: popularMoviesData,
    isLoading: isLoadingPopular,
    error: errorPopular, // Optional: handle error display
  } = useQuery({
    queryKey: ['movies', 'popular'], // Unique key for this query
    queryFn: () => fetchPopularMovies(1), // Fetch page 1
    staleTime: 1000 * 60 * 60,
  });

  // Fetch Top Rated Movies using TanStack Query
  const {
    data: topRatedMoviesData,
    isLoading: isLoadingTopRated,
    error: errorTopRated, // Optional: handle error display
  } = useQuery({
    queryKey: ['movies', 'top_rated'], // Unique key for this query
    queryFn: () => fetchTopRatedMovies(1), // Fetch page 1
    staleTime: 1000 * 60 * 60,
  });

  // Optional: Log errors
  if (errorPopular)
    console.error('Error fetching popular movies:', errorPopular);
  if (errorTopRated)
    console.error('Error fetching top rated movies:', errorTopRated);

  return (
    <div className={styles.homeContainer}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Popular Movies</h2>
        {/* Optional: Display error message */}
        {errorPopular && (
          <p className={styles.errorMessage}>Could not load popular movies.</p>
        )}
        <MovieList
          movies={popularMoviesData?.results}
          isLoading={isLoadingPopular}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Rated Movies</h2>
        {/* Optional: Display error message */}
        {errorTopRated && (
          <p className={styles.errorMessage}>
            Could not load top rated movies.
          </p>
        )}
        <MovieList
          movies={topRatedMoviesData?.results}
          isLoading={isLoadingTopRated}
        />
      </section>

      {/* Add more sections here (e.g., Now Playing, Upcoming) */}
    </div>
  );
}

export default HomePage;
