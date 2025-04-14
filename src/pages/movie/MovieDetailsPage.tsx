// src/pages/MovieDetailPage.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom'; // Or TanStack Router equivalent
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { fetchMovieDetails, getImageUrl } from '../../lib/tmdb'; // Adjust path
import { invokeEdgeFunction } from '../../lib/supabaseClient'; // Adjust path
import type { WatchedItem } from '../../types/supabase'; // Adjust path
import { selectCurrentUser } from '../../store/features/auth/authSlice'; // Adjust path

import styles from './MovieDetailsPage.module.css'; // Create this CSS file
import { MovieDetails } from '../../types/tmdb';
import StarRating from '../../components/movies/MovieStarRating';
import { HeartIcon, HeartIconFilled } from '../../components/ui/svgs';
// Import child components later (e.g., StarRating, ActionsPanel)

const MovieDetailPage = () => {
  const { movieId } = useParams<{ movieId: string }>(); // Get ID from URL
  const currentUser = useSelector(selectCurrentUser);
  const queryClient = useQueryClient(); // For invalidating queries after mutations

  // --- Query 1: Fetch Movie Details from TMDB ---
  const {
    data: movie,
    isLoading: isLoadingTmdb,
    error: errorTmdb,
  } = useQuery<MovieDetails, Error>({
    queryKey: ['movie', movieId],
    queryFn: () => fetchMovieDetails(movieId!), // Use ! because enabled depends on movieId
    enabled: !!movieId, // Only run query if movieId exists
    staleTime: 1000 * 60 * 60, // Cache movie details for 1 hour
  });

  // --- Query 2: Fetch Watchlist Status from Supabase ---
  const watchlistQueryKey = ['watchlist', 'status', movieId];
  const {
    data: watchlistStatus, // Expected: { isOnWatchlist: boolean }
    isLoading: isLoadingWatchlist,
  } = useQuery<{ isOnWatchlist: boolean }, Error>({
    queryKey: watchlistQueryKey,
    queryFn: () =>
      invokeEdgeFunction('get-watchlist-status', { movieId: Number(movieId) }),
    enabled: !!currentUser && !!movieId, // Only run if user logged in and movieId exists
  });

  // --- Query 3: Fetch Watched Item details from Supabase ---
  const watchedQueryKey = ['watched', 'item', movieId];
  const {
    data: watchedItem, // Expected: WatchedItem | null
    isLoading: isLoadingWatched,
  } = useQuery<WatchedItem | null, Error>({
    queryKey: watchedQueryKey,
    queryFn: () =>
      invokeEdgeFunction('get-watched-item', { movieId: Number(movieId) }),
    enabled: !!currentUser && !!movieId,
  });

  // --- Mutations ---
  // Watchlist Add/Remove
  const toggleWatchlistMutation = useMutation<any, Error, boolean>({
    // Takes boolean: true to add, false to remove
    mutationFn: async (shouldAdd) => {
      const functionName =
        shouldAdd ? 'add-to-watchlist' : 'remove-from-watchlist';
      return invokeEdgeFunction(functionName, { movieId: Number(movieId) });
    },
    onSuccess: () => {
      // Refetch the status after mutation succeeds
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey });
      console.log('Watchlist updated!');
      // Can add optimistic updates here for faster UI feedback
    },
    onError: (error) => {
      console.error('Error updating watchlist:', error);
      // Show error toast to user
    },
  });

  // Log/Update Watched Item
  const logWatchedMutation = useMutation<
    any,
    Error,
    Partial<
      Omit<
        WatchedItem,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'movie_id'
      >
    >
  >({
    mutationFn: async (watchedData) => {
      return invokeEdgeFunction('log-watched-movie', {
        movieId: Number(movieId),
        ...watchedData, // Pass rating, liked, review etc.
      });
    },
    onSuccess: () => {
      // Refetch watched item details AND potentially watchlist status (if adding to watched removes from watchlist)
      queryClient.invalidateQueries({ queryKey: watchedQueryKey });
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey }); // Optional: if logging removes from watchlist
      console.log('Watched item updated!');
    },
    onError: (error) => {
      console.error('Error logging watched movie:', error);
    },
  });

  // --- Event Handlers ---
  const handleWatchlistToggle = () => {
    if (!currentUser || !movie) return;
    const currentlyOnList = watchlistStatus?.isOnWatchlist ?? false;
    toggleWatchlistMutation.mutate(!currentlyOnList); // Pass 'true' to add, 'false' to remove
  };

  const handleLikeToggle = () => {
    if (!currentUser || !movie) return;
    const currentLiked = watchedItem?.liked ?? false;
    logWatchedMutation.mutate({ liked: !currentLiked });
  };

  const handleRatingSet = (newRating: number | null) => {
    // rating is 1-10 (0.5 stars) or null to remove
    if (!currentUser || !movie) return;
    logWatchedMutation.mutate({ rating: newRating });
  };

  // New handler for the "Log/Watched" button
  const handleLogWatched = () => {
    if (!currentUser || !movie) return;
    // Create/update entry, maybe set watched_date to today if not already set
    const updates: Partial<
      Omit<
        WatchedItem,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'movie_id'
      >
    > = {};
    if (!watchedItem?.watched_date) {
      updates.watched_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }
    // Ensure liked/rating aren't accidentally reset if just logging
    if (watchedItem?.liked !== undefined) updates.liked = watchedItem.liked;
    else updates.liked = null; // Preserve or set null
    if (watchedItem?.rating !== undefined) updates.rating = watchedItem.rating;
    else updates.rating = null; // Preserve or set null

    // If no interaction exists yet, ensure `liked` is not set unless explicitly liked
    if (!watchedItem) {
      updates.liked = false; // Default to not liked if just logging
    }

    logWatchedMutation.mutate(updates);
  };

  // Placeholder for review logic state/handler
  const [isEditingReview, setIsEditingReview] = React.useState(false);
  const [reviewText, setReviewText] = React.useState(''); // Use this for textarea later

  const handleToggleReview = () => {
    if (!currentUser) return;
    if (isEditingReview) {
      // Logic to save review would go here using logWatchedMutation
      console.log('Save review:', reviewText);
      logWatchedMutation.mutate({ review: reviewText || null }); // Save or clear review
    } else {
      // Set initial text if editing existing review
      setReviewText(watchedItem?.review || '');
    }
    setIsEditingReview(!isEditingReview);
  };

  // --- Render Logic ---
  if (isLoadingTmdb) {
    return <div className={styles.loading}>Loading movie details...</div>; // Add better loading state
  }

  if (errorTmdb || !movie) {
    return <div className={styles.error}>Error loading movie details.</div>; // Add better error state
  }

  // --- Extracted Data for Rendering ---
  const {
    title,
    backdrop_path,
    poster_path,
    tagline,
    overview,
    release_date,
    runtime,
    vote_average,
    genres = [],
    credits,
    videos,
  } = movie; // Destructure movie details

  const releaseYear =
    release_date ? new Date(release_date).getFullYear() : 'N/A';
  const backdropUrl = getImageUrl(backdrop_path, 'w1280');
  const posterUrl = getImageUrl(poster_path, 'w500');

  // Determine current interaction states
  const isOnWatchlist = watchlistStatus?.isOnWatchlist ?? false;
  const isLiked = watchedItem?.liked ?? false;
  const currentRating = watchedItem?.rating ?? null; // Assuming rating is 1-10 or null
  // Determine if movie is considered 'watched' (i.e., has an entry)
  const isWatched = !!watchedItem;
  const LikeIcon = isLiked ? HeartIconFilled : HeartIcon; // Choose filled/empty heart

  // Combine loading/pending states for disabling buttons
  const isActionPending =
    toggleWatchlistMutation.isPending || logWatchedMutation.isPending;

  return (
    <div className={styles.pageContainer}>
      {/* Optional Backdrop */}
      {backdropUrl && (
        <div
          className={styles.backdrop}
          style={{ backgroundImage: `url(${backdropUrl})` }}></div>
      )}
      <div className={styles.backdropOverlay}></div>{' '}
      {/* Gradient/dark overlay */}
      <div className={styles.mainContent}>
        {/* Left Side: Poster & Actions */}
        <aside className={styles.sidebar}>
          <img
            src={posterUrl || '/placeholder-poster.png'}
            alt={`${title} Poster`}
            className={styles.poster}
          />
          {currentUser && (
            <div className={styles.actionsPanel}>
              <button
                onClick={handleWatchlistToggle}
                disabled={toggleWatchlistMutation.isPending}
                className={`${styles.actionButton} ${isOnWatchlist ? styles.active : ''}`}
                title={
                  isOnWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'
                }>
                {/* Eye Icon or similar */}
                {toggleWatchlistMutation.isPending ?
                  '...'
                : isOnWatchlist ?
                  'On Watchlist'
                : 'Watchlist'}
              </button>
              <button
                onClick={handleLikeToggle}
                disabled={logWatchedMutation.isPending}
                className={`${styles.actionButton} ${isLiked ? styles.active : ''}`}
                title={isLiked ? 'Unlike' : 'Like'}>
                {/* Heart Icon */}
                {LikeIcon()}
              </button>
              <StarRating
                currentRating={currentRating}
                onRate={handleRatingSet}
                disabled={logWatchedMutation.isPending}
              />
              <p>
                Rating:{' '}
                {currentRating ? (currentRating / 2).toFixed(1) : 'Not Rated'}
              </p>
              {/* Add "Mark Watched" / "Log" / Review Button */}
            </div>
          )}
          {!currentUser && (
            <p className={styles.loginPrompt}>
              <Link to="/login">Sign in</Link> to log, rate, or review...
            </p>
          )}
        </aside>

        {/* Right Side: Movie Info */}
        <section className={styles.infoSection}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.meta}>
            <span className={styles.year}>{releaseYear}</span>
            {/* Add Director Here */}
            {/* <span>Directed by <Link to={`/director/${directorId}`}>{directorName}</Link></span> */}
            {runtime && <span className={styles.runtime}>{runtime} mins</span>}
          </div>

          {tagline && <p className={styles.tagline}>"{tagline}"</p>}
          <h2 className={styles.sectionHeading}>Overview</h2>
          <p className={styles.overview}>
            {overview || 'No overview available.'}
          </p>

          <h2 className={styles.sectionHeading}>Genres</h2>
          <div className={styles.genres}>
            {genres.map((g) => (
              <span key={g.id} className={styles.genreTag}>
                {g.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MovieDetailPage;
