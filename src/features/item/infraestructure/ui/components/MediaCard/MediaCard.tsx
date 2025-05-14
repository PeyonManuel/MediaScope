// src/shared/ui/components/MediaCard/MediaCard.tsx (Example path)

import React from 'react';
import { Link } from '@tanstack/react-router';
import styles from './MediaCard.module.css';
import { MediaItem } from '../../../../../../shared/infraestructure/lib/types/media.types';
import { bookImagePlaceholder } from '../../../../../../shared/infraestructure/utils/placeholders';

interface MediaCardProps {
  // Accepts the normalized MediaItem which includes both
  // TMDB/API details and potentially user interaction data
  item: MediaItem;
}

// Placeholder image
const placeholderImage = bookImagePlaceholder; // Provide a local placeholder

// Use React.memo for performance optimization when rendering lists
const MediaCard: React.FC<MediaCardProps> = React.memo(({ item }) => {
  // Construct the correct link based on mediaType and externalId
  const detailUrl = `/${item.mediaType}/${item.externalId}`;

  // Use posterUrl directly from the normalized item
  const displayImageUrl = item.posterUrl || placeholderImage;

  return (
    // Link wraps the entire card content
    <Link to={detailUrl} className={styles.cardLink}>
      <div className={styles.card}>
        {/* Poster Section */}
        <div className={styles.posterWrapper}>
          <img
            src={displayImageUrl}
            alt={`${item.title} Poster`}
            className={styles.posterImage}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== placeholderImage) {
                e.currentTarget.src = placeholderImage;
              }
            }}
          />
          {/* Optional: Add overlay for rating/like on hover? */}
        </div>

        {/* Info Section Below Poster */}
        <div className={styles.cardInfo}>
          {/* Title */}
          <h3 className={styles.mediaTitle} title={item.title}>
            {item.title}
          </h3>

          {/* Release Year (if available) */}
          {item.releaseDate && (
            <span className={styles.mediaYear}>
              {new Date(item.releaseDate).getFullYear()}
            </span>
          )}

          {item.averageScore !== null && item.averageScore !== undefined && (
            <span className={styles.apiRating}>
              ★ {item.averageScore.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

MediaCard.displayName = 'MediaCard'; // Helpful for React DevTools

export default MediaCard;
