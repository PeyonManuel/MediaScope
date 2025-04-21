import { z } from 'zod';
import { createRoute } from '@tanstack/react-router';
import BrowsePage from '../pages/browse/BrowsePage';
import LoginPage from '../pages/login/LoginPage';
import HomePage from '../pages/home/HomePage';
import RegisterPage from '../pages/register/RegisterPage';
import MovieDetailsPage from '../pages/movie/MovieDetailsPage';
import { fetchMovieDetails } from '../lib/tmdb';
import { rootRoute } from '../main';

export const browseSearchSchema = z.object({
  page: z.number().int().min(1).optional().catch(1),
  sort_by: z.string().optional().catch('popularity.desc'),
  with_genres: z.string().optional().catch(''),
  min_votes: z.number().int().min(0).optional().catch(0),
});

export const browseRoute = createRoute({
  getParentRoute: () => rootRoute, // Link to your parent route
  path: '/browse',
  component: BrowsePage, // Use the BrowsePage component
  validateSearch: (search: Record<string, unknown>) => {
    return browseSearchSchema.parse(search);
  },
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

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});
