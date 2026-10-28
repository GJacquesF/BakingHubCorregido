/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** Clave pública de Mercado Pago (se expone al navegador a propósito; nunca pongas aquí el Access Token). */
  readonly PUBLIC_MP_PUBLIC_KEY?: string;
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
    usuario: import('./types').Usuario | null;
    /** JWT de la cookie de sesión (null si no hay). */
    token: string | null;
  }
}
