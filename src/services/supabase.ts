import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ESTA ES LA LÍNEA QUE BORRÉ POR ERROR Y QUE CAUSABA EL FALLO
export const areSupabaseCredentialsSet = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://ifdvcxlbikqhmdnuxmuy.supabase.co', 
  supabaseAnonKey || 'llave-temporal-para-que-no-explote'
);