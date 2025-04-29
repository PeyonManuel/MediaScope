// src/components/WatchedMovieList/WatchedMovieCard.tsx (Example path)

import React from 'react';
import { Link } from '@tanstack/react-router';
import styles from '../watchedMovieList/WatchedMovieList.module.css'; // Use the same CSS module for simplicity or create a new one
import { WatchedItem } from '../../../../../../lib/types/supabase';
import { Movie } from '../../../../../../lib/types/tmdb';
import { getImageUrl } from '../../../../../../lib/tmdb';
import MovieStarRating from '../../../../../movie/infraestructure/ui/components/MovieStarRating/MovieStarRating';
import { HeartIconFilled } from '../../../../../../shared/infraestructure/components/ui/svgs';

interface WatchedMovieCardProps {
  watchedItem: WatchedItem;
  movieDetails?: Movie | null; // TMDB details (optional while loading)
  isLoadingDetails: boolean;
  isErrorDetails: boolean;
}

function WatchedMovieCard({
  watchedItem,
  movieDetails,
  isLoadingDetails,
  isErrorDetails,
}: WatchedMovieCardProps) {
  const posterPath = movieDetails?.poster_path;
  const title = movieDetails?.title ?? `Movie ID: ${watchedItem.movie_id}`;
  const releaseYear =
    movieDetails?.release_date ?
      new Date(movieDetails.release_date).getFullYear()
    : '';
  const movieUrl = `/movie/${watchedItem.movie_id}`; // Link to detail page

  return (
    <div className={styles.movieCard}>
      <Link to={movieUrl} className={styles.posterLink}>
        {isLoadingDetails && (
          <div className={styles.posterPlaceholder}>Loading...</div>
        )}
        {isErrorDetails && (
          <div className={styles.posterPlaceholder}>Error</div>
        )}
        {!isLoadingDetails && !isErrorDetails && posterPath && (
          <img
            src={getImageUrl(posterPath, 'w342') || undefined} // Use appropriate size
            alt={`${title} Poster`}
            className={styles.posterImage}
            loading="lazy"
            onError={(e) => (e.currentTarget.src = '/placeholder-poster.png')} // Fallback
          />
        )}
        {!isLoadingDetails && !isErrorDetails && !posterPath && (
          <div className={styles.posterPlaceholder}>No Image</div>
        )}
      </Link>
      <div className={styles.cardInfo}>
        <Link to={movieUrl} className={styles.titleLink}>
          <h3 className={styles.movieTitle}>{title}</h3>
        </Link>
        {releaseYear && <span className={styles.movieYear}>{releaseYear}</span>}

        {watchedItem.rating !== null && (
          <div className={styles.userRating}>
            <MovieStarRating
              disabled={true}
              currentRating={watchedItem.rating}
            />
          </div>
        )}
        {watchedItem.liked && (
          <span className={styles.likedIndicator}>
            <HeartIconFilled />
          </span>
        )}
        {watchedItem.watched_date && (
          <span className={styles.watchedDate}>
            Watched: {watchedItem.watched_date}
          </span>
        )}
      </div>
    </div>
  );
}

export default WatchedMovieCard;
