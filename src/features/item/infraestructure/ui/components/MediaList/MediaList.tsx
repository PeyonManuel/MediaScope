// src/shared/ui/components/MediaList/MediaList.tsx (Example path)
// Generic list component using MediaCard

import React from 'react';
import styles from './MediaList.module.css'; // Create this CSS module
import { MediaItem } from '../../../../../../shared/infraestructure/lib/types/media.types';
import MediaCard from '../MediaCard/MediaCard';
// Import the generic MediaItem type
// Import the generic MediaCard component

interface MediaListProps {
  items: MediaItem[] | undefined; // Array of generic MediaItems
  isLoading?: boolean; // Optional: Pass loading state for skeletons
  // Optional: Add error handling prop or message prop
  emptyMessage?: string; // Message to show when list is empty
}

// Basic Skeleton Card for Loading State
const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage}></div>
    <div className={styles.skeletonText}></div>
    <div className={`${styles.skeletonText} ${styles.skeletonTextShort}`}></div>
  </div>
);

const MediaList: React.FC<MediaListProps> = ({
  items,
  isLoading = false, // Default isLoading to false
  emptyMessage = 'No items found.', // Default empty message
}) => {
  // Determine number of skeletons based on typical screen size or a fixed number
  const skeletonCount = 12; // Example fixed number
  return (
    <div className={styles.listGrid}>
      {/* Show Skeletons only if isLoading is true AND items are not yet available */}
      {isLoading &&
        (!items || items.length === 0) &&
        Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}

      {/* Render MediaCards when not loading and items exist */}
      {!isLoading &&
        items &&
        items.length > 0 &&
        items.map((item) => (
          // Pass the full MediaItem to MediaCard
          // Use the unique MediaItem id (e.g., "movie-123") as the key
          <MediaCard key={item.id} item={item} />
        ))}

      {/* Handle empty state (not loading, but no items) */}
      {!isLoading && (!items || items.length === 0) && (
        // Use a container for the message to allow centering/styling
        <div className={styles.emptyListContainer}>
          <p className={styles.emptyListMessage}>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

export default MediaList;
