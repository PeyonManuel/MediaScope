// supabase/functions/remove-watched-movie/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
  createClient,
  SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../../_shared/cors.js'; // Assuming shared CORS headers

console.log(`Function "remove-watched-movie" up and running!`);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Expect a POST or DELETE request for this operation
  // Using POST is common for function invokes, DELETE is semantically correct for REST
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed. Use POST or DELETE.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );
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

    if (getUserError || !user) {
      console.error('Auth error:', getUserError?.message);
      return new Response(
        JSON.stringify({
          error: `Authentication failed: ${getUserError?.message ?? 'User not found'}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401, // Unauthorized
        }
      );
    }
    console.log('User ID attempting watched item removal:', user.id);

    // --- Request Body Processing ---
    let movieId: number;
    try {
      // Check if body exists before parsing (DELETE might not have body)
      if (req.body) {
        const body = await req.json();
        if (
          typeof body.movieId !== 'number' ||
          !Number.isInteger(body.movieId) ||
          body.movieId <= 0
        ) {
          throw new Error(
            'Invalid or missing "movieId" in request body. Must be a positive integer.'
          );
        }
        movieId = body.movieId;
      } else if (req.method === 'DELETE') {
        // Optional: Try getting movieId from URL params for DELETE requests
        const url = new URL(req.url);
        const movieIdParam = url.searchParams.get('movieId');
        if (!movieIdParam || isNaN(parseInt(movieIdParam, 10))) {
          throw new Error(
            'Missing or invalid "movieId" in request body or query parameters for DELETE.'
          );
        }
        movieId = parseInt(movieIdParam, 10);
      } else {
        throw new Error('Missing request body for POST method.');
      }

      console.log('Removing watched item for Movie ID:', movieId);
    } catch (e) {
      console.error('Error parsing request input:', e.message);
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
    // RLS policies on watched_items must allow DELETE by the user
    const { error: deleteError } = await supabaseClient
      .from('watched_items') // IMPORTANT: Use your actual table name
      .delete()
      .eq('user_id', user.id) // Match the authenticated user's ID
      .eq('movie_id', movieId); // Match the movie ID

    if (deleteError) {
      console.error('Database delete error:', deleteError.message);
      // Check for RLS errors specifically if needed (code 42501)
      if (deleteError.code === '42501') {
        return new Response(
          JSON.stringify({
            error: `RLS policy denied deletion of watched item for movie ${movieId}`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403, // Forbidden
          }
        );
      }
      return new Response(
        JSON.stringify({ error: `Database error: ${deleteError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500, // Internal Server Error
        }
      );
    }

    console.log(
      `Attempted removal of watched item for user ${user.id}, movie ${movieId}. Success (or item didn't exist).`
    );

    // --- Success Response ---
    // Return a success status, often 200 OK or 204 No Content
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Watched item removed (if it existed).',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // OK
        // Or use 204 No Content:
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
1. Save this as `supabase/functions/remove-watched-movie/index.ts`.
2. Ensure `_shared/cors.ts` exists.
3. Set SUPABASE_URL/SUPABASE_ANON_KEY env vars.
4. Review/Create RLS policies on `watched_items` to allow users to DELETE their own items.
5. Deploy: `supabase functions deploy remove-watched-movie` (Requires auth, do not use --no-verify-jwt)
*/
