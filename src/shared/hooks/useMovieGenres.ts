// src/features/movies/hooks/useMovieGenres.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMovieGenres } from '../../lib/tmdb';
import { Genre } from '../../lib/types/tmdb';

export const useMovieGenres = () => {
  return useQuery<Genre[], Error>({
    // Explicitly type the data and error
    queryKey: ['genres', 'movie'], // Query key for genres
    queryFn: fetchMovieGenres,
    staleTime: Infinity, // Genres change very rarely, cache indefinitely
    refetchOnWindowFocus: false,
  });
};
