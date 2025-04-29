// Import necessary modules from Deno standard library and Supabase client
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
  createClient,
  SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.js'; // Assuming shared CORS headers

console.log(`Function "log-watched-movie" up and running!`);

// Define the structure of data expected in the request body
// All fields except movieId are optional for the upsert logic
interface LogWatchedPayload {
  movieId: number;
  watchedData: {
    rating?: number | null;
    liked?: boolean | null;
    watched_date?: string | null; // Expecting "YYYY-MM-DD" or null
    review?: string | null;
  };
}

// Define the structure of the database record (matching your table)
interface WatchedItemRecord {
  user_id: string;
  movie_id: number;
  rating: number | null;
  liked: boolean | null;
  watched_date: string | null;
  review: string | null;
  // created_at and updated_at are usually handled by the database
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // We expect a POST request for this operation
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // --- Authentication ---
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

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
    console.log('User ID performing log:', user.id);

    // --- Request Body Processing & Validation ---
    let payload: LogWatchedPayload;
    try {
      payload = await req.json();
      // Validate required movieId
      if (
        typeof payload.movieId !== 'number' ||
        !Number.isInteger(payload.movieId) ||
        payload.movieId <= 0
      ) {
        throw new Error(
          'Invalid or missing "movieId". Must be a positive integer.'
        );
      }
      // Optional: Add more specific validation for other fields if needed
      // (e.g., rating range, date format)
      console.log('Payload received:', payload);
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

    // --- Prepare Data for Upsert ---
    // Construct the record to be inserted or updated
    // Include user_id and movie_id for matching/insertion
    // Include other fields ONLY if they are present in the payload
    const recordToUpsert: Partial<WatchedItemRecord> & {
      user_id: string;
      movie_id: number;
    } = {
      user_id: user.id,
      movie_id: payload.movieId,
    };

    // Conditionally add fields from the payload if they exist
    if (payload.watchedData.rating !== undefined)
      recordToUpsert.rating = payload.watchedData.rating;
    if (payload.watchedData.liked !== undefined)
      recordToUpsert.liked = payload.watchedData.liked;
    if (payload.watchedData.watched_date !== undefined)
      recordToUpsert.watched_date = payload.watchedData.watched_date;
    if (payload.watchedData.review !== undefined)
      recordToUpsert.review = payload.watchedData.review;

    // --- Database Upsert Operation ---
    // Upsert performs an INSERT if no matching row exists (based on primary key or constraints),
    // or an UPDATE if a matching row is found.
    // Ensure you have a unique constraint on (user_id, movie_id) in your table for upsert to work correctly.
    const { data: upsertedData, error: upsertError } = await supabaseClient
      .from('watched_items') // IMPORTANT: Replace with your actual table name
      .upsert(recordToUpsert, {
        // onConflict: 'user_id, movie_id' // Explicitly specify conflict target if needed (usually inferred if PK/unique constraint exists)
        // ignoreDuplicates: false // Default is false, meaning it will update on conflict
      })
      .select() // Select the inserted or updated row(s) to return them
      .single(); // Expect exactly one row to be returned after upsert

    if (upsertError) {
      console.error('Database upsert error:', upsertError.message);
      // Check for specific errors, e.g., RLS violation
      if (upsertError.code === '42501') {
        // Example: RLS permission denied
        return new Response(
          JSON.stringify({ error: `Permission denied. Check RLS policies.` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403, // Forbidden
          }
        );
      }
      return new Response(
        JSON.stringify({ error: `Database error: ${upsertError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500, // Internal Server Error
        }
      );
    }

    console.log('Upsert successful:', upsertedData);

    // --- Success Response ---
    // Return the created or updated item
    return new Response(
      JSON.stringify({ watchedItem: upsertedData as WatchedItemRecord }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // OK (could also be 201 Created if you knew it was an insert)
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
1. Save this as `supabase/functions/log-watched-movie/index.ts`.
2. Ensure `supabase/functions/_shared/cors.ts` exists or adjust CORS headers.
3. Make sure SUPABASE_URL and SUPABASE_ANON_KEY environment variables are set.
4. **IMPORTANT:** Ensure your `watched_items` table has a UNIQUE constraint (or Primary Key) on the combination of `user_id` and `movie_id` for `upsert` to work correctly.
5. Run `supabase functions deploy log-watched-movie`.
*/
