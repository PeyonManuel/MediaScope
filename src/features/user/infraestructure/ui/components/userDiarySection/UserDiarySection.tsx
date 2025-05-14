import { useQueries } from '@tanstack/react-query';
import { getMediaDetailsAniList } from '../../../../../../shared/infraestructure/lib/anilistApi';
import { getMediaDetailsOpenLibrary } from '../../../../../../shared/infraestructure/lib/googleBooksApi';
import { getMediaDetailsTmdb } from '../../../../../../shared/infraestructure/lib/tmdbApi';
import { MediaItem } from '../../../../../../shared/infraestructure/lib/types/media.types';
import { DiaryEntry } from '../../../../domain';
import styles from './UserDiarySection.module.css';
import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { HeartIconFilled } from '../../../../../../shared/infraestructure/components/ui/svgs';
import { PaginationType } from '../../../../../../shared/domain';
import Pagination from '../../../../../../shared/infraestructure/components/ui/pagination/Pagination';

export interface UserDiarySectionProps {
  entries: DiaryEntry[];
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
}

export type UserDiaryCard = Partial<MediaItem> &
  Partial<DiaryEntry> & {
    release_date: string;
    isLoading: boolean;
    isError: boolean;
  };

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function UserDiarySection({
  entries,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: UserDiarySectionProps) {
  const mediaDetailQueries = useQueries({
    queries: entries.map((item) => {
      const { media_type, external_id } = item; // Get type and ID from log item
      return {
        queryKey: ['media', 'details', media_type, external_id],
        queryFn: async (): Promise<MediaItem | null> => {
          console.log(`Fetching details for ${media_type} - ${external_id}`);
          try {
            switch (media_type) {
              case 'movie':
              case 'tv':
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

  const displayItems: UserDiaryCard[] = useMemo(() => {
    return entries.map((entry, index) => {
      const queryResult = mediaDetailQueries[index];
      const fetchedDetails = queryResult?.data;
      const baseDisplayItem: UserDiaryCard = {
        external_id: entry.external_id,
        mediaType: entry.media_type,
        rating: entry.rating, // User's rating from log
        liked: entry.liked, // User's like status from log
        watched_date: entry.watched_date, // User's watched date from log
        review: entry.review, // User's review from log
        isLoading: queryResult?.isLoading || queryResult?.isFetching,
        isError: queryResult?.isError,
        title: `Loading... (${entry.external_id})`, // Default title while loading
        posterUrl: '',
        release_date: '',
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
  }, [entries, mediaDetailQueries]);

  return (
    <section className={styles.container}>
      <div className={styles.list}>
        {displayItems.map((entry, i) => {
          // Destructure all needed fields from entry
          const {
            mediaType,
            external_id,
            posterUrl,
            title,
            releaseDate,
            watched_date,
            rating,
            liked,
            review,
          } = entry;
          // Compose detail URL
          const detailUrl = `/${mediaType}/${external_id}`;
          const year = releaseDate ? releaseDate.split('-')[0] : '';
          const watchedText = `${['book', 'manga'].includes(mediaType ?? '') ? 'Read' : 'Watched'} ${formatDate(watched_date ?? '')}`;

          return (
            <div key={`${mediaType}-${external_id}`} className={styles.card}>
              <Link className={styles.title} to={detailUrl}>
                <img
                  src={posterUrl ?? ''}
                  alt={title}
                  className={styles.poster}
                  loading="lazy"
                />
              </Link>
              <div className={styles.cardInfo}>
                <div className={styles.content}>
                  <Link className={styles.title} to={detailUrl}>
                    {title} <span className={styles.year}>{year}</span>
                  </Link>
                  <div className={styles.infoLine}>
                    {liked === true && (
                      <div className={styles.liked}>
                        <HeartIconFilled />
                      </div>
                    )}
                    <div className={styles.rating}>
                      <span>★</span>
                      {rating}/10
                    </div>
                    <div className={styles.date}>{watchedText}</div>
                  </div>
                  {review && <div className={styles.review}>{review}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        onPageChange={onPageChange}
        currentPage={currentPage}
        totalPages={totalPages}
        isDisabled={isLoading}
      />
    </section>
  );
}
