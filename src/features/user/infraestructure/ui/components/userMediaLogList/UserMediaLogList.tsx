import { useQueries } from '@tanstack/react-query';
import styles from './UserMediaLogList.module.css'; // Rename CSS module
import { UserMediaLog } from '../../../../../item/domain';
import { MediaItem } from '../../../../../../shared/infraestructure/lib/types/media.types';
import { getMediaDetailsTmdb } from '../../../../../../shared/infraestructure/lib/tmdbApi';
import { getMediaDetailsGoogleBooks } from '../../../../../../shared/infraestructure/lib/googleBooksApi';
import { getMediaDetailsAniList } from '../../../../../../shared/infraestructure/lib/anilistApi';
import { useMemo } from 'react';
import MediaCard from '../../../../../item/infraestructure/ui/components/MediaCard/MediaCard';
import { getMediaDetailsSteamSpy } from '../../../../../../shared/infraestructure/lib/steamSpyApi';

interface UserMediaLogListProps {
  logItems: UserMediaLog[];
}

const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage}></div>
    <div className={styles.skeletonText}></div>
    <div className={`${styles.skeletonText} ${styles.skeletonTextShort}`}></div>
  </div>
);

function UserMediaLogList({ logItems }: UserMediaLogListProps) {
  const mediaDetailQueries = useQueries({
    queries: logItems.map((item) => {
      const { media_type, external_id } = item; // Get type and ID from log item
      console.log(logItems);
      return {
        // Query key now includes media type and external ID
        queryKey: ['media', 'details', media_type, external_id],
        queryFn: async (): Promise<MediaItem | null> => {
          console.log(`Fetching details for ${media_type} - ${external_id}`);
          // --- Call the correct adapter based on mediaType ---
          try {
            switch (media_type) {
              case 'movie':
              case 'tv':
                // Ensure getMediaDetailsTmdb returns the normalized MediaItem
                return await getMediaDetailsTmdb(external_id, media_type);
              case 'game':
                return await getMediaDetailsSteamSpy(external_id);
              case 'book':
                return await getMediaDetailsGoogleBooks(external_id);
              case 'manga':
                return await getMediaDetailsAniList(external_id);
              default:
                console.warn(
                  `Unsupported media type for detail fetching: ${media_type}`
                );
                return null; // Handle unsupported types
            }
          } catch (error) {
            console.error(
              `Failed to fetch details for ${media_type} ${external_id}`,
              error
            );
            return null; // Return null on error for this specific item
          }
        },
        staleTime: Infinity, // Details don't change often
        cacheTime: Infinity,
        enabled: !!media_type && !!external_id, // Ensure type and ID exist
        retry: 1,
      };
    }),
  });

  const displayItems: (MediaItem & {
    isLoading?: boolean;
    isError?: boolean;
  })[] = useMemo(() => {
    return logItems.map((logItem, index) => {
      const queryResult = mediaDetailQueries[index];
      const fetchedDetails = queryResult?.data;

      const baseDisplayItem: Partial<MediaItem> & {
        isLoading: boolean;
        isError: boolean;
      } = {
        id: `${logItem.media_type}-${logItem.external_id}`, // Create unique internal ID
        externalId: logItem.external_id,
        mediaType: logItem.media_type,
        userRating: logItem.rating, // User's rating from log
        userLiked: logItem.liked, // User's like status from log
        watchedDate: logItem.watched_date, // User's watched date from log
        userReview: logItem.review, // User's review from log
        isLoading: queryResult?.isLoading || queryResult?.isFetching,
        isError: queryResult?.isError,
        title: `Loading... (${logItem.external_id})`, // Default title while loading
        posterUrl: null,
        releaseDate: null,
        description: null,
      };

      // If details fetched successfully, merge them
      if (fetchedDetails) {
        return {
          ...baseDisplayItem,
          ...fetchedDetails, // Spread the fetched & normalized details
          userRating: logItem.rating,
          userLiked: logItem.liked,
          watchedDate: logItem.watched_date,
          userReview: logItem.review,
        };
      }

      return baseDisplayItem as MediaItem & {
        isLoading: boolean;
        isError: boolean;
      }; // Assert type
    });
  }, [logItems, mediaDetailQueries]);

  if (!logItems || logItems.length === 0) {
    return null; // Handled by parent
  }

  const showSkeletons = mediaDetailQueries.some((q) => q.isLoading);

  return (
    <div className={styles.listGrid}>
      {showSkeletons &&
        displayItems.every((item) => !item.title.startsWith('Loading')) && // Avoid showing skeletons if some data already loaded
        Array.from({ length: logItems.length }).map((_, index) => (
          <SkeletonCard
            key={`skeleton-${logItems[index]?.external_id || index}`}
          />
        ))}

      {!showSkeletons &&
        displayItems.map((item) => <MediaCard key={item.id} item={item} />)}
    </div>
  );
}

export default UserMediaLogList;
