// supabase/functions/get-user-watched-list/index.ts
// Expects POST, checks body.method, reads userId from body

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
  createClient,
  SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.js';

console.log(
  `Function "get-user-watched-list" (v5 - POST body check) up and running!`
);

// Interface for the expected request body
interface RequestPayload {
  method?: string; // Expecting 'GET' here
  userId?: string;
}

// Interface matching the structure of your watched_items table
interface WatchedItemRecord {
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

  // --- Check req.method (which user reports is always POST) ---
  console.log(`Received request with req.method: ${req.method}`);
  // Allow POST to proceed, will check body.method later
  if (req.method !== 'POST') {
    console.warn(`Unexpected req.method: ${req.method}. Allowing POST only.`);
    // You might still want to return 405 if req.method isn't POST,
    // but based on user report, it seems it always arrives as POST.
    // Let's proceed assuming it's POST and check the body.
  }

  try {
    // --- Parse Body and Check Intended Method ---
    let payload: RequestPayload;
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId');
    try {
      payload = await req.json();

      console.log('Parsed request body:', payload);

      // --- CHECK METHOD IN BODY ---
      // Check if the method specified in the body is GET
      if (payload.method !== 'GET') {
        throw new Error(
          `Invalid method specified in body: "${payload.method}". Expected "GET".`
        );
      }
      // --- END METHOD CHECK ---

      // Get userId from body
      if (!targetUserId || typeof targetUserId !== 'string') {
        throw new Error('Missing or invalid "userId" in request body.');
      }
    } catch (e) {
      console.error(
        'Error parsing request body or checking method:',
        e.message
      );
      return new Response(
        JSON.stringify({ error: `Bad Request: ${e.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(
      'Fetching watched list for target user ID from body:',
      targetUserId
    );

    // --- Create Supabase Client ---
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      // Pass auth header if RLS requires viewer to be logged in
      // { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // --- Database Query ---
    // RLS POLICIES ON `watched_items` TABLE MUST ALLOW THIS READ OPERATION.
    const { data: watchedList, error: dbError } = await supabaseClient
      .from('watched_items') // Use your actual table name
      .select('*')
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false });

    if (dbError) {
      // ... (Error handling same as before) ...
      console.error('Database query error:', dbError.message);
      if (dbError.code === '22P02') {
        console.error(
          `Potential UUID format error. Value passed to DB was: "${targetUserId}"`
        );
      }
      if (dbError.code === '42501') {
        return new Response(
          JSON.stringify({
            error: `RLS policy denied access to watched list for user ${targetUserId}`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        );
      }
      return new Response(
        JSON.stringify({ error: `Database error: ${dbError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log(
      `Found ${watchedList?.length ?? 0} watched items for user ${targetUserId}.`
    );

    // --- Success Response ---
    return new Response(
      JSON.stringify({
        watchedList: watchedList as WatchedItemRecord[] | null,
      }),
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

/* Deployment Notes:
- Redeploy after changes: `supabase functions deploy get-user-watched-list`
- Ensure RLS policies on `watched_items` allow SELECT.
*/
