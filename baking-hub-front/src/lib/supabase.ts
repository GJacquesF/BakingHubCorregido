import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "";
const bucketName = import.meta.env.PUBLIC_SUPABASE_BUCKET ?? "productos";

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

export function getSupabaseClient() {
    if (!supabase) {
        const missing = [
            !supabaseUrl && "PUBLIC_SUPABASE_URL",
            !supabaseAnonKey && "PUBLIC_SUPABASE_ANON_KEY",
        ].filter(Boolean);
        throw new Error(`Configura ${missing.join(" y ")} en el entorno público del frontend.`);
    }

    return supabase;
}

export function getSupabasePublicUrl(path: string) {
    if (!path) return null;
    if (/^(?:https?:)?\/\//i.test(path) || path.startsWith('/')) return path;
    if (!supabaseUrl) return null;
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucketName}/${path.replace(/^\//, "")}`;
}
