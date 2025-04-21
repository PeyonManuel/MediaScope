// src/features/movies/components/MovieCard.tsx
import React from 'react';
import { Link } from '@tanstack/react-router'; // Assuming React Router DOM
import type { Movie } from '../../types/tmdb'; // Adjust path
import { getImageUrl } from '../../lib/tmdb'; // Adjust path
import styles from './MovieCard.module.css'; // We'll create this CSS module next

interface MovieCardProps {
  movie: Movie;
}

// Use React.memo for performance if rendering many cards
const MovieCard: React.FC<MovieCardProps> = React.memo(({ movie }) => {
  const imageUrl = getImageUrl(movie.poster_path, 'w342'); // Smaller size for cards
  const placeholderImage = '/placeholder-poster.png'; // Provide a local placeholder

  return (
    <Link to={`/movie/${movie.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <img
          src={imageUrl || placeholderImage}
          alt={movie.title}
          className={styles.poster}
          // Add lazy loading for performance
          loading="lazy"
          // Handle image loading errors if desired
          onError={(e) => (e.currentTarget.src = placeholderImage)}
        />
        <div className={styles.info}>
          <h3 className={styles.title}>{movie.title}</h3>
          {/* Optional: Add rating */}
          <p className={styles.rating}>
            ⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>
    </Link>
  );
});

MovieCard.displayName = 'MovieCard'; // Helpful for React DevTools with React.memo

export default MovieCard;
