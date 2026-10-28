import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAPA_CENTRO, MAPA_ZOOM, TILES_ATTRIBUTION, TILES_URL } from '../lib/mapa';

/** Crea un mapa Leaflet dentro de `contenedor` con los mosaicos configurados. */
export function crearMapa(contenedor: HTMLElement): L.Map {
  const mapa = L.map(contenedor, { scrollWheelZoom: false }).setView(MAPA_CENTRO, MAPA_ZOOM);
  L.tileLayer(TILES_URL, { attribution: TILES_ATTRIBUTION, maxZoom: 19 }).addTo(mapa);
  // Si el contenedor cambia de tamaño (carga tardía, responsive), Leaflet debe recalcular.
  const observador = new ResizeObserver(() => mapa.invalidateSize());
  observador.observe(contenedor);
  mapa.on('unload', () => observador.disconnect());
  // La rueda solo hace zoom tras hacer clic en el mapa, para no atrapar el scroll de la página.
  const activarRueda = () => mapa.scrollWheelZoom.enable();
  mapa.once('focus', activarRueda);
  mapa.once('click', activarRueda);
  return mapa;
}

/** Pin sin imágenes externas (así no hay problemas con los íconos por defecto de Leaflet al empaquetar). */
export function pin(opciones: { activo?: boolean; borrador?: boolean; inactivo?: boolean } = {}): L.DivIcon {
  const clases = ['pin-mapa', opciones.activo && 'pin-activo', opciones.borrador && 'pin-borrador', opciones.inactivo && 'pin-inactivo']
    .filter(Boolean)
    .join(' ');
  return L.divIcon({ className: 'pin-mapa-wrap', html: `<span class="${clases}"></span>`, iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -32] });
}

/** Popup construido con nodos DOM (nunca con innerHTML) para que el texto de los puntos no pueda inyectar HTML. */
export function popup(titulo: string, detalle?: string | null): HTMLElement {
  const div = document.createElement('div');
  const t = document.createElement('strong');
  t.textContent = titulo;
  div.appendChild(t);
  if (detalle) {
    div.appendChild(document.createElement('br'));
    const d = document.createElement('span');
    d.textContent = detalle;
    div.appendChild(d);
  }
  return div;
}

export { L };
