// src/components/UserMediaLogList/UserMediaLogCard.tsx (Example path)
// Renamed and refactored from WatchedMovieCard to use MediaItem

import React from 'react';
import { Link } from '@tanstack/react-router';
// Import the generic MediaItem type
import styles from '../userMediaLogList/UserMediaLogList.module.css';
import { HeartIconFilled } from '../../../../../../shared/infraestructure/components/ui/svgs';
import StarRating from '../../../../../item/infraestructure/ui/components/StarRating/StarRating';
import { UserMediaLogCardType } from '../userMediaLogList/UserMediaLogList';
import { bookImagePlaceholder } from '../../../../../../shared/infraestructure/utils/placeholders';

interface UserMediaLogCardProps {
  item: UserMediaLogCardType;
}

// Placeholder image
const placeholderImage = bookImagePlaceholder;

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
      rating, // User's rating
      liked, // User's like status
      watched_date, // User's watched date
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
            {rating !== null && rating !== undefined && (
              <div
                className={styles.rating}
                title={`Your Rating: ${rating}/10`}>
                <StarRating disabled={true} currentRating={rating} />
              </div>
            )}
            {liked === true && (
              <span className={styles.likedIndicator} title="Liked">
                <HeartIconFilled />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

UserMediaLogCard.displayName = 'UserMediaLogCard';

export default UserMediaLogCard;
