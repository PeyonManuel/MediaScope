// Import necessary modules from Deno standard library and Supabase client
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
  createClient,
  SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../../_shared/cors.js'; // Assuming shared CORS headers

console.log(`Function "get-watched-item" up and running!`);

// Define the expected structure of a watched item (matching user's table)
// This should ideally match or be compatible with your `WatchedItem` type in the frontend
interface WatchedItemRecord {
  // id: number; // REMOVED based on user's table structure
  user_id: string;
  movie_id: number;
  rating: number | null;
  liked: boolean | null;
  watched_date: string | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    // Create a Supabase client scoped to the user making the request
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user object from the JWT
    const {
      data: { user },
      error: getUserError,
    } = await supabaseClient.auth.getUser();

    if (getUserError) {
      console.error('Authentication error:', getUserError.message);
      return new Response(
        JSON.stringify({
          error: `Authentication failed: ${getUserError.message}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401, // Unauthorized
        }
      );
    }
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401, // Unauthorized
      });
    }
    console.log('User ID:', user.id);

    // --- Request Body Processing ---
    let movieId: number;
    try {
      const body = await req.json();
      if (
        typeof body.movieId !== 'number' ||
        !Number.isInteger(body.movieId) ||
        body.movieId <= 0
      ) {
        throw new Error(
          'Invalid "movieId" provided in request body. Must be a positive integer.'
        );
      }
      movieId = body.movieId;
      console.log('Movie ID from request:', movieId);
    } catch (e) {
      console.error('Error parsing request body:', e.message);
      return new Response(
        JSON.stringify({ error: `Bad Request: ${e.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400, // Bad Request
        }
      );
    }

    // --- Database Query ---
    // Fetch the specific watched item for the authenticated user and movie
    const { data: watchedItem, error: dbError } = await supabaseClient
      .from('watched_items') // IMPORTANT: Replace with your actual table name if different
      .select('*') // Select all columns
      .eq('user_id', user.id) // Filter by the authenticated user's ID
      .eq('movie_id', movieId) // Filter by the movie ID from the request
      .maybeSingle(); // Expect 0 or 1 row

    if (dbError) {
      console.error('Database query error:', dbError.message);
      return new Response(
        JSON.stringify({ error: `Database error: ${dbError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500, // Internal Server Error
        }
      );
    }

    console.log('Watched item found:', watchedItem);

    // --- Success Response ---
    // Return the found item (which will be null if no match was found)
    // The type assertion now matches the updated interface
    return new Response(
      JSON.stringify({ watchedItem: watchedItem as WatchedItemRecord | null }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error.message);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/*
Deployment Steps:
1. Save this as `supabase/functions/get-watched-item/index.ts`.
2. Ensure `supabase/functions/_shared/cors.ts` exists or adjust CORS headers.
3. Make sure SUPABASE_URL and SUPABASE_ANON_KEY environment variables are set in your Supabase project settings.
4. Run `supabase functions deploy get-watched-item`.
*/
