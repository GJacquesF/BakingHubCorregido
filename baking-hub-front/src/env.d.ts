/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
    /** Clave pública de Mercado Pago (se expone al navegador a propósito; nunca pongas aquí el Access Token). */
    readonly PUBLIC_MP_PUBLIC_KEY?: string;
    /** Client ID público de Google Identity Services; no es un secreto. */
    readonly PUBLIC_GOOGLE_CLIENT_ID?: string;
    /** Clave pública del widget de Cloudflare Turnstile. */
    readonly PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?: string;
    /** URL pública del proyecto Supabase. */
    readonly PUBLIC_SUPABASE_URL?: string;
    /** Anon key pública de Supabase para Storage. */
    readonly PUBLIC_SUPABASE_ANON_KEY?: string;
    /** Bucket público de Supabase para imágenes. */
    readonly PUBLIC_SUPABASE_BUCKET?: string;
    /** Mapa de entregas (todas opcionales; ver .env.example). */
    readonly PUBLIC_MAPA_LAT?: string;
    readonly PUBLIC_MAPA_LNG?: string;
    readonly PUBLIC_MAPA_ZOOM?: string;
    readonly PUBLIC_MAPA_TILES_URL?: string;
    readonly PUBLIC_MAPA_ATTRIBUTION?: string;
    readonly PUBLIC_MAPA_PAISES?: string;
}

declare namespace App {
    interface Locals {
        /** Usuario autenticado de esta petición (null si es visitante). */
        usuario: import("./types").Usuario | null;
        /** JWT de la cookie de sesión (null si no hay). */
        token: string | null;
        /** Idioma asociado a la ruta solicitada, incluidos los rewrites de /en. */
        locale: import("./i18n/messages").AppLocale;
    }
}
