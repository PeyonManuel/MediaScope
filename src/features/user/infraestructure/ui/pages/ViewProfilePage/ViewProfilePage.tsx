// src/pages/ViewProfilePage/ViewProfilePage.tsx (Example path)
// Added media type tabs for filtering the log list

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import styles from './ViewProfilePage.module.css'; // Import the consolidated CSS
import { UserMediaLog } from '../../../../../item/domain';
import { MediaType } from '../../../../../../shared/infraestructure/lib/types/media.types';
import { viewProfileRoute } from '../../../../../../routes/routes';
import { selectCurrentUser } from '../../../../../authentication/infraestructure/store/authSlice';
import {
  invokeEdgeFunction,
  supabase,
} from '../../../../../../shared/infraestructure/lib/supabaseClient';
import UserMediaLogList from '../../components/userMediaLogList/UserMediaLogList';
// --- Import generic UserMediaLog type ---

// Type for the profile data fetched for display
interface ProfileDisplayData {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

// Type for the response from the get-user-watched-list function
// It returns ALL log items, filtering happens client-side in this version
interface GetUserLogListResponse {
  watchedList: UserMediaLog[] | null; // Renamed for clarity
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

// Define the available media types for tabs + 'all'
const MEDIA_TYPES: MediaType[] = ['movie', 'tv', 'game', 'book', 'manga'];
type SelectedLogType = MediaType | 'all';

function ViewProfilePage() {
  const params = useParams({ from: viewProfileRoute.id });
  const profileUserId = params.userId;
  const loggedInUser = useSelector(selectCurrentUser);

  // --- State for Filters/Search ---
  const [sortBy, setSortBy] = useState('updated_at_desc');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [likedOnly, setLikedOnly] = useState(false);
  // --- NEW: State for selected media type tab ---
  const [selectedLogType, setSelectedLogType] =
    useState<SelectedLogType>('all');

  // --- Query to fetch profile data (no change) ---
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

  // --- Query to fetch FULL watched list (no type filter sent to backend yet) ---
  // Query key still only depends on user ID, as we fetch all types for now
  const userLogListQueryKey = ['user-log', 'list-all', profileUserId];
  const {
    data: userLogListData,
    isLoading: isLoadingList,
    isError: isListError,
    error: listError,
  } = useQuery<GetUserLogListResponse, Error>({
    queryKey: userLogListQueryKey,
    queryFn: async (): Promise<GetUserLogListResponse> => {
      // This function fetches ALL log items for the user
      if (!profileUserId || typeof profileUserId !== 'string') {
        return { watchedList: [] }; // Use watchedList key to match response type
      }
      console.log(
        `UI: Calling get-user-watched-list (all types) for user: ${profileUserId}`
      );
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
      // Rename response key if needed to match GetUserLogListResponse
      return response as GetUserLogListResponse;
    },
    enabled: !!profileUserId,
    staleTime: 1000 * 60 * 5, // Cache the full list
  });

  // Get the full list, default to empty array
  const fullLogList = userLogListData?.watchedList ?? [];
  // --- Client-side Filtering and Sorting (Operates on fullLogList) ---
  const filteredAndSortedList = useMemo(() => {
    if (!fullLogList) return [];

    // 1. Filter by Selected Media Type Tab
    let typeFilteredList =
      selectedLogType === 'all' ? fullLogList : (
        fullLogList.filter((item) => item.media_type === selectedLogType)
      );

    // 2. Apply other filters (rating, liked) to the type-filtered list
    let list = [...typeFilteredList]; // Create mutable copy
    if (ratingFilter !== null) {
      list = list.filter(
        (item) => item.rating !== null && item.rating >= ratingFilter
      );
    }
    if (likedOnly) {
      list = list.filter((item) => item.liked === true);
    }

    // 3. Sort the resulting list
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
    // Update dependencies
  }, [fullLogList, selectedLogType, sortBy, ratingFilter, likedOnly]);
  // --- Calculate Statistics (Based on the FULL original watchedList) ---
  const stats = useMemo(() => {
    const totalItems = fullLogList.length;
    // Calculate stats per type
    const statsByType = MEDIA_TYPES.reduce(
      (acc, type) => {
        const itemsOfType = fullLogList.filter(
          (item) => item.media_type === type
        );
        const ratedItems = itemsOfType.filter((item) => item.rating !== null);
        const likedCount = itemsOfType.filter(
          (item) => item.liked === true
        ).length;
        const averageRating =
          (
            ratedItems.length > 0 && type !== 'game' // Exclude games from avg rating calc
          ) ?
            ratedItems.reduce((sum, item) => sum + (item.rating ?? 0), 0) /
            ratedItems.length
          : null;
        acc[type] = {
          count: itemsOfType.length,
          likedCount: likedCount,
          averageRating:
            averageRating ? parseFloat(averageRating.toFixed(1)) : null, // Avg out of 5 stars
        };
        return acc;
      },
      {} as Record<
        MediaType,
        { count: number; likedCount: number; averageRating: number | null }
      >
    );

    // Calculate overall average (excluding games)
    const allRatedItems = fullLogList.filter(
      (item) => item.rating !== null && item.media_type !== 'game'
    );
    const overallAverageRating =
      allRatedItems.length > 0 ?
        allRatedItems.reduce((sum, item) => sum + (item.rating ?? 0), 0) /
        allRatedItems.length
      : null;

    return {
      totalItems,
      statsByType,
      overallAverageRating:
        overallAverageRating ?
          parseFloat(overallAverageRating.toFixed(1))
        : null, // Avg out of 5 stars
      overallLikedCount: fullLogList.filter((item) => item.liked === true)
        .length,
    };
  }, [fullLogList]);

  // --- Render Logic ---
  const isLoading = isLoadingProfile || isLoadingList;

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
      {/* Profile Header Section */}
      <section className={styles.profileHeader}>
        <div className={styles.profileAvatarContainer}>
          {' '}
          {profileData?.avatar_url ?
            <img
              src={profileData.avatar_url}
              alt={`${profileUsername}'s avatar`}
              className={styles.profileAvatar}
            />
          : <div className={styles.profileAvatarPlaceholder}>
              <DefaultAvatarIcon />
            </div>
          }{' '}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileUsername}>{profileUsername}</h1>
          {profileData?.bio && (
            <p className={styles.profileBio}>{profileData.bio}</p>
          )}
          {/* Display Stats (Overall) */}
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalItems}</span>
              <span className={styles.statLabel}>Total Items</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {stats.overallLikedCount}
              </span>
              <span className={styles.statLabel}>Total Likes</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {stats.overallAverageRating ?
                  stats.overallAverageRating + ' ★'
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

      {/* Logged Media Section */}
      <section className={styles.loggedSection}>
        {/* --- NEW: Media Type Tabs --- */}
        <nav className={styles.mediaTypeTabs}>
          <button
            onClick={() => setSelectedLogType('all')}
            className={`${styles.tabButton} ${selectedLogType === 'all' ? styles.active : ''}`}>
            All ({stats.totalItems})
          </button>
          {MEDIA_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedLogType(type)}
              className={`${styles.tabButton} ${selectedLogType === type ? styles.active : ''}`}>
              {/* Capitalize type for display */}
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {/* Show count for this type */}(
              {stats.statsByType[type]?.count ?? 0})
            </button>
          ))}
        </nav>
        {/* --- End Tabs --- */}

        {/* Filter/Sort Controls (Apply to selected tab's list) */}
        <div className={styles.controlsContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="sort-select">Sort By:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.selectInput}>
              <option value="updated_at_desc">Last Updated</option>
              {/* Disable rating sort if viewing games and rating is N/A */}
              {selectedLogType !== 'game' && (
                <option value="rating_desc">Highest Rated</option>
              )}
              {selectedLogType !== 'game' && (
                <option value="rating_asc">Lowest Rated</option>
              )}
              <option value="liked_first">Liked First</option>
              {/* Add Title/Release Date sort here if needed */}
            </select>
          </div>
          {/* Disable rating filter if viewing games */}
          {selectedLogType !== 'game' && (
            <div className={styles.filterGroup}>
              <label htmlFor="rating-filter">Min Rating:</label>
              <select
                id="rating-filter"
                value={ratingFilter ?? ''}
                onChange={(e) =>
                  setRatingFilter(
                    e.target.value ? Number(e.target.value) : null
                  )
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
          )}
          <div className={`${styles.filterGroup} ${styles.checkboxGroup}`}>
            <input
              type="checkbox"
              id="liked-only-filter"
              checked={likedOnly}
              onChange={(e) => setLikedOnly(e.target.checked)}
              className={styles.checkboxInput}
            />
            <label htmlFor="liked-only-filter">Liked Only ❤️</label>
          </div>
        </div>

        {/* Logged Media List */}
        <div className={styles.listContainer}>
          {/* Pass the FILTERED & SORTED list to UserMediaLogList */}
          {filteredAndSortedList.length > 0 && (
            <UserMediaLogList logItems={filteredAndSortedList} />
          )}
          {/* Show message if filters result in empty list for the selected tab */}
          {!isLoading && filteredAndSortedList.length === 0 && (
            <p className={styles.infoMessage}>
              {fullLogList.length === 0 ?
                `No ${selectedLogType === 'all' ? 'items' : selectedLogType} logged yet.`
              : `No ${selectedLogType === 'all' ? 'items' : selectedLogType} match your current filters.`
              }
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default ViewProfilePage;
