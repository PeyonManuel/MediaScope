// src/components/UserMediaLogList/UserMediaLogCard.tsx (Example path)
// Renamed and refactored from WatchedMovieCard to use MediaItem

import React from 'react';
import { Link } from '@tanstack/react-router';
// Import the generic MediaItem type
import styles from './UserMediaLogList.module.css';
import { MediaItem } from '../../../../../../shared/infraestructure/lib/types/media.types';
import { HeartIconFilled } from '../../../../../../shared/infraestructure/components/ui/svgs';
import StarRating from '../../../../../item/infraestructure/ui/components/StarRating/StarRating';

interface UserMediaLogCardProps {
  item: MediaItem & { isLoading?: boolean; isError?: boolean }; // Accepts the combined MediaItem + loading/error flags
}

// Placeholder image
const placeholderImage = '/placeholder-poster.png';

// Use React.memo for performance
const UserMediaLogCard: React.FC<UserMediaLogCardProps> = React.memo(
  ({ item }) => {
    const {
      id, // Internal unique ID (e.g., "movie-123")
      externalId,
      mediaType,
      title,
      posterUrl, // Use normalized URL
      releaseDate,
      userRating, // User's rating
      userLiked, // User's like status
      watchedDate, // User's watched date
      isLoading, // Loading state for details
      isError, // Error state for details
    } = item;

    const detailUrl = `/${mediaType}/${externalId}`; // Generic link
    const displayImageUrl = posterUrl || placeholderImage;
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';

    return (
      // Use the existing CSS classes defined in the module
      <div className={styles.movieCard}>
        {' '}
        {/* Keep outer div if needed by grid/styles */}
        <Link to={detailUrl} className={styles.posterLink}>
          {/* Handle loading/error state for the image */}
          {isLoading && (
            <div className={styles.posterPlaceholder}>Loading...</div>
          )}
          {isError && !isLoading && (
            <div className={styles.posterPlaceholder}>Error</div>
          )}
          {!isLoading && !isError && (
            <img
              src={displayImageUrl}
              alt={`${title} Poster`}
              className={styles.posterImage}
              loading="lazy"
              onError={(e) => {
                if (e.currentTarget.src !== placeholderImage) {
                  e.currentTarget.src = placeholderImage;
                }
              }}
            />
          )}
        </Link>
        <div className={styles.cardInfo}>
          <Link to={detailUrl} className={styles.titleLink}>
            <h3 className={styles.movieTitle} title={title}>
              {title}
            </h3>
          </Link>
          {releaseYear && (
            <span className={styles.movieYear}>{releaseYear}</span>
          )}

          <div className={styles.indicators}>
            {userRating !== null && userRating !== undefined && (
              <div
                className={styles.userRating}
                title={`Your Rating: ${userRating}/10`}>
                <StarRating disabled={true} currentRating={userRating} />
              </div>
            )}
            {userLiked === true && (
              <span className={styles.likedIndicator} title="Liked">
                <HeartIconFilled />
              </span>
            )}
          </div>
          {watchedDate && (
            <span className={styles.watchedDate}>Watched: {watchedDate}</span>
          )}
        </div>
      </div>
    );
  }
);

UserMediaLogCard.displayName = 'UserMediaLogCard';

export default UserMediaLogCard;
