// src/features/movies/components/MovieList.tsx
import React from 'react';
import type { Movie } from '../../types/tmdb'; // Adjust path
import MovieCard from './MovieCard';
import styles from './MovieList.module.css';

interface MovieListProps {
  movies: Movie[] | undefined; // Array of movies or undefined if loading/error
  isLoading: boolean;
  // Optional: add error handling prop
}

// Basic Skeleton Card for Loading State
const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage}></div>
    <div className={styles.skeletonText}></div>
    <div className={`${styles.skeletonText} ${styles.skeletonTextShort}`}></div>
  </div>
);

const MovieList: React.FC<MovieListProps> = ({ movies, isLoading }) => {
  // Determine number of skeletons based on typical screen size
  const skeletonCount = 10; // Or calculate based on viewport?

  return (
    <div className={styles.listGrid}>
      {isLoading &&
        // Render skeletons while loading
        Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      {!isLoading &&
        movies &&
        movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      {/* Optional: Handle case where !isLoading and !movies (e.g., error or empty) */}
      {!isLoading && !movies?.length && (
        <p>No movies found.</p> // Or display error message
      )}
    </div>
  );
};

export default MovieList;
