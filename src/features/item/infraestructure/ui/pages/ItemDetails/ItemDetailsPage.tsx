import React, { useState } from 'react';
import { useParams, useLoaderData, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './ItemDetailsPage.module.css';
import { itemRoute } from '../../../../../../routes/routes';
import {
  MediaItem,
  MediaType,
} from '../../../../../../shared/infraestructure/lib/types/media.types';
import {
  getBacklogStatusUseCase,
  getMediaLogUseCase,
  logMediaItemUseCase,
  removeMediaLogUseCase,
  toggleBacklogUseCase,
} from '../../../../useCases';
import { UserMediaLog } from '../../../../domain';
import {
  HeartIcon,
  HeartIconFilled,
} from '../../../../../../shared/infraestructure/components/ui/svgs';
import { selectCurrentUser } from '../../../../../authentication/infraestructure/store/authSlice';
import { useSelector } from 'react-redux';
import StarRating from '../../components/StarRating/StarRating';

const formatCurrency = (amount: number | undefined | null): string => {
  /* ... */ return amount ? `$${amount.toLocaleString('en-US')}` : 'N/A';
};
// Helper function for YouTube URLs (keep)
const getYouTubeThumbnail = (key: string): string =>
  `https://i.ytimg.com/vi/${key}/mqdefault.jpg`; // Corrected URL
const getYouTubeVideoUrl = (key: string): string =>
  `https://www.youtube.com/watch?v=${key}`;

// Placeholder Icon (keep)
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

function ItemDetailsPage() {
  // --- Hooks and State ---
  // Get generic MediaItem from loader
  const item = useLoaderData({ from: itemRoute.id }) as MediaItem; // Assert type
  // Get type and ID from route params
  const params = useParams({ from: itemRoute.id });
  const mediaType = params.itemType as MediaType; // Assert MediaType
  const externalId = params.itemId;
  const currentUser = useSelector(selectCurrentUser);

  const queryClient = useQueryClient();
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewText, setReviewText] = useState('');
  // Fetch current user using query (no change)

  // --- Queries for User Interaction State (Use generic keys) ---
  const backlogQueryKey = [
    'backlog',
    'status',
    mediaType,
    externalId,
    currentUser?.id,
  ];
  const { data: backlogStatus } = useQuery({
    // Removed explicit type, rely on return type of use case
    queryKey: backlogQueryKey,
    queryFn: async () => {
      if (!currentUser) return { isOnBacklog: false }; // Default if not logged in
      // Call generic use case
      const response = await getBacklogStatusUseCase.execute({
        mediaType,
        externalId,
      });
      if ('error' in response && typeof response.error === 'string')
        throw new Error(response.error);
      return response; // Expects { isOnBacklog: boolean }
    },
    enabled: !!currentUser && !!mediaType && !!externalId,
  });

  const mediaLogQueryKey = [
    'medialog',
    'item',
    mediaType,
    externalId,
    currentUser?.id,
  ];
  const { data: mediaLogData } = useQuery({
    // Removed explicit type
    queryKey: mediaLogQueryKey,
    queryFn: async () => {
      if (!currentUser) return { mediaLog: null };
      // Call generic use case
      const response = await getMediaLogUseCase.execute({
        mediaType,
        externalId,
      });
      if ('error' in response && typeof response.error === 'string')
        throw new Error(response.error);
      return response; // Expects { mediaLog: UserMediaLog | null }
    },
    enabled: !!currentUser && !!mediaType && !!externalId,
  });
  const mediaLog = mediaLogData?.mediaLog ?? null; // Extract the log item

  // --- Mutations (Use generic keys and use cases) ---
  type ToggleBacklogContext = {
    previousStatus: { isOnBacklog: boolean } | undefined;
  };
  const toggleBacklogMutation = useMutation<
    any,
    Error,
    boolean,
    ToggleBacklogContext
  >({
    mutationFn: async (shouldAdd) =>
      toggleBacklogUseCase.execute({ shouldAdd, mediaType, externalId }),
    onMutate: async (shouldAdd) => {
      /* ... optimistic update for backlogQueryKey ... */
      await queryClient.cancelQueries({ queryKey: backlogQueryKey });
      const previousStatus = queryClient.getQueryData<{ isOnBacklog: boolean }>(
        backlogQueryKey
      );
      queryClient.setQueryData(backlogQueryKey, { isOnBacklog: shouldAdd });
      return { previousStatus };
    },
    onError: (error, vars, context) => {
      /* ... revert backlogQueryKey ... */
      if (context?.previousStatus)
        queryClient.setQueryData(backlogQueryKey, context.previousStatus);
      console.error('Error toggling backlog:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: backlogQueryKey });
    },
  });

  // Types for log mutation (can be moved)
  type LogMediaVariables = Partial<
    Omit<
      UserMediaLog,
      'user_id' | 'media_type' | 'external_id' | 'created_at' | 'updated_at'
    >
  >;
  interface LogMediaMutationContext {
    previousMediaLog: UserMediaLog | null | undefined;
  }

  // Use generic log use case
  const logMediaItemMutation = useMutation<
    any,
    Error,
    LogMediaVariables,
    LogMediaMutationContext
  >({
    mutationFn: async (logData) => {
      if (!currentUser) throw new Error('User not logged in');
      return logMediaItemUseCase.execute({ mediaType, externalId, logData });
    },
    onMutate: async (variables) => {
      /* ... optimistic update for mediaLogQueryKey ... */
      await queryClient.cancelQueries({ queryKey: mediaLogQueryKey });
      const previousMediaLog = queryClient.getQueryData<UserMediaLog | null>(
        mediaLogQueryKey
      );
      let optimisticMediaLog: UserMediaLog | null;
      if (previousMediaLog) {
        optimisticMediaLog = {
          ...previousMediaLog,
          ...variables,
          updated_at: new Date().toISOString(),
        };
      } else {
        optimisticMediaLog = {
          user_id: currentUser?.id || 'unknown',
          media_type: mediaType,
          external_id: externalId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          rating: null,
          liked: false,
          watched_date: null,
          review: null,
          ...variables,
        } as UserMediaLog;
      }
      queryClient.setQueryData(mediaLogQueryKey, optimisticMediaLog);
      return { previousMediaLog };
    },
    onError: (error, vars, context) => {
      /* ... revert mediaLogQueryKey ... */
      if (context?.previousMediaLog !== undefined)
        queryClient.setQueryData(mediaLogQueryKey, context.previousMediaLog);
      console.error('Error logging media item:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: mediaLogQueryKey });
      queryClient.invalidateQueries({ queryKey: backlogQueryKey }); // Invalidate backlog too?
      // Invalidate the user's full list query as well
      queryClient.invalidateQueries({
        queryKey: ['watched', 'list', currentUser?.id],
      });
    },
  });

  // Use generic remove use case
  const removeMediaLogMutation = useMutation<
    any,
    Error,
    void,
    LogMediaMutationContext
  >({
    mutationFn: async () => {
      if (!currentUser) throw new Error('User not logged in');
      return removeMediaLogUseCase.execute({ mediaType, externalId });
    },
    onMutate: async () => {
      /* ... optimistic update for mediaLogQueryKey (set to null) ... */
      await queryClient.cancelQueries({ queryKey: mediaLogQueryKey });
      const previousMediaLog = queryClient.getQueryData<UserMediaLog | null>(
        mediaLogQueryKey
      );
      queryClient.setQueryData(mediaLogQueryKey, null); // Optimistically remove
      return { previousMediaLog };
    },
    onError: (error, vars, context) => {
      /* ... revert mediaLogQueryKey ... */
      if (context?.previousMediaLog !== undefined)
        queryClient.setQueryData(mediaLogQueryKey, context.previousMediaLog);
      console.error('Error removing media log:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: mediaLogQueryKey });
      queryClient.invalidateQueries({ queryKey: backlogQueryKey });
      queryClient.invalidateQueries({
        queryKey: ['watched', 'list', currentUser?.id],
      });
    },
  });

  // --- Event Handlers (use generic mutations/state) ---
  const handleBacklogToggle = () => {
    if (!currentUser) return;
    const currentlyOnList = backlogStatus?.isOnBacklog ?? false;
    toggleBacklogMutation.mutate(!currentlyOnList);
  };

  const handleLikeToggle = () => {
    if (!currentUser) return;
    const currentLiked = mediaLog?.liked ?? false;
    logMediaItemMutation.mutate({ liked: !currentLiked });
  };

  const handleRatingSet = (newRating: number | null) => {
    if (!currentUser) return;
    // Skip rating for games based on our previous decision
    if (mediaType === 'game') {
      console.warn('Rating is disabled for games.');
      return;
    }
    logMediaItemMutation.mutate({ rating: newRating });
  };

  const handleLogOrRemove = () => {
    // Renamed from handleLogWatched
    if (!currentUser) return;
    const isLogged = !!mediaLog; // Check if there's an existing log entry
    if (isLogged) {
      // If already logged, remove it
      removeMediaLogMutation.mutate();
    } else {
      // If not logged, create a basic log entry
      const updates: LogMediaVariables = {};
      // Set watched/read/played date only if creating new log
      updates.watched_date = new Date().toISOString().split('T')[0];
      // Preserve existing like/rating if somehow available (unlikely here)
      updates.liked = false;
      updates.rating = null;
      updates.review = null;
      logMediaItemMutation.mutate(updates);
    }
  };

  const handleToggleReview = () => {
    if (!currentUser) return;
    if (isEditingReview) {
      logMediaItemMutation.mutate({ review: reviewText.trim() || null });
      setIsEditingReview(false);
    } else {
      setReviewText(mediaLog?.review || '');
      setIsEditingReview(true);
    }
  };

  // --- Loading / Error States ---
  if (!item) {
    // Loader should handle this via pending/error components ideally
    return <div className={styles.loading}>Loading details...</div>;
  }

  // --- Derived Data & Interaction States ---
  const {
    title,
    posterUrl,
    backdropUrl,
    description,
    releaseDate,
    tagline,
    genres = [],
    // Get user interaction data from the separate mediaLog query
  } = item; // Destructure from the generic MediaItem

  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

  const isOnBacklog = backlogStatus?.isOnBacklog ?? false;
  const isLiked = mediaLog?.liked ?? false;
  const currentRating = mediaLog?.rating ?? null;
  const currentReview = mediaLog?.review ?? null;
  const isLogged = !!mediaLog; // Check if log entry exists
  const LikeIcon = isLiked ? HeartIconFilled : HeartIcon;

  const isActionPending =
    toggleBacklogMutation.isPending ||
    logMediaItemMutation.isPending ||
    removeMediaLogMutation.isPending;

  // --- RENDER LOGIC ---
  return (
    <div className={styles.pageContainer}>
      {/* Backdrop */}
      {backdropUrl && (
        <div
          className={styles.backdrop}
          style={{ backgroundImage: `url(${backdropUrl})` }}></div>
      )}
      <div className={styles.backdropOverlay}></div>

      <div className={styles.mainContent}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <img
            src={posterUrl || '/placeholder-poster.png'}
            alt={`${title} Poster`}
            className={styles.poster}
            loading="lazy"
          />
          {/* Actions Panel */}
          {currentUser && (
            <div className={styles.actionsPanel} data-testid="actions-panel">
              {/* Backlog Button (Replaces Watchlist) */}
              <button
                data-testid="backlog-toggle-button"
                onClick={handleBacklogToggle}
                disabled={toggleBacklogMutation.isPending}
                className={`${styles.actionButton} ${isOnBacklog ? styles.active : ''}`}
                title={isOnBacklog ? 'Remove from Backlog' : 'Add to Backlog'}>
                <span>
                  {toggleBacklogMutation.isPending ?
                    '...'
                  : isOnBacklog ?
                    'On Backlog'
                  : 'Backlog'}
                </span>
              </button>

              {/* Like Button */}
              <button
                onClick={handleLikeToggle}
                disabled={isActionPending}
                className={`${styles.actionButton} ${styles.likeButton} ${isLiked ? styles.active : ''}`}
                title={isLiked ? 'Unlike' : 'Like'}>
                <LikeIcon />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              {/* Log/Unlog Button */}
              <button
                onClick={handleLogOrRemove}
                disabled={isActionPending}
                className={`${styles.actionButton} ${styles.logButton} ${isLogged ? styles.active : ''}`}
                title={isLogged ? 'Remove Log Entry' : 'Log Item'}>
                <span>{isLogged ? 'Logged' : 'Log'}</span>
              </button>

              {/* Rating Section - Conditionally disable for games */}
              <div
                className={`${styles.ratingSection} ${mediaType === 'game' ? styles.disabled : ''}`}>
                <span className={styles.ratingLabel}>Your Rating</span>
                <StarRating
                  currentRating={currentRating}
                  onRate={handleRatingSet}
                  // Disable rating if action pending OR if it's a game
                  disabled={isActionPending || mediaType === 'game'}
                />
              </div>

              {/* Review Section */}
              <div className={styles.reviewSection}>
                <button
                  onClick={handleToggleReview}
                  disabled={isActionPending && !isEditingReview}
                  className={`${styles.actionButton} ${styles.reviewButton}`}>
                  <span>
                    {isEditingReview ?
                      'Save Review'
                    : currentReview ?
                      'Edit Review'
                    : 'Add Review'}
                  </span>
                </button>
                {isEditingReview && (
                  <div className={styles.reviewEditor}>
                    <textarea
                      className={styles.reviewTextarea}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your review..."
                      rows={4}
                      disabled={logMediaItemMutation.isPending}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Login Prompt */}
          {!currentUser && (
            <div className={styles.loginPrompt}>
              <Link to="/login">Sign in</Link> to log, rate, or add to lists.
            </div>
          )}
        </aside>

        {/* Info Section */}
        <section className={styles.infoSection}>
          {/* Title and Meta */}
          <h1 className={styles.title} data-testid="media-title">
            {title}
          </h1>
          {item.originalTitle && title !== item.originalTitle && (
            <p className={styles.originalTitle}>
              Original Title: {item.originalTitle}
            </p>
          )}
          {/* --- Render Type-Specific Meta Info --- */}
          <div className={styles.meta}>
            <span className={styles.year}>{releaseYear}</span>
            {/* Add specific meta based on item.mediaType */}
            {(item.mediaType === 'movie' || item.mediaType === 'tv') &&
              item.runtime && (
                <span className={styles.runtime}>{item.runtime} mins</span>
              )}
            {item.mediaType === 'book' && item.pageCount && (
              <span className={styles.pages}>{item.pageCount} pages</span>
            )}
            {(item.mediaType === 'manga' || item.mediaType === 'book') &&
              item.chapters && (
                <span className={styles.chapters}>
                  {item.chapters} chapters
                </span>
              )}
            {item.mediaType === 'manga' && item.volumes && (
              <span className={styles.volumes}>{item.volumes} volumes</span>
            )}
            {item.status && (
              <span className={styles.status}>Status: {item.status}</span>
            )}
          </div>
          <div className={styles.meta}>
            {/* API Rating */}
            {item.averageScore !== null && item.averageScore !== undefined && (
              <span className={styles.rating}>
                {item.scoreSource} Rating:{' '}
                <strong>{item.averageScore.toFixed(1)}/10</strong>{' '}
                {/* Assuming normalized 0-10 */}
                {item.voteCount &&
                  ` (${item.voteCount.toLocaleString()} votes)`}
              </span>
            )}
          </div>
          {/* --- End Type-Specific Meta --- */}

          {tagline && <p className={styles.tagline}>"{tagline}"</p>}

          {/* Overview */}
          <h2 className={styles.sectionHeading}>Overview</h2>
          <p className={styles.overview}>
            {description || 'No overview available.'}
          </p>

          {/* Genres */}
          <h2 className={styles.sectionHeading}>Genres</h2>
          <div className={styles.genres}>
            {genres.map((g) => (
              <span key={g} className={styles.genreTag}>
                {g}
              </span>
            ))}
          </div>

          {/* --- Render Type-Specific Sections --- */}

          {/* Cast (Movies/TV) */}
          {(item.mediaType === 'movie' || item.mediaType === 'tv') &&
            item.credits?.cast &&
            item.credits.cast.length > 0 && (
              <MediaCastList cast={item.credits.cast.slice(0, 10)} />
            )}

          {/* Details Grid (Different content per type) */}
          <h2 className={styles.sectionHeading}>Details</h2>
          <div className={styles.detailsGrid}>
            {/* Common */}
            {item.originalTitle && (
              <div>
                <strong>Original Title:</strong> {item.originalTitle}
              </div>
            )}
            {item.releaseDate && (
              <div>
                <strong>Release Date:</strong> {item.releaseDate}
              </div>
            )}
            {/* Movie/TV Specific */}
            {(item.mediaType === 'movie' || item.mediaType === 'tv') &&
              item.director && (
                <div>
                  <strong>Director:</strong> {item.director}
                </div>
              )}
            {/* Book Specific */}
            {item.mediaType === 'book' &&
              item.authors &&
              item.authors.length > 0 && (
                <div>
                  <strong>Author(s):</strong> {item.authors.join(', ')}
                </div>
              )}
            {/* Game Specific */}
            {item.mediaType === 'game' &&
              item.platforms &&
              item.platforms.length > 0 && (
                <div>
                  <strong>Platforms:</strong> {item.platforms.join(', ')}
                </div>
              )}
            {item.mediaType === 'game' &&
              item.developers &&
              item.developers.length > 0 && (
                <div>
                  <strong>Developer(s):</strong> {item.developers.join(', ')}
                </div>
              )}
            {item.mediaType === 'game' &&
              item.publishers &&
              item.publishers.length > 0 && (
                <div>
                  <strong>Publisher(s):</strong> {item.publishers.join(', ')}
                </div>
              )}
            {/* Manga Specific */}
            {item.mediaType === 'manga' &&
              item.authors &&
              item.authors.length > 0 && (
                <div>
                  <strong>Author(s):</strong> {item.authors.join(', ')}
                </div>
              )}
            {item.mediaType === 'manga' &&
              item.artists &&
              item.artists.length > 0 && (
                <div>
                  <strong>Artist(s):</strong> {item.artists.join(', ')}
                </div>
              )}
            {item.mediaType === 'manga' && item.chapters && (
              <div>
                <strong>Chapters:</strong> {item.chapters}
              </div>
            )}
            {item.mediaType === 'manga' && item.volumes && (
              <div>
                <strong>Volumes:</strong> {item.volumes}
              </div>
            )}
            {/* Add more details */}
          </div>

          {/* Production Companies (If applicable) */}
          {item.production_companies &&
            item.production_companies.length > 0 && (
              <MediaProductionList companies={item.production_companies} />
            )}

          {/* Videos (If applicable) */}
          {item.videos?.results && item.videos.results.length > 0 && (
            <MediaVideoGallery videos={item.videos.results} />
          )}
        </section>
      </div>
    </div>
  );
}

// --- Placeholder Sub-components (Implement these) ---
const MediaCastList: React.FC<{ cast: any[] }> = ({ cast }) => (
  <>
    <h2 className={styles.sectionHeading}>Cast</h2>
    <div className={styles.castList}>
      {' '}
      {/* Use styles from MovieDetails CSS */}
      {cast.map((member: any) => (
        <div key={member.credit_id || member.id} className={styles.castMember}>
          <img
            src={member.profile_path}
            alt={member.name}
            loading="lazy"
            className={styles.castImage}
          />
          <strong className={styles.castName}>{member.name}</strong>
          <span className={styles.castCharacter}>{member.character}</span>
        </div>
      ))}
    </div>
  </>
);

const MediaProductionList: React.FC<{ companies: any[] }> = ({ companies }) => (
  <>
    <h2 className={styles.sectionHeading}>Production</h2>
    <div className={styles.productionList}>
      {' '}
      {/* Use styles from MovieDetails CSS */}
      {companies.map((pc: any) => (
        <span key={pc.id} className={styles.productionCompany}>
          {pc.logo_path && (
            <img src={pc.logo_path} alt={`${pc.name} logo`} loading="lazy" />
          )}
          {!pc.logo_path && pc.name}
        </span>
      ))}
    </div>
  </>
);

const MediaVideoGallery: React.FC<{ videos: any[] }> = ({ videos }) => {
  const trailers =
    videos?.filter((v) => v.type === 'Trailer' && v.site === 'YouTube') ?? [];
  const clips =
    videos
      ?.filter((v) => v.type === 'Clip' && v.site === 'YouTube')
      .slice(0, 3) ?? [];
  if (trailers.length === 0 && clips.length === 0) return null;
  return (
    <>
      <h2 className={styles.sectionHeading}>Videos</h2>
      <div className={styles.videoGallery}>
        {' '}
        {/* Use styles from MovieDetails CSS */}
        {[...trailers, ...clips].map((video) => (
          <a
            key={video.id}
            href={getYouTubeVideoUrl(video.key)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.videoThumbnail}>
            <img
              src={getYouTubeThumbnail(video.key)}
              alt={`${video.type}: ${video.name}`}
              loading="lazy"
            />
            <span>
              ▶️ {video.type}: {video.name}
            </span>
          </a>
        ))}
      </div>
    </>
  );
};
// --- End Placeholder Sub-components ---

export default ItemDetailsPage;
