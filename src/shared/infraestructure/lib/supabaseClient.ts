// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Optional: Configure storage options for session persistence
  auth: {
    // Use localStorage by default, change if needed (e.g., for SSR)
    persistSession: true,
    // Automatically refresh the token when expiring
    autoRefreshToken: true,
    // Detect session automatically from storage/URL
    detectSessionInUrl: true,
  },
});

// Helper to invoke edge functions
export const invokeEdgeFunction = async (
  functionName: string,
  body: object | undefined
) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: body ? JSON.stringify(body) : undefined,
  });
  if (error) throw error;
  return data;
};
