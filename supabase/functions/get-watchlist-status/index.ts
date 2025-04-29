// supabase/functions/add-to-watchlist/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'; // Or latest stable Deno std lib
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Use esm.sh for Deno import
import { corsHeaders } from '../_shared/cors.js'; // Assume shared CORS headers helper

serve(async (req) => {
  // 1. Handle Preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Get movieId from request body
    const { movieId } = await req.json();
    if (!movieId || typeof movieId !== 'number') {
      throw new Error("Missing or invalid 'movieId' in request body.");
    }

    // 3. Create Supabase client authenticated as the user making the request
    //    This uses the Authorization header automatically passed by the client library
    const supabaseClient = createClient(
      // Pass Supabase URL and anon key from environment variables
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client server-side based on Authorization header
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 4. Get the user object (this also verifies the JWT)
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth Error:', userError);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: ' + (userError?.message ?? 'No user found'),
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log(
      `User Verified: ${user.id}. Attempting to insert movie: ${movieId}.`
    );
    console.log(`Data for insert:`, { user_id: user.id, movie_id: movieId });

    // 5. Attempt to insert into the watchlist_items table
    const { data, error: selectError } = await supabaseClient
      .from('watchlist_items') // Your table name
      .select('*')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (selectError) {
      // Handle other database errors
      console.error('Database Select Error:', selectError);
      throw selectError; // Throw to be caught by the outer catch block
    }

    return new Response(
      JSON.stringify({ success: true, isOnWatchlist: data ? true : false }),
      {
        // Return the inserted data if needed
        status: 201, // Created (or 200 OK)
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Generic error handler
    console.error('Unhandled Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
