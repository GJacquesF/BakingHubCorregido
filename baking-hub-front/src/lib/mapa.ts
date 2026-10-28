/**
 * Mapa de entregas: configuración y utilidades. Usa Leaflet + OpenStreetMap (gratis, sin API key).
 * Todo es configurable con variables PUBLIC_MAPA_* (ver .env.example) por si quieres cambiar de
 * proveedor de mosaicos (MapTiler, Mapbox, Stadia…) sin tocar código.
 */

const num = (valor: string | undefined, defecto: number) => {
  const n = Number(valor);
  return valor && Number.isFinite(n) ? n : defecto;
};

const env = import.meta.env;

/** Centro inicial cuando todavía no hay puntos (por defecto, Ciudad de México). */
export const MAPA_CENTRO: [number, number] = [num(env.PUBLIC_MAPA_LAT, 19.4326), num(env.PUBLIC_MAPA_LNG, -99.1332)];
export const MAPA_ZOOM = num(env.PUBLIC_MAPA_ZOOM, 12);

export const TILES_URL = env.PUBLIC_MAPA_TILES_URL?.trim() || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILES_ATTRIBUTION =
  env.PUBLIC_MAPA_ATTRIBUTION?.trim() ||
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

/** Países donde buscar direcciones (códigos ISO separados por coma). Vacío = todo el mundo. */
const PAISES = (env.PUBLIC_MAPA_PAISES ?? 'mx').trim();

export interface ResultadoBusqueda {
  etiqueta: string;
  lat: number;
  lng: number;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/** Busca una dirección con Nominatim (OpenStreetMap). Úsalo solo al pulsar "Buscar", no en cada tecla. */
export async function buscarDireccion(consulta: string): Promise<ResultadoBusqueda[]> {
  const q = consulta.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({ format: 'jsonv2', q, limit: '5', 'accept-language': 'es' });
  if (PAISES) params.set('countrycodes', PAISES);
  const res = await fetch(`${NOMINATIM}/search?${params}`);
  if (!res.ok) throw new Error('No se pudo buscar la dirección. Marca el punto directamente en el mapa.');
  const datos: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return datos
    .map((d) => ({ etiqueta: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }))
    .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng));
}

/** Dirección aproximada de unas coordenadas (o null si no se pudo obtener). */
export async function direccionDesdeCoordenadas(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lng), 'accept-language': 'es' });
    const res = await fetch(`${NOMINATIM}/reverse?${params}`);
    if (!res.ok) return null;
    const datos: { display_name?: string } = await res.json();
    return datos.display_name?.slice(0, 255) ?? null;
  } catch {
    return null;
  }
}

/** Distancia en km entre dos coordenadas (fórmula de Haversine). */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const formatearDistancia = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

/** Enlace para abrir el punto en OpenStreetMap. */
export const urlMapa = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
