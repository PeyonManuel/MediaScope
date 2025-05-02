// Import necessary modules from Deno standard library and Supabase client
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
  createClient,
  SupabaseClient,
  PostgrestError,
  AuthError,
} from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../../_shared/cors.js'; // Assuming shared CORS headers

console.log(`Function "remove-from-watchlist" up and running!`);

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
    console.log('User ID attempting removal:', user.id);

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
      console.log('Removing Movie ID from request:', movieId);
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

    // --- Database Deletion ---
    // Attempt to delete the item matching the user and movie ID
    const { error: deleteError } = await supabaseClient
      .from('watchlist_items') // IMPORTANT: Replace with your actual watchlist table name
      .delete()
      .eq('user_id', user.id) // Match the authenticated user's ID
      .eq('movie_id', movieId); // Match the movie ID from the request

    // Note: .delete() doesn't typically error if the row doesn't exist,
    // it just won't delete anything. We only check for actual DB errors.
    if (deleteError) {
      console.error('Database delete error:', deleteError.message);
      return new Response(
        JSON.stringify({ error: `Database error: ${deleteError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500, // Internal Server Error
        }
      );
    }

    console.log(
      `Attempted removal for user ${user.id}, movie ${movieId}. Success (or item didn't exist).`
    );

    // --- Success Response ---
    // Return a success status, often 200 OK with a simple message or 204 No Content
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Item removed from watchlist (if it existed).',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // OK
        // Alternatively, use 204 No Content if you don't need to send a body:
        // status: 204, headers: corsHeaders
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
1. Save this as `supabase/functions/remove-from-watchlist/index.ts`.
2. Ensure `supabase/functions/_shared/cors.ts` exists or adjust CORS headers.
3. Make sure SUPABASE_URL and SUPABASE_ANON_KEY environment variables are set.
4. Run `supabase functions deploy remove-from-watchlist`.
*/
