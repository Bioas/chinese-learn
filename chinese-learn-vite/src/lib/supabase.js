import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn('Failed to init Supabase client:', e.message);
  }
} else {
  console.warn(
    'Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env\n' +
    'Create a free project at https://supabase.com and copy the project URL + anon key.\n' +
    'The app will work in offline mode until credentials are provided.'
  );
}

export { supabase };
export function isSupabaseReady() { return supabase !== null; }
