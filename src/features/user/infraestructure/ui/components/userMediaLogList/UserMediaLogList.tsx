import { useQueries } from '@tanstack/react-query';
import styles from './UserMediaLogList.module.css';
import { UserMediaLog } from '../../../../../item/domain';
import { MediaItem } from '../../../../../../shared/infraestructure/lib/types/media.types';
import { getMediaDetailsTmdb } from '../../../../../../shared/infraestructure/lib/tmdbApi';
import { getMediaDetailsAniList } from '../../../../../../shared/infraestructure/lib/anilistApi';
import { useMemo } from 'react';
import { getMediaDetailsOpenLibrary } from '../../../../../../shared/infraestructure/lib/googleBooksApi';
import UserMediaLogCard from '../userMediaLogCard/UserMediaLogCard';

interface UserMediaLogListProps {
  logItems: UserMediaLog[];
  loadingList: boolean;
}

export type UserMediaLogCardType = Partial<MediaItem> &
  Partial<UserMediaLog> & {
    isLoading: boolean;
    isError: boolean;
  };

const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage}></div>
    <div className={styles.skeletonText}></div>
    <div className={`${styles.skeletonText} ${styles.skeletonTextShort}`}></div>
  </div>
);
function UserMediaLogList({ logItems, loadingList }: UserMediaLogListProps) {
  const mediaDetailQueries = useQueries({
    queries: logItems.map((item) => {
      const { media_type, external_id } = item; // Get type and ID from log item
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
              case 'book':
                return await getMediaDetailsOpenLibrary(external_id);
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

  const displayItems: UserMediaLogCardType[] = useMemo(() => {
    return logItems.map((logItem, index) => {
      const queryResult = mediaDetailQueries[index];
      const fetchedDetails = queryResult?.data;

      const baseDisplayItem: UserMediaLogCardType = {
        id: `${logItem.media_type}-${logItem.external_id}`, // Create unique internal ID
        externalId: logItem.external_id,
        mediaType: logItem.media_type,
        rating: logItem.rating, // User's rating from log
        liked: logItem.liked, // User's like status from log
        watched_date: logItem.watched_date, // User's watched date from log
        review: logItem.review, // User's review from log
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
        };
      }

      return baseDisplayItem;
    });
  }, [logItems, mediaDetailQueries]);

  if (!logItems || logItems.length === 0) {
    return null; // Handled by parent
  }

  const showSkeletons =
    mediaDetailQueries.some((q) => q.isLoading) ||
    displayItems.some((item) => item.title?.includes('Loading'));
  return (
    <div className={styles.listGrid}>
      {(showSkeletons || loadingList) &&
        Array.from({ length: 18 }).map((_, index) => {
          return (
            <SkeletonCard
              key={`skeleton-${logItems[index]?.external_id || index}`}
            />
          );
        })}

      {!showSkeletons &&
        displayItems.map((item) => (
          <UserMediaLogCard key={item.id} item={item} />
        ))}
    </div>
  );
}

export default UserMediaLogList;
