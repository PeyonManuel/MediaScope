import { useQuery } from '@tanstack/react-query';
import { MediaType } from '../../../../../../shared/infraestructure/lib/types/media.types';
import styles from '../../pages/ViewProfilePage/ViewProfilePage.module.css';
import { GetUserLogResponse, SortOptionValue } from '../../../../domain';
import { useMemo, useState } from 'react';
import { getUserLogUseCase } from '../../../../useCases/useCases';
import { HeartIconFilled } from '../../../../../../shared/infraestructure/components/ui/svgs';
import UserMediaLogList from '../userMediaLogList/UserMediaLogList';
import Pagination from '../../../../../../shared/infraestructure/components/ui/pagination/Pagination';
import SortByFilter from '../sortByFilter/SortByFilter';

interface UserLogSectionProps {
  profileUserId: string;
  selectedLogType: MediaType;
}

const UserLogSection = ({
  profileUserId,
  selectedLogType = 'movie',
}: UserLogSectionProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOptionValue>('watched-desc');
  const [likedOnly, setLikedOnly] = useState(false);

  const userLogListQueryKey = [
    'user-log',
    currentPage,
    sortBy,
    `list-${selectedLogType}`,
    profileUserId,
  ];
  const {
    data: userLogListData,
    isLoading: isLoadingList,
    isError: isListError,
    error: listError,
  } = useQuery<GetUserLogResponse, Error>({
    queryKey: userLogListQueryKey,
    queryFn: async (): Promise<GetUserLogResponse> => {
      // This function fetches ALL log items for the user
      if (!profileUserId || typeof profileUserId !== 'string') {
        return {
          page: 1,
          results: [],
          total_pages: 1,
          total_results: 1,
          total_liked: 0,
          overall_liked: 0,
          average_rating: 0,
        };
      }
      console.log(
        `UI: Calling get-user-watched-list (all types) for user: ${profileUserId}`
      );
      const response = await getUserLogUseCase.execute({
        profileId: profileUserId,
        type: selectedLogType,
        page: currentPage,
        sortBy,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from get-user-watched-list');
      }
      if ('error' in response && response.error) {
        throw new Error(String(response.error));
      }
      // Rename response key if needed to match GetUserLogListResponse
      return response;
    },
    enabled: !!profileUserId,
    staleTime: 1000 * 60 * 5, // Cache the full list
  });

  if (isListError) {
    return (
      <div className={styles.errorMessage}>
        {' '}
        Error loading profile data: {listError?.message}{' '}
      </div>
    );
  }

  return (
    <section className={styles.loggedSection}>
      <div className={styles.controlsContainer}>
        <SortByFilter onChange={setSortBy} value={sortBy} />

        {!isLoadingList && (
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {userLogListData?.total_results}
              </span>
              <span className={styles.statLabel}>Total Items</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {userLogListData?.total_liked}
              </span>
              <span className={styles.statLabel}>Total Likes</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {userLogListData?.overall_liked ?
                  (userLogListData?.overall_liked * 100).toFixed(0) + '%'
                : '-'}
              </span>
              <span className={styles.statLabel}>Liked</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {userLogListData?.average_rating ?
                  userLogListData?.average_rating.toFixed(2) + ' ★'
                : '-'}
              </span>
              <span className={styles.statLabel}>Avg Rating</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.listContainer}>
        <UserMediaLogList
          loadingList={isLoadingList}
          logItems={userLogListData?.results ?? []}
        />
        {!isLoadingList && userLogListData?.results.length === 0 && (
          <p className={styles.infoMessage}>
            {userLogListData?.results.length === 0 ?
              `No ${selectedLogType} logged yet.`
            : `No ${selectedLogType}s match your current filters.`}
          </p>
        )}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={userLogListData?.total_pages ?? 1}
        onPageChange={(newPage) => setCurrentPage(newPage)}
      />
    </section>
  );
};

export default UserLogSection;
