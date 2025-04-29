import { z } from 'zod';
import { createRoute } from '@tanstack/react-router';
import LoginPage from '../features/authentication/infraestructure/pages/login/LoginPage';
import RegisterPage from '../features/authentication/infraestructure/pages/register/RegisterPage';
import MovieDetailsPage from '../features/movie/infraestructure/ui/pages/MovieDetails/MovieDetailsPage';
import SearchMoviesPage from '../features/movie/infraestructure/ui/pages/SearchMovies/SearchMoviesPage';
import { fetchMovieDetails } from '../lib/tmdb';
import { rootRoute } from '../main';
import BrowsePage from '../shared/pages/browse/BrowsePage';
import HomePage from '../shared/pages/home/HomePage';
import EditProfilePage from '../features/user/infraestructure/ui/pages/EditProfilePage/EditProfilePage';
import ViewProfilePage from '../features/user/infraestructure/ui/pages/ViewProfilePage/ViewProfilePage';

export const browseSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  sort_by: z.string().optional().catch('popularity.desc'),
  with_genres: z.string().optional().catch(''),
  min_votes: z.number().int().min(0).optional().catch(0),
});

export const viewProfileSchema = z.object({
  userId: z.string(),
});

export const browseRoute = createRoute({
  getParentRoute: () => rootRoute, // Link to your parent route
  path: '/browse',
  component: BrowsePage,
  validateSearch: (search: Record<string, unknown>) => {
    return browseSearchSchema.parse(search);
  },
});

export const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: SearchMoviesPage,
});

export const viewProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$userId',
  component: ViewProfilePage,
});

export const editProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/edit/profile',
  component: EditProfilePage,
});

export const movieRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/movie/$movieId', // Corrected path syntax
  component: MovieDetailsPage,
  loader: async ({ params }) => {
    const movieId = params.movieId; // Access the param
    const movieData = await fetchMovieDetails(movieId); // Your fetch function
    return movieData;
  },
});

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// TO IMPLEMENT
export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: () => {},
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});
