import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';
const bucketName = import.meta.env.PUBLIC_SUPABASE_BUCKET ?? 'productos';

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export const SUPABASE_BUCKET = bucketName;

export function getSupabasePublicUrl(path: string) {
  if (!supabaseUrl || !path) return null;
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucketName}/${path.replace(/^\//, '')}`;
}
