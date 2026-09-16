import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://ifdvcxlbikqhmdnuxmuy.supabase.co';
const fallbackSupabaseAnonKey = 'public-anon-key';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || fallbackSupabaseUrl;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || fallbackSupabaseAnonKey;

export const areSupabaseCredentialsSet = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);