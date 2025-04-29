import React from 'react';
import { useParams, useLoaderData, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getImageUrl } from '../../../../../../lib/tmdb';
import type { WatchedItem } from '../../../../../../lib/types/supabase';
import styles from './MovieDetailsPage.module.css'; // Using updated CSS Module
import StarRating from '../../components/MovieStarRating/MovieStarRating';
import {
  HeartIcon,
  HeartIconFilled,
} from '../../../../../../shared/infraestructure/components/ui/svgs';
import { movieRoute } from '../../../../../../routes/routes';
import { User } from '@supabase/supabase-js';
import {
  getCurrentUserUseCase,
  getWatchedStatusUseCase,
  getWatchlistStatusUseCase,
  logWatchedMovieUseCase,
  removeLoggedMovieUseCase,
  toggleWatchlistUseCase,
} from '../../../../useCases'; // Assuming use cases are available via context/DI
import {
  ResponseError,
  ToggleWatchListResponseSuccess,
} from '../../../../domain';
import { MovieDetails } from '../../../../../../lib/types/tmdb'; // Ensure this type includes ALL fields now

// Helper function to format currency
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || amount === 0) {
    return 'N/A';
  }
  return `$${amount.toLocaleString('en-US')}`;
};

// Helper function to get YouTube thumbnail URL
const getYouTubeThumbnail = (key: string): string => {
  return `https://img.youtube.com/vi/${key}/mqdefault.jpg`;
};

// Helper function to get YouTube video URL
const getYouTubeVideoUrl = (key: string): string => {
  return `https://www.youtube.com/watch?v=${key}`;
};

const MovieDetailPage = () => {
  const movie = useLoaderData({ from: movieRoute.id }) as MovieDetails; // Assert type
  const params = useParams({ from: movieRoute.id });
  const movieId = params.movieId;
  const queryClient = useQueryClient();
  const [isEditingReview, setIsEditingReview] = React.useState(false);
  const [reviewText, setReviewText] = React.useState('');
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const getCurrentUserQueryKey = ['get-current-user'];
  const { data: userData } = useQuery<{ user: User | null }, Error>({
    queryKey: getCurrentUserQueryKey,
    queryFn: async () => getCurrentUserUseCase.execute(), // Assumes execute returns { user: User | null }
    staleTime: Infinity, // User data doesn't change often within the app session
  });

  React.useEffect(() => {
    if (userData) setCurrentUser(userData.user);
  }, [userData]);

  const watchlistQueryKey = ['watchlist', 'status', movieId];
  const { data: watchlistStatus } = useQuery<{ isOnWatchlist: boolean }, Error>(
    {
      queryKey: watchlistQueryKey,
      queryFn: async (): Promise<{ isOnWatchlist: boolean }> => {
        const response = await getWatchlistStatusUseCase.execute({
          // userId: currentUser?.id, // Pass userId if needed by use case
          movieId: Number(movieId),
        });
        return { isOnWatchlist: response.isOnWatchlist };
      },
      enabled: !!currentUser && !!movieId,
    }
  );

  const watchedQueryKey = ['watched', 'item', movieId];
  const { data: watchedItemData } = useQuery<WatchedItem | null, Error>({
    // Expect WatchedItem | null
    queryKey: watchedQueryKey,
    queryFn: async (): Promise<WatchedItem | null> => {
      const response = await getWatchedStatusUseCase.execute({
        // userId: currentUser?.id, // Pass userId if needed by use case
        movieId: Number(movieId),
      });
      return response.watchedItem ?? null;
    },
    enabled: !!currentUser && !!movieId,
  });
  // Extracted watchedItem for easier use, handling undefined from useQuery
  const watchedItem = watchedItemData ?? null;

  // --- Mutations ---
  const toggleWatchlistMutation = useMutation<
    ToggleWatchListResponseSuccess | ResponseError, // Assuming these types exist
    Error,
    boolean, // shouldAdd
    { previousStatus: { isOnWatchlist: boolean } | undefined } // Context type
  >({
    mutationFn: async (shouldAdd) =>
      toggleWatchlistUseCase.execute({ shouldAdd, movieId: Number(movieId) }), // Use Case call
    onMutate: async (shouldAdd) => {
      await queryClient.cancelQueries({ queryKey: watchlistQueryKey });
      const previousStatus = queryClient.getQueryData<{
        isOnWatchlist: boolean;
      }>(watchlistQueryKey);
      queryClient.setQueryData(watchlistQueryKey, { isOnWatchlist: shouldAdd });
      return { previousStatus };
    },
    onError: (error, variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(watchlistQueryKey, context.previousStatus);
      }
      console.error('Error toggling watchlist:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey });
    },
  });

  type LogWatchedVariables = Partial<
    Omit<
      WatchedItem,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'movie_id'
    >
  >;
  interface LogWatchedMutationContext {
    previousWatchedItem: WatchedItem | null | undefined;
  }

  const watchedListQueryKey = ['watched', 'list', currentUser?.id];
  const logWatchedMutation = useMutation<
    any, // Return type of logWatchedItemUseCase.execute
    Error,
    LogWatchedVariables,
    LogWatchedMutationContext
  >({
    // Assuming you have a logWatchedItemUseCase
    mutationFn: async (watchedData) => {
      if (!currentUser || !movieId)
        throw new Error('Cannot log watched item without user or movie ID');
      return logWatchedMovieUseCase.execute({
        movieId: Number(movieId),
        watchedData: { ...watchedData }, // Pass rating, liked, review, etc.
      });
    },
    onMutate: async (variables): Promise<LogWatchedMutationContext> => {
      await queryClient.cancelQueries({ queryKey: watchedQueryKey });
      const previousWatchedItem = queryClient.getQueryData<WatchedItem | null>(
        watchedQueryKey
      );
      let optimisticWatchedItem: WatchedItem | null;
      if (previousWatchedItem) {
        optimisticWatchedItem = {
          ...previousWatchedItem,
          ...variables,
          updated_at: new Date().toISOString(),
        };
      } else {
        optimisticWatchedItem = {
          user_id: currentUser?.id || 'unknown',
          movie_id: Number(movieId),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          rating: null,
          liked: false,
          watched_date: null,
          review: null,
          ...variables,
        } as WatchedItem;
      }
      queryClient.setQueryData(watchedQueryKey, optimisticWatchedItem);
      return { previousWatchedItem };
    },
    onError: (error, variables, context) => {
      if (context?.previousWatchedItem !== undefined) {
        queryClient.setQueryData(watchedQueryKey, context.previousWatchedItem);
      }
      console.error('Error logging watched movie:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchedQueryKey });
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey });
      queryClient.invalidateQueries({ queryKey: watchedListQueryKey });
    },
  });

  const removeWatchedMutation = useMutation<any, Error>({
    mutationFn: async () => {
      if (!currentUser || !movieId)
        throw new Error('Cannot unlog watched item without user or movie ID');
      return removeLoggedMovieUseCase.execute({
        movieId: Number(movieId),
      });
    },
    onMutate: async (): Promise<LogWatchedMutationContext> => {
      await queryClient.cancelQueries({ queryKey: watchedQueryKey });
      const previousWatchedItem = queryClient.getQueryData<WatchedItem | null>(
        watchedQueryKey
      );
      let optimisticWatchedItem: WatchedItem | null;
      optimisticWatchedItem = null;
      queryClient.setQueryData(watchedQueryKey, optimisticWatchedItem);
      return { previousWatchedItem };
    },
    onError: (error, context) => {
      queryClient.invalidateQueries({ queryKey: watchedQueryKey });
      console.error('Error unlogging watched movie:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchedQueryKey });
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey });
      queryClient.invalidateQueries({ queryKey: watchedListQueryKey });
    },
  });

  // --- Event Handlers ---
  const handleWatchlistToggle = () => {
    if (!currentUser || !movieId) return;
    const currentlyOnList = watchlistStatus?.isOnWatchlist ?? false;
    toggleWatchlistMutation.mutate(!currentlyOnList);
  };

  const handleLikeToggle = () => {
    if (!currentUser || !movieId) return;
    const currentLiked = watchedItem?.liked ?? false;
    logWatchedMutation.mutate({ liked: !currentLiked });
  };

  const handleRatingSet = (newRating: number | null) => {
    if (!currentUser || !movieId) return;
    logWatchedMutation.mutate({ rating: newRating });
  };

  const handleLogWatched = () => {
    if (!currentUser || !movieId) return;
    const updates: LogWatchedVariables = {};
    if (!watchedItem?.watched_date) {
      updates.watched_date = new Date().toISOString().split('T')[0];
    }
    updates.liked = watchedItem?.liked ?? false;
    updates.rating = watchedItem?.rating ?? null;
    updates.review = watchedItem?.review ?? null;
    if (!isWatched) {
      logWatchedMutation.mutate(updates);
    } else {
      removeWatchedMutation.mutate();
    }
  };

  const handleToggleReview = () => {
    if (!currentUser) return;
    if (isEditingReview) {
      logWatchedMutation.mutate({ review: reviewText.trim() || null });
      setIsEditingReview(false);
    } else {
      setReviewText(watchedItem?.review || '');
      setIsEditingReview(true);
    }
  };

  // --- Loading / Error States ---
  // Loader handles initial movie load, but we need loading for user/watchlist/watched
  if (!movie) {
    // This case should ideally be handled by Router's pending/error components
    return <div className={styles.loading}>Loading movie...</div>;
  }

  // --- Destructure ALL data from 'movie' (result of useLoaderData) ---
  const {
    title,
    original_title,
    original_language,
    backdrop_path,
    poster_path,
    tagline,
    overview,
    release_date,
    runtime,
    status,
    budget,
    revenue,
    vote_average,
    vote_count,
    genres = [],
    production_companies = [],
    production_countries = [],
    spoken_languages = [],
    homepage,
    imdb_id,
    credits, // Contains cast and crew
    videos, // Contains video results
    belongs_to_collection, // Add if you want to display collection info
    // adult, video (usually not displayed directly)
  } = movie;

  // --- Derived Data & Formatting ---
  const releaseYear =
    release_date ? new Date(release_date).getFullYear() : 'N/A';
  const backdropUrl = getImageUrl(backdrop_path, 'w1280');
  const posterUrl = getImageUrl(poster_path, 'w500');
  const imdbUrl = imdb_id ? `https://www.imdb.com/title/${imdb_id}` : null;

  // User interaction states
  const isOnWatchlist = watchlistStatus?.isOnWatchlist ?? false;
  const isLiked = watchedItem?.liked ?? false;
  const currentRating = watchedItem?.rating ?? null; // User's rating
  const currentReview = watchedItem?.review ?? null;
  const watchedDate = watchedItem?.watched_date ?? null;
  const isWatched = !!watchedItem; // Simpler check if an entry exists
  const LikeIcon = isLiked ? HeartIconFilled : HeartIcon;

  // Combined pending state for disabling actions
  const isActionPending =
    toggleWatchlistMutation.isPending || logWatchedMutation.isPending;

  // Extract top cast and key crew (Director, Composer)
  const topCast = credits?.cast?.slice(0, 10) ?? []; // Show top 10 actors
  const director = credits?.crew?.find((person) => person.job === 'Director');
  const composer = credits?.crew?.find(
    (person) => person.job === 'Original Music Composer'
  );
  // You can add more crew roles (Writer, DoP, etc.)

  // Extract relevant videos (e.g., Trailers)
  const trailers =
    videos?.results?.filter(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    ) ?? [];
  const clips =
    videos?.results
      ?.filter((v) => v.type === 'Clip' && v.site === 'YouTube')
      .slice(0, 3) ?? []; // Show a few clips

  // --- Render Logic ---
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
            src={posterUrl || '/placeholder-poster.png'} // Provide a fallback image
            alt={`${title} Poster`}
            className={styles.poster}
            loading="lazy" // Lazy load poster
          />
          {/* Actions Panel */}
          {currentUser && (
            <div className={styles.actionsPanel}>
              {/* Watchlist Button */}
              <button
                data-testid="watchlist-toggle-button" // Added for Cypress
                onClick={handleWatchlistToggle}
                disabled={toggleWatchlistMutation.isPending}
                className={`${styles.actionButton} ${isOnWatchlist ? styles.active : ''}`}
                title={
                  isOnWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'
                }>
                {/* Placeholder for Icon */}
                <span>
                  {toggleWatchlistMutation.isPending ?
                    '...'
                  : isOnWatchlist ?
                    'On List'
                  : 'Watchlist'}
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

              {/* Log Watched Button */}
              <button
                onClick={handleLogWatched}
                disabled={isActionPending}
                className={`${styles.actionButton} ${styles.logButton} ${isWatched ? styles.active : ''}`}
                title={isWatched ? 'Logged as Watched' : 'Log as Watched'}>
                {/* Placeholder for Icon (e.g., Eye) */}
                <span>{isWatched ? 'Watched' : 'Log'}</span>
              </button>

              {/* Rating Section */}
              <div className={styles.ratingSection}>
                <span className={styles.ratingLabel}>Your Rating</span>
                <StarRating
                  currentRating={currentRating} // User's rating
                  onRate={handleRatingSet}
                  disabled={isActionPending}
                />
              </div>

              {/* Review Section */}
              <div className={styles.reviewSection}>
                <button
                  onClick={handleToggleReview}
                  disabled={isActionPending && !isEditingReview} // Allow saving while pending other actions
                  className={`${styles.actionButton} ${styles.reviewButton}`}>
                  {/* Placeholder for Icon (e.g., Pen) */}
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
                      disabled={logWatchedMutation.isPending} // Disable while saving review
                    />
                    {/* Optional: Add Cancel button */}
                    {/* <button onClick={() => setIsEditingReview(false)} className={styles.reviewCancelButton}>Cancel</button> */}
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
          <h1 className={styles.title} data-testid="movie-title">
            {title}
          </h1>
          {original_title && title !== original_title && (
            <p className={styles.originalTitle}>
              Original Title: {original_title}
            </p>
          )}
          <div className={styles.meta}>
            <span className={styles.year}>{releaseYear}</span>
            {director && (
              <span className={styles.director}>
                Directed by{' '}
                {/* Link to director page if you have routes for it */}
                <strong>{director.name}</strong>
              </span>
            )}
            {runtime && <span className={styles.runtime}>{runtime} mins</span>}
          </div>
          <div className={styles.meta}>
            <span className={styles.rating}>
              TMDB Rating:{' '}
              <strong>{vote_average ? vote_average.toFixed(1) : 'N/A'}</strong>{' '}
              ({vote_count?.toLocaleString()} votes)
            </span>
            {status && <span className={styles.status}>Status: {status}</span>}
          </div>

          {tagline && <p className={styles.tagline}>"{tagline}"</p>}

          {/* Overview */}
          <h2 className={styles.sectionHeading}>Overview</h2>
          <p className={styles.overview}>
            {overview || 'No overview available.'}
          </p>

          {/* Genres */}
          <h2 className={styles.sectionHeading}>Genres</h2>
          <div className={styles.genres}>
            {genres.map((g) => (
              // Link to genre browse page if available
              <span key={g.id} className={styles.genreTag}>
                {g.name}
              </span>
            ))}
          </div>

          {/* Cast */}
          {topCast.length > 0 && (
            <>
              <h2 className={styles.sectionHeading}>Top Billed Cast</h2>
              <div className={styles.castList}>
                {topCast.map((member) => (
                  <div key={member.credit_id} className={styles.castMember}>
                    <img
                      src={
                        getImageUrl(member.profile_path, 'w185') || undefined
                      }
                      alt={member.name}
                      loading="lazy"
                      className={styles.castImage}
                      onError={(e) =>
                        (e.currentTarget.src = '/placeholder-person.png')
                      } // Fallback
                    />
                    <strong className={styles.castName}>{member.name}</strong>
                    <span className={styles.castCharacter}>
                      {member.character}
                    </span>
                  </div>
                ))}
                {/* Link to full cast page if desired */}
              </div>
            </>
          )}

          {/* Production Details */}
          <h2 className={styles.sectionHeading}>Details</h2>
          <div className={styles.detailsGrid}>
            {original_language && (
              <div>
                <strong>Original Language:</strong>{' '}
                {original_language.toUpperCase()}
              </div>
            )}
            {budget && budget > 0 && (
              <div>
                <strong>Budget:</strong> {formatCurrency(budget)}
              </div>
            )}
            {revenue && revenue > 0 && (
              <div>
                <strong>Revenue:</strong> {formatCurrency(revenue)}
              </div>
            )}
            {homepage && (
              <div>
                <strong>Homepage:</strong>{' '}
                <a href={homepage} target="_blank" rel="noopener noreferrer">
                  Visit Site
                </a>
              </div>
            )}
            {imdbUrl && (
              <div>
                <strong>IMDb:</strong>{' '}
                <a href={imdbUrl} target="_blank" rel="noopener noreferrer">
                  View on IMDb
                </a>
              </div>
            )}
          </div>

          {/* Production Companies */}
          {production_companies.length > 0 && (
            <>
              <h2 className={styles.sectionHeading}>Production Companies</h2>
              <div className={styles.productionList}>
                {production_companies.map((pc) => (
                  <span key={pc.id} className={styles.productionCompany}>
                    {pc.logo_path && (
                      <img
                        src={getImageUrl(pc.logo_path, 'w92') || undefined}
                        alt={`${pc.name} logo`}
                        loading="lazy"
                      />
                    )}
                    {!pc.logo_path && pc.name} {/* Show name if no logo */}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Videos */}
          {(trailers.length > 0 || clips.length > 0) && (
            <>
              <h2 className={styles.sectionHeading}>Videos</h2>
              <div className={styles.videoGallery}>
                {trailers.map((video) => (
                  <a
                    key={video.id}
                    href={getYouTubeVideoUrl(video.key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.videoThumbnail}>
                    <img
                      src={getYouTubeThumbnail(video.key)}
                      alt={`Trailer: ${video.name}`}
                      loading="lazy"
                    />
                    <span>▶️ Trailer: {video.name}</span>
                  </a>
                ))}
                {clips.map((video) => (
                  <a
                    key={video.id}
                    href={getYouTubeVideoUrl(video.key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.videoThumbnail}>
                    <img
                      src={getYouTubeThumbnail(video.key)}
                      alt={`Clip: ${video.name}`}
                      loading="lazy"
                    />
                    <span>▶️ Clip: {video.name}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default MovieDetailPage;
