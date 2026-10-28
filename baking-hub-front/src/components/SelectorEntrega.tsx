import { useEffect, useMemo, useRef, useState } from 'react';
import { L, crearMapa, pin, popup } from './mapaLeaflet';
import { distanciaKm, formatearDistancia, urlMapa } from '../lib/mapa';
import type { PuntoEntrega } from '../types';
import '../styles/entregas.css';

interface Props {
  puntos: PuntoEntrega[];
  seleccionadoId: string | null;
  deshabilitado?: boolean;
  onChange: (id: string) => void;
}

/** Mapa + lista para que el cliente elija dónde quiere recibir su pedido. */
export default function SelectorEntrega({ puntos, seleccionadoId, deshabilitado = false, onChange }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capaRef = useRef<L.LayerGroup | null>(null);
  const marcadoresRef = useRef(new Map<string, L.Marker>());
  const yoRef = useRef<L.Marker | null>(null);
  const encuadradoRef = useRef(false);
  // El mapa se crea una sola vez; los manejadores de clic leen siempre los valores más recientes desde aquí.
  const actual = useRef({ onChange, deshabilitado });
  actual.current = { onChange, deshabilitado };

  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  const ordenados = useMemo(() => {
    if (!ubicacion) return puntos.map((p) => ({ punto: p, km: null as number | null }));
    return puntos
      .map((p) => ({ punto: p, km: distanciaKm(ubicacion, p) }))
      .sort((a, b) => (a.km as number) - (b.km as number));
  }, [puntos, ubicacion]);

  // Crear / destruir el mapa
  useEffect(() => {
    if (!contenedor.current) return;
    const mapa = crearMapa(contenedor.current);
    mapaRef.current = mapa;
    capaRef.current = L.layerGroup().addTo(mapa);
    return () => {
      mapa.remove();
      mapaRef.current = null;
      capaRef.current = null;
      marcadoresRef.current.clear();
      yoRef.current = null;
      encuadradoRef.current = false;
    };
  }, []);

  // Dibujar los puntos
  useEffect(() => {
    const mapa = mapaRef.current;
    const capa = capaRef.current;
    if (!mapa || !capa) return;
    capa.clearLayers();
    marcadoresRef.current.clear();
    for (const p of puntos) {
      const marcador = L.marker([p.lat, p.lng], { icon: pin({ activo: p.id === seleccionadoId }), title: p.nombre, keyboard: true })
        .bindPopup(popup(p.nombre, p.direccion))
        .on('click', () => {
          if (!actual.current.deshabilitado) actual.current.onChange(p.id);
        });
      marcador.addTo(capa);
      marcadoresRef.current.set(p.id, marcador);
    }
    if (!encuadradoRef.current && puntos.length > 0) {
      encuadradoRef.current = true;
      if (puntos.length === 1) mapa.setView([puntos[0].lat, puntos[0].lng], 15);
      else mapa.fitBounds(L.latLngBounds(puntos.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2));
    }
  }, [puntos, seleccionadoId]);

  // Al elegir un punto (en la lista o en el mapa) se centra y se abre su globo
  useEffect(() => {
    const mapa = mapaRef.current;
    const p = puntos.find((x) => x.id === seleccionadoId);
    if (!mapa || !p) return;
    mapa.flyTo([p.lat, p.lng], Math.max(mapa.getZoom(), 15), { duration: 0.6 });
    marcadoresRef.current.get(p.id)?.openPopup();
  }, [seleccionadoId, puntos]);

  const usarMiUbicacion = () => {
    setErrorUbicacion(null);
    if (!('geolocation' in navigator)) {
      setErrorUbicacion('Tu navegador no permite obtener la ubicación.');
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const yo = { lat: coords.latitude, lng: coords.longitude };
        setUbicacion(yo);
        setBuscando(false);
        const mapa = mapaRef.current;
        if (!mapa) return;
        yoRef.current?.remove();
        yoRef.current = L.marker([yo.lat, yo.lng], { icon: L.divIcon({ className: 'pin-mapa-wrap', html: '<span class="pin-yo"></span>', iconSize: [18, 18], iconAnchor: [9, 9] }), title: 'Tu ubicación', interactive: false }).addTo(mapa);
        if (puntos.length > 0) {
          const cercano = puntos.reduce((a, b) => (distanciaKm(yo, a) <= distanciaKm(yo, b) ? a : b));
          mapa.fitBounds(L.latLngBounds([[yo.lat, yo.lng], [cercano.lat, cercano.lng]]).pad(0.3));
        } else mapa.setView([yo.lat, yo.lng], 14);
      },
      () => {
        setBuscando(false);
        setErrorUbicacion('No pudimos obtener tu ubicación. Revisa el permiso del navegador o elige un punto en el mapa.');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <fieldset className="entrega" disabled={deshabilitado}>
      <legend className="entrega-titulo">¿Dónde quieres recibir tu pedido?</legend>

      <div className="entrega-mapa" ref={contenedor} role="application" aria-label="Mapa de puntos de entrega" />

      <div className="entrega-barra">
        <button type="button" className="entrega-ubicacion" onClick={usarMiUbicacion} disabled={buscando}>
          {buscando ? 'Buscando…' : '📍 Ordenar por cercanía'}
        </button>
        {errorUbicacion && <span className="entrega-error" role="alert">{errorUbicacion}</span>}
      </div>

      <ul className="entrega-lista" role="radiogroup" aria-label="Puntos de entrega">
        {ordenados.map(({ punto, km }) => {
          const marcado = punto.id === seleccionadoId;
          return (
            <li key={punto.id}>
              <label className={`entrega-opcion ${marcado ? 'seleccionado' : ''}`}>
                <input
                  type="radio"
                  name="puntoEntrega"
                  value={punto.id}
                  checked={marcado}
                  onChange={() => onChange(punto.id)}
                />
                <span className="entrega-opcion-texto">
                  <strong>{punto.nombre}</strong>
                  <small>{punto.direccion}</small>
                  {punto.referencia && <small className="entrega-ref">{punto.referencia}</small>}
                </span>
                {km != null && <span className="entrega-km">{formatearDistancia(km)}</span>}
                <a
                  className="entrega-osm"
                  href={urlMapa(punto.lat, punto.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver
                </a>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
