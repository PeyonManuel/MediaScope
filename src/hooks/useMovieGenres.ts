// src/features/movies/hooks/useMovieGenres.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMovieGenres, type Genre } from '../lib/tmdb'; // Adjust path

export const useMovieGenres = () => {
  return useQuery<Genre[], Error>({
    // Explicitly type the data and error
    queryKey: ['genres', 'movie'], // Query key for genres
    queryFn: fetchMovieGenres,
    staleTime: Infinity, // Genres change very rarely, cache indefinitely
    refetchOnWindowFocus: false,
  });
};
