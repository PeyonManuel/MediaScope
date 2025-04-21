import React from 'react';
// --- TanStack Router Imports ---
import { useParams, useLoaderData, Link } from '@tanstack/react-router';
// --- TanStack Query Imports ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// --- Redux Import ---
import { useSelector } from 'react-redux';

// --- Your Hooks/Components/Lib Imports ---
import { getImageUrl } from '../../lib/tmdb'; // fetchMovieDetails is now used in the loader
import { invokeEdgeFunction } from '../../lib/supabaseClient';
import type { WatchedItem } from '../../types/supabase';
import { selectCurrentUser } from '../../store/features/auth/authSlice';
import styles from './MovieDetailsPage.module.css';
import { MovieDetails } from '../../types/tmdb';
import StarRating from '../../components/movies/MovieStarRating';
import { HeartIcon, HeartIconFilled } from '../../components/ui/svgs';
import { movieRoute } from '../../routes/routes.ts'; // Import route definition if needed for types/hooks

const MovieDetailPage = () => {
  // --- Get loader data and params from TanStack Router ---
  // useLoaderData returns the data from the route's loader function
  const movie = useLoaderData({ from: movieRoute.id }); // Type is inferred from loader return
  // useParams gets path parameters ($movieId becomes movieId)
  const params = useParams({ from: movieRoute.id });
  const movieId = params.movieId; // Use the param obtained by the router

  // --- Component State and Redux ---
  const currentUser = useSelector(selectCurrentUser);
  const queryClient = useQueryClient();
  const [isEditingReview, setIsEditingReview] = React.useState(false);
  const [reviewText, setReviewText] = React.useState('');

  // --- Query 1: Movie Details (REMOVED - Handled by useLoaderData) ---
  // No longer needed here, data comes from useLoaderData()

  // --- Query 2: Fetch Watchlist Status from Supabase (Stays in component) ---
  const watchlistQueryKey = ['watchlist', 'status', movieId];
  const {
    data: watchlistStatus,
    // isLoading: isLoadingWatchlist, // Can use this for finer-grained loading indicators
  } = useQuery<{ isOnWatchlist: boolean }, Error>({
    queryKey: watchlistQueryKey,
    queryFn: () =>
      // Ensure movieId is passed as number if required by edge function
      invokeEdgeFunction('get-watchlist-status', { movieId: Number(movieId) }),
    // Use movieId from useParams. Query runs only if user logged in and movieId is valid.
    enabled: !!currentUser && !!movieId,
  });

  // --- Query 3: Fetch Watched Item details from Supabase (Stays in component) ---
  const watchedQueryKey = ['watched', 'item', movieId];
  const {
    data: watchedItem,
    // isLoading: isLoadingWatched, // Can use this for finer-grained loading indicators
  } = useQuery<WatchedItem | null, Error>({
    queryKey: watchedQueryKey,
    queryFn: () =>
      invokeEdgeFunction('get-watched-item', { movieId: Number(movieId) }),
    enabled: !!currentUser && !!movieId,
  });

  // --- Mutations ---
  const toggleWatchlistMutation = useMutation<
    any, // Type of data returned by the edge function (can be more specific)
    Error, // Type of error
    boolean // Type of variable passed to mutationFn (true to add, false to remove)
  >({
    mutationFn: async (shouldAdd) => {
      // Determine which edge function to call
      const functionName =
        shouldAdd ? 'add-to-watchlist' : 'remove-from-watchlist';
      console.log(`Calling ${functionName} for movieId: ${movieId}`);
      // Call the edge function, ensuring movieId is passed correctly (e.g., as number)
      return invokeEdgeFunction(functionName, { movieId: Number(movieId) });
    },
    onSuccess: (data, variables) => {
      // Variables holds the boolean passed to mutate (shouldAdd)
      console.log(
        `Watchlist successfully ${variables ? 'added to' : 'removed from'}!`,
        data
      );
      // Refetch the watchlist status query to update the UI
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey });
      // Optionally show a success toast/message
    },
    onError: (error, variables) => {
      console.error(
        `Error ${variables ? 'adding to' : 'removing from'} watchlist:`,
        error
      );
      // Optionally show an error toast/message to the user
    },
  });

  const logWatchedMutation = useMutation<
    any, // Type of data returned by the edge function
    Error, // Type of error
    // Type for variables passed to mutationFn: Partial object of WatchedItem fields
    Partial<
      Omit<
        WatchedItem,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'movie_id'
      >
    >
  >({
    mutationFn: async (watchedData) => {
      console.log(
        `Calling log-watched-movie for movieId: ${movieId} with data:`,
        watchedData
      );
      // Call the edge function to log/update watched data
      return invokeEdgeFunction('log-watched-movie', {
        movieId: Number(movieId), // Pass movieId
        ...watchedData, // Pass other fields like rating, liked, review, watched_date
      });
    },
    onSuccess: (data, variables) => {
      console.log('Watched item successfully updated/logged!', variables, data);
      // Refetch both the watched item details and watchlist status
      // (logging might implicitly remove from watchlist in some setups)
      queryClient.invalidateQueries({ queryKey: watchedQueryKey });
      queryClient.invalidateQueries({ queryKey: watchlistQueryKey });
      // Optionally show a success toast/message
    },
    onError: (error, variables) => {
      console.error('Error logging watched movie:', variables, error);
      // Optionally show an error toast/message to the user
    },
  });

  // --- Event Handlers ---
  const handleWatchlistToggle = () => {
    // Ensure user is logged in and movieId is available
    if (!currentUser || !movieId) {
      console.warn(
        'User not logged in or movieId missing for watchlist toggle.'
      );
      // Optionally prompt login
      return;
    }
    // Determine if the item is currently on the list (use nullish coalescing for safety)
    const currentlyOnList = watchlistStatus?.isOnWatchlist ?? false;
    // Call the mutation with the opposite action (true to add, false to remove)
    toggleWatchlistMutation.mutate(!currentlyOnList);
  };

  const handleLikeToggle = () => {
    // Ensure user is logged in and movieId is available
    if (!currentUser || !movieId) {
      console.warn('User not logged in or movieId missing for like toggle.');
      return;
    }
    // Determine the current liked status (default to false if no watchedItem exists)
    const currentLiked = watchedItem?.liked ?? false;
    // Call the mutation to update the 'liked' status
    logWatchedMutation.mutate({ liked: !currentLiked });
  };

  const handleRatingSet = (newRating: number | null) => {
    // newRating is expected to be 1-10 (or null to remove rating)
    if (!currentUser || !movieId) {
      console.warn('User not logged in or movieId missing for rating set.');
      return;
    }
    console.log('Setting rating to:', newRating);
    // Call the mutation to update the 'rating'
    logWatchedMutation.mutate({ rating: newRating });
  };

  const handleLogWatched = () => {
    // "Log" button clicked - ensures an entry exists, sets watched_date if needed
    if (!currentUser || !movieId) {
      console.warn('User not logged in or movieId missing for log watched.');
      return;
    }

    // Prepare the data payload for the mutation
    const updates: Partial<
      Omit<
        WatchedItem,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'movie_id'
      >
    > = {};

    // Set watched_date to today if it doesn't exist on the current item
    if (!watchedItem?.watched_date) {
      updates.watched_date = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    }

    // Preserve existing like/rating status unless explicitly changed elsewhere
    // If creating a new entry, default liked to false, rating to null
    updates.liked = watchedItem?.liked ?? false;
    updates.rating = watchedItem?.rating ?? null;
    // Preserve review if it exists
    if (watchedItem?.review !== undefined) updates.review = watchedItem.review;

    console.log('Logging watched movie with updates:', updates);
    // Call the mutation to create/update the watched entry
    logWatchedMutation.mutate(updates);
  };

  const handleToggleReview = () => {
    if (!currentUser || !movieId) {
      console.warn('User not logged in or movieId missing for review toggle.');
      return;
    }

    if (isEditingReview) {
      // Currently editing, so "Save" was clicked
      console.log('Saving review:', reviewText);
      // Call mutation to save the review text (or null if empty to clear it)
      logWatchedMutation.mutate({ review: reviewText.trim() || null });
      // Exit editing mode after attempting save
      setIsEditingReview(false);
    } else {
      // Not editing, so "Edit" or "Add Review" was clicked
      // Populate the textarea with the current review text (or empty string)
      setReviewText(watchedItem?.review || '');
      // Enter editing mode
      setIsEditingReview(true);
    }
  };

  // --- Render Logic ---
  // NOTE: Loading/Error for the main movie data is now best handled by
  // TanStack Router's `pendingComponent` and `errorComponent` options on the route definition.
  // If not using those, `movie` from useLoaderData will be undefined until loaded.
  // We'll keep a basic check here for simplicity, but recommend using the route options.
  if (!movie) {
    // This state might not be reached if using pendingComponent
    return <div className={styles.loading}>Loading movie details...</div>;
  }
  // Error handling should ideally use errorComponent in the route definition

  // --- Extracted Data for Rendering (movie comes from useLoaderData) ---
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
  } = movie; // Destructure movie details from loader data

  const releaseYear =
    release_date ? new Date(release_date).getFullYear() : 'N/A';
  const backdropUrl = getImageUrl(backdrop_path, 'w1280');
  const posterUrl = getImageUrl(poster_path, 'w500');

  // Determine current interaction states (remains the same logic)
  const isOnWatchlist = watchlistStatus?.isOnWatchlist ?? false;
  const isLiked = watchedItem?.liked ?? false;
  const currentRating = watchedItem?.rating ?? null;
  const isWatched = !!watchedItem;
  const LikeIcon = isLiked ? HeartIconFilled : HeartIcon;

  // Combine loading/pending states for disabling buttons (remains the same)
  const isActionPending =
    toggleWatchlistMutation.isPending || logWatchedMutation.isPending;

  // --- JSX (Remains largely the same, just uses 'movie' from useLoaderData) ---
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
          {/* ... poster ... */}
          <img
            src={posterUrl || '/placeholder-poster.png'}
            alt={`${title} Poster`}
            className={styles.poster}
          />
          {/* Actions Panel - Conditionally render based on currentUser */}
          {currentUser && (
            <div className={styles.actionsPanel}>
              {/* ... watchlist button ... */}
              <button
                onClick={handleWatchlistToggle}
                disabled={toggleWatchlistMutation.isPending}
                className={`${styles.actionButton} ${isOnWatchlist ? styles.active : ''}`}
                title={
                  isOnWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'
                }>
                {toggleWatchlistMutation.isPending ?
                  '...'
                : isOnWatchlist ?
                  'On Watchlist'
                : 'Watchlist'}
              </button>
              {/* ... like button ... */}
              <button
                onClick={handleLikeToggle}
                disabled={logWatchedMutation.isPending}
                className={`${styles.actionButton} ${isLiked ? styles.active : ''}`}
                title={isLiked ? 'Unlike' : 'Like'}>
                {LikeIcon()}
              </button>
              {/* ... star rating ... */}
              <StarRating
                currentRating={currentRating}
                onRate={handleRatingSet}
                disabled={logWatchedMutation.isPending}
              />
              <p>Rating: {vote_average ? vote_average.toFixed(2) : 'N/A'}</p>
              {/* ... other actions ... */}
            </div>
          )}
          {!currentUser && (
            <p className={styles.loginPrompt}>
              <Link to="/login">Sign in</Link> to log, rate, or review...
            </p>
          )}
        </aside>

        {/* Info Section */}
        <section className={styles.infoSection}>
          {/* ... title, meta, tagline, overview, genres ... */}
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.meta}>
            <span className={styles.year}>{releaseYear}</span>
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
          {/* ... Cast, Crew, Videos sections ... */}
        </section>
      </div>
    </div>
  );
};

export default MovieDetailPage;
