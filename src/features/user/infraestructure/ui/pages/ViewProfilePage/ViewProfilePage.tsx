import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import styles from './ViewProfilePage.module.css'; // Import the consolidated CSS
import { WatchedItem } from '../../../../../../lib/types/supabase';
import { viewProfileRoute } from '../../../../../../routes/routes';
import { selectCurrentUser } from '../../../../../authentication/infraestructure/store/authSlice';
import {
  invokeEdgeFunction,
  supabase,
} from '../../../../../../lib/supabaseClient';
import WatchedMovieList from '../../components/watchedMovieList/WatchedMovieList';

interface ProfileDisplayData {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface GetWatchedListResponse {
  watchedList: WatchedItem[] | null;
}

// Placeholder Icon if no avatar
const DefaultAvatarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    width="100%"
    height="100%">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

function ViewProfilePage() {
  const params = useParams({ from: viewProfileRoute.id });
  const profileUserId = params.userId;
  const loggedInUser = useSelector(selectCurrentUser);

  const [sortBy, setSortBy] = useState('updated_at_desc');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [likedOnly, setLikedOnly] = useState(false);

  const profileQueryKey = ['profile', profileUserId];
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError,
  } = useQuery<ProfileDisplayData | null, Error>({
    queryKey: profileQueryKey,
    queryFn: async (): Promise<ProfileDisplayData | null> => {
      if (!profileUserId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, bio')
        .eq('user_id', profileUserId)
        .maybeSingle();
      if (error) throw new Error(error.message || 'Failed to fetch profile');
      return data;
    },
    enabled: !!profileUserId,
    staleTime: 1000 * 60 * 15,
  });

  const watchedListQueryKey = ['watched', 'list', profileUserId];
  const {
    data: watchedListData,
    isLoading: isLoadingList,
    isError: isListError,
    error: listError,
  } = useQuery<GetWatchedListResponse, Error>({
    queryKey: watchedListQueryKey,
    queryFn: async (): Promise<GetWatchedListResponse> => {
      if (!profileUserId || typeof profileUserId !== 'string') {
        return { watchedList: [] };
      }
      const functionNameWithParam = `get-user-watched-list?userId=${encodeURIComponent(profileUserId)}`;
      const response = await invokeEdgeFunction(functionNameWithParam, {
        method: 'GET',
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from get-user-watched-list');
      }
      if ('error' in response && response.error) {
        throw new Error(String(response.error));
      }
      return response as GetWatchedListResponse;
    },
    enabled: !!profileUserId,
    staleTime: 1000 * 60 * 5,
  });

  const watchedList = watchedListData?.watchedList ?? [];

  const filteredAndSortedList = useMemo(() => {
    if (!watchedList) return [];
    let list = [...watchedList];

    if (ratingFilter !== null) {
      list = list.filter(
        (item) => item.rating !== null && item.rating >= ratingFilter
      );
    }
    if (likedOnly) {
      list = list.filter((item) => item.liked === true);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'rating_desc':
          return (b.rating ?? -1) - (a.rating ?? -1);
        case 'rating_asc':
          return (a.rating ?? 11) - (b.rating ?? 11);
        case 'liked_first':
          return (b.liked ? 1 : 0) - (a.liked ? 1 : 0);
        case 'updated_at_desc':
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });
    return list;
  }, [watchedList, sortBy, ratingFilter, likedOnly /*, searchTerm */]);

  // --- Calculate Statistics (Based on original watchedList) ---
  const stats = useMemo(() => {
    const totalWatched = watchedList.length;
    const ratedItems = watchedList.filter((item) => item.rating !== null);
    const likedCount = watchedList.filter((item) => item.liked === true).length;
    const averageRating =
      ratedItems.length > 0 ?
        ratedItems.reduce((sum, item) => sum + (item.rating ?? 0), 0) /
        ratedItems.length
      : null;
    return { totalWatched, averageRating, likedCount };
  }, [watchedList]);

  const isLoading = isLoadingProfile || isLoadingList; // Simplified loading check

  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading profile...</div>;
  }
  if (isProfileError || isListError) {
    return (
      <div className={styles.errorMessage}>
        {' '}
        Error loading profile data:{' '}
        {profileError?.message || listError?.message}{' '}
      </div>
    );
  }

  const profileUsername =
    profileData?.username ||
    (loggedInUser?.id === profileUserId ?
      loggedInUser?.email?.split('@')[0]
    : null) ||
    'User Profile';
  const isOwnProfile = loggedInUser && loggedInUser.id === profileUserId;

  return (
    <main className={styles.profilePageContainer}>
      <section className={styles.profileHeader}>
        <div className={styles.profileAvatarContainer}>
          {profileData?.avatar_url ?
            <img
              src={profileData.avatar_url}
              alt={`${profileUsername}'s avatar`}
              className={styles.profileAvatar}
            />
          : <div className={styles.profileAvatarPlaceholder}>
              <DefaultAvatarIcon />
            </div>
          }
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileUsername}>{profileUsername}</h1>
          {profileData?.bio && (
            <p className={styles.profileBio}>{profileData.bio}</p>
          )}
          {/* Display Stats */}
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalWatched}</span>
              <span className={styles.statLabel}>Watched</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.likedCount}</span>
              <span className={styles.statLabel}>Likes</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {stats.averageRating ?
                  stats.averageRating.toFixed(1) + ' ★'
                : '-'}
              </span>
              <span className={styles.statLabel}>Avg Rating</span>
            </div>
          </div>
          {isOwnProfile && (
            <Link to="/profile/edit" className={styles.editProfileButton}>
              Edit Profile
            </Link>
          )}
        </div>
      </section>

      <section className={styles.watchedSection}>
        <div className={styles.controlsContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="sort-select">Sort By:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.selectInput}>
              <option value="updated_at_desc">Last Updated</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="rating_asc">Lowest Rated</option>
              <option value="liked_first">Liked First</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="rating-filter">Min Rating:</label>
            <select
              id="rating-filter"
              value={ratingFilter ?? ''}
              onChange={(e) =>
                setRatingFilter(e.target.value ? Number(e.target.value) : null)
              }
              className={styles.selectInput}>
              <option value="">Any</option>
              {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r / 2} ★+
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.filterGroup} ${styles.checkboxGroup}`}>
            <input
              type="checkbox"
              id="liked-only-filter"
              checked={likedOnly}
              onChange={(e) => setLikedOnly(e.target.checked)}
              className={styles.checkboxInput}
            />
            <label htmlFor="liked-only-filter">Liked Only</label>
          </div>
        </div>

        <div className={styles.listContainer}>
          {filteredAndSortedList.length > 0 && (
            <WatchedMovieList watchedItems={filteredAndSortedList} />
          )}
          {!isLoading && filteredAndSortedList.length === 0 && (
            <p className={styles.infoMessage}>
              {watchedList.length === 0 ?
                'No movies logged yet.'
              : 'No movies match your current filters.'}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default ViewProfilePage;
