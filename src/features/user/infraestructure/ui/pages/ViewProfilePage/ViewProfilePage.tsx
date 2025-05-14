import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import styles from './ViewProfilePage.module.css'; // Import the consolidated CSS
import { viewProfileRoute } from '../../../../../../routes/routes';
import { selectCurrentUser } from '../../../../../authentication/infraestructure/store/authSlice';
import { supabase } from '../../../../../../shared/infraestructure/lib/supabaseClient';
import UserLogSection from '../../components/userLogSection/UserLogSection';
import { GetUserDiaryResponse } from '../../../../domain';
import { getUserDiaryUseCase } from '../../../../useCases/useCases';
import UserDiarySection from '../../components/userDiarySection/UserDiarySection';
import { MediaType } from '../../../../../../shared/infraestructure/lib/types/media.types';
import { useState } from 'react';

// Type for the profile data fetched for display
interface ProfileDisplayData {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}
type OptionsType = MediaType | 'diary';

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
  const [selectedTab, setSelectedTab] = useState<OptionsType>('diary');
  const [diaryPage, setDiaryPage] = useState(1);

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

  const userDiaryKey = [profileUserId, 'user-diary'];
  const {
    isLoading: isLoadingDairy,
    data: diaryData,
    isError,
  } = useQuery<GetUserDiaryResponse, Error>({
    queryKey: userDiaryKey,
    queryFn: async (): Promise<GetUserDiaryResponse> => {
      return await getUserDiaryUseCase.execute({
        profileId: profileUserId,
        amount: 60,
        page: diaryPage,
      });
    },
    staleTime: 60 * 5 * 1000,
  });
  const getActiveTab = (type: OptionsType) => {
    switch (type) {
      case 'diary':
        return (
          !isLoadingDairy &&
          diaryData && (
            <UserDiarySection
              entries={diaryData?.entries ?? []}
              totalPages={diaryData?.pagination.totalPages}
              currentPage={diaryPage}
              onPageChange={(newpage) => setDiaryPage(newpage)}
              isLoading={isLoadingDairy}
            />
          )
        );
      case 'book':
      case 'manga':
      case 'movie':
      case 'tv':
        return (
          <UserLogSection
            selectedLogType={selectedTab as MediaType}
            profileUserId={profileUserId}
          />
        );
      default:
        return;
    }
  };

  const isLoading = isLoadingProfile;
  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading profile...</div>;
  }
  if (isProfileError) {
    return (
      <div className={styles.errorMessage}>
        {' '}
        Error loading profile data: {profileError?.message}
      </div>
    );
  }
  const OPTIONTYPES: OptionsType[] = ['diary', 'movie', 'tv', 'book', 'manga'];

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
          }{' '}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileUsername}>{profileUsername}</h1>
          {profileData?.bio && (
            <p className={styles.profileBio}>{profileData.bio}</p>
          )}

          {isOwnProfile && (
            <Link to="/edit/profile" className={styles.editProfileButton}>
              Edit Profile
            </Link>
          )}
        </div>
      </section>
      <nav className={styles.mediaTypeTabs}>
        {OPTIONTYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedTab(type)}
            className={`${styles.tabButton} ${selectedTab === type ? styles.active : ''}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </nav>
      {getActiveTab(selectedTab)}
    </main>
  );
}

export default ViewProfilePage;
