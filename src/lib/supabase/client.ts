import { createClient } from '@supabase/supabase-js';

// Dedicated Supabase credentials for Candut & Saridut — Our Little Ocean
const SUPABASE_PROJECT_URL = 'https://guidjuaezxxfbvgxgwqf.supabase.co';
const SUPABASE_ANON_PUBLIC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aWRqdWFlenh4ZmJ2Z3hnd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDIwNzgsImV4cCI6MjEwODMxODA3OH0.wb65OUqoXQ-fd9BzNqZGUAkAA7Les560S2_c7Q3CLGg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_PUBLIC_KEY;

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
