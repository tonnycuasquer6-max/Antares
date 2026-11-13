import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://ifdvcxlbikqhmdnuxmuy.supabase.co';
const fallbackSupabaseAnonKey = 'public-anon-key';

const configuredSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || fallbackSupabaseUrl;
const parsedSupabaseUrl = new URL(configuredSupabaseUrl);
const isLocalSupabase = ['localhost', '127.0.0.1', '[::1]'].includes(parsedSupabaseUrl.hostname);
if (parsedSupabaseUrl.protocol === 'http:' && !isLocalSupabase) {
  parsedSupabaseUrl.protocol = 'https:';
}
const supabaseUrl = parsedSupabaseUrl.toString();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || fallbackSupabaseAnonKey;

export const areSupabaseCredentialsSet = Boolean(supabaseUrl && supabaseAnonKey);

export function getAuthRedirectUrl(): string {
  if (import.meta.env.PROD) {
    return 'https://antares-beige.vercel.app/';
  }

  return new URL('/', window.location.origin).toString();
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);