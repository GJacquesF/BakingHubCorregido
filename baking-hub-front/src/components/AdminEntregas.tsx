import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { L, crearMapa, pin, popup } from './mapaLeaflet';
import { buscarDireccion, direccionDesdeCoordenadas, type ResultadoBusqueda } from '../lib/mapa';
import type { PuntoEntrega } from '../types';
import '../styles/entregas.css';

interface Props {
  puntosIniciales: PuntoEntrega[];
}

interface Borrador {
  id: string | null;
  nombre: string;
  direccion: string;
  referencia: string;
  lat: number | null;
  lng: number | null;
}

const VACIO: Borrador = { id: null, nombre: '', direccion: '', referencia: '', lat: null, lng: null };

/** Panel del administrador: marca puntos de entrega en el mapa, edítalos, desactívalos o elimínalos. */
export default function AdminEntregas({ puntosIniciales }: Props) {
  const [puntos, setPuntos] = useState(puntosIniciales);
  const [borrador, setBorrador] = useState<Borrador>(VACIO);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capaRef = useRef<L.LayerGroup | null>(null);
  const borradorMarcador = useRef<L.Marker | null>(null);
  const encuadradoRef = useRef(false);
  // true mientras la dirección del formulario la rellenó el mapa (así no se pisa lo que el admin escribió a mano)
  const direccionAuto = useRef(true);
  const borradorRef = useRef(borrador);
  borradorRef.current = borrador;

  /** Coloca (o mueve) el pin del borrador. Si `rellenar`, intenta completar la dirección con las coordenadas. */
  const colocarPunto = (lat: number, lng: number, rellenar = true) => {
    const redondo = (n: number) => Math.round(n * 1e6) / 1e6;
    lat = redondo(lat);
    lng = redondo(lng);
    setBorrador((b) => ({ ...b, lat, lng }));
    if (rellenar && (direccionAuto.current || borradorRef.current.direccion.trim() === '')) {
      void direccionDesdeCoordenadas(lat, lng).then((dir) => {
        if (dir && (direccionAuto.current || borradorRef.current.direccion.trim() === '')) {
          direccionAuto.current = true;
          setBorrador((b) => ({ ...b, direccion: dir }));
        }
      });
    }
  };
  const colocarRef = useRef(colocarPunto);
  colocarRef.current = colocarPunto;

  // Crear / destruir el mapa
  useEffect(() => {
    if (!contenedor.current) return;
    const mapa = crearMapa(contenedor.current);
    mapaRef.current = mapa;
    capaRef.current = L.layerGroup().addTo(mapa);
    mapa.on('click', (e: L.LeafletMouseEvent) => colocarRef.current(e.latlng.lat, e.latlng.lng));
    return () => {
      mapa.remove();
      mapaRef.current = null;
      capaRef.current = null;
      borradorMarcador.current = null;
      encuadradoRef.current = false;
    };
  }, []);

  // Puntos guardados
  useEffect(() => {
    const mapa = mapaRef.current;
    const capa = capaRef.current;
    if (!mapa || !capa) return;
    capa.clearLayers();
    for (const p of puntos) {
      L.marker([p.lat, p.lng], { icon: pin({ inactivo: !p.activo }), title: p.nombre })
        .bindPopup(popup(p.nombre + (p.activo ? '' : ' (inactivo)'), p.direccion))
        .on('click', () => editar(p))
        .addTo(capa);
    }
    if (!encuadradoRef.current && puntos.length > 0) {
      encuadradoRef.current = true;
      if (puntos.length === 1) mapa.setView([puntos[0].lat, puntos[0].lng], 15);
      else mapa.fitBounds(L.latLngBounds(puntos.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntos]);

  // Pin del borrador (arrastrable)
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    if (borrador.lat == null || borrador.lng == null) {
      borradorMarcador.current?.remove();
      borradorMarcador.current = null;
      return;
    }
    const posicion: [number, number] = [borrador.lat, borrador.lng];
    if (!borradorMarcador.current) {
      borradorMarcador.current = L.marker(posicion, { icon: pin({ borrador: true }), draggable: true, title: 'Punto nuevo (arrástralo)', zIndexOffset: 1000 })
        .on('dragend', (e) => {
          const { lat, lng } = (e.target as L.Marker).getLatLng();
          colocarRef.current(lat, lng);
        })
        .addTo(mapa);
    } else borradorMarcador.current.setLatLng(posicion);
  }, [borrador.lat, borrador.lng]);

  const editar = (p: PuntoEntrega) => {
    direccionAuto.current = false;
    setMensaje(null);
    setBorrador({ id: p.id, nombre: p.nombre, direccion: p.direccion, referencia: p.referencia ?? '', lat: p.lat, lng: p.lng });
    mapaRef.current?.flyTo([p.lat, p.lng], Math.max(mapaRef.current.getZoom(), 15), { duration: 0.5 });
    contenedor.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const limpiar = () => {
    direccionAuto.current = true;
    setBorrador(VACIO);
    setResultados(null);
    setConsulta('');
  };

  const llamar = async (cuerpo: Record<string, unknown>): Promise<boolean> => {
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/admin/puntos-entrega', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? 'No se pudo completar la acción.');
      setPuntos(datos.puntos as PuntoEntrega[]);
      return true;
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error inesperado.' });
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const guardar = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (borrador.lat == null || borrador.lng == null) {
      setMensaje({ tipo: 'error', texto: 'Haz clic en el mapa (o busca una dirección) para marcar el punto.' });
      return;
    }
    const edicion = borrador.id != null;
    const ok = await llamar({
      accion: edicion ? 'actualizar' : 'crear',
      id: borrador.id,
      nombre: borrador.nombre,
      direccion: borrador.direccion,
      referencia: borrador.referencia,
      lat: borrador.lat,
      lng: borrador.lng,
    });
    if (ok) {
      limpiar();
      setMensaje({ tipo: 'ok', texto: edicion ? 'Punto actualizado.' : 'Punto de entrega creado. Ya aparece en el checkout.' });
    }
  };

  const cambiarEstado = async (p: PuntoEntrega) => {
    const ok = await llamar({ accion: 'estado', id: p.id, activo: !p.activo });
    if (ok) setMensaje({ tipo: 'ok', texto: p.activo ? 'Punto desactivado: los clientes ya no lo ven.' : 'Punto activado.' });
  };

  const eliminar = async (p: PuntoEntrega) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Los pedidos anteriores conservan su dirección.`)) return;
    const ok = await llamar({ accion: 'eliminar', id: p.id });
    if (ok) {
      if (borrador.id === p.id) limpiar();
      setMensaje({ tipo: 'ok', texto: 'Punto eliminado.' });
    }
  };

  const buscar = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBuscando(true);
    setMensaje(null);
    try {
      const r = await buscarDireccion(consulta);
      setResultados(r);
      if (r.length === 0) setMensaje({ tipo: 'error', texto: 'No encontramos esa dirección. Prueba con otra o marca el punto en el mapa.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'Error al buscar.' });
    } finally {
      setBuscando(false);
    }
  };

  const elegirResultado = (r: ResultadoBusqueda) => {
    direccionAuto.current = true;
    setBorrador((b) => ({ ...b, lat: r.lat, lng: r.lng, direccion: r.etiqueta.slice(0, 255) }));
    mapaRef.current?.flyTo([r.lat, r.lng], 16, { duration: 0.6 });
    setResultados(null);
  };

  return (
    <div className="admin-entregas">
      <form className="entregas-busqueda" onSubmit={buscar} role="search">
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar una dirección para ubicarla en el mapa…"
          aria-label="Buscar dirección"
          maxLength={200}
        />
        <button className="btn-admin" type="submit" disabled={buscando || consulta.trim().length < 3}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      {resultados && resultados.length > 0 && (
        <ul className="entregas-resultados">
          {resultados.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => elegirResultado(r)}>{r.etiqueta}</button>
            </li>
          ))}
        </ul>
      )}

      <div className="entrega-mapa entrega-mapa-admin" ref={contenedor} role="application" aria-label="Mapa para marcar puntos de entrega" />
      <p className="entregas-ayuda">
        Haz clic en el mapa para colocar un punto nuevo; puedes arrastrar el pin para ajustarlo. Haz clic en un pin existente para editarlo.
      </p>

      {mensaje && (
        <p className={mensaje.tipo === 'ok' ? 'mensaje-exito' : 'mensaje-error'} role={mensaje.tipo === 'ok' ? 'status' : 'alert'}>
          {mensaje.texto}
        </p>
      )}

      <form className="admin-bloque" onSubmit={guardar}>
        <h3>{borrador.id ? 'Editar punto de entrega' : 'Nuevo punto de entrega'}</h3>
        <div className="form-grid">
          <div className="campo-admin">
            <label htmlFor="pe-nombre">Nombre</label>
            <input id="pe-nombre" required minLength={2} maxLength={100} value={borrador.nombre} placeholder="Ej. Sucursal Centro"
              onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })} />
          </div>
          <div className="campo-admin ancho">
            <label htmlFor="pe-direccion">Dirección</label>
            <input id="pe-direccion" required minLength={3} maxLength={255} value={borrador.direccion} placeholder="Se completa sola al marcar el mapa; puedes corregirla"
              onChange={(e) => { direccionAuto.current = false; setBorrador({ ...borrador, direccion: e.target.value }); }} />
          </div>
          <div className="campo-admin ancho">
            <label htmlFor="pe-ref">Referencia (opcional)</label>
            <input id="pe-ref" maxLength={255} value={borrador.referencia} placeholder="Ej. Local 4, junto a la farmacia"
              onChange={(e) => setBorrador({ ...borrador, referencia: e.target.value })} />
          </div>
          <div className="campo-admin">
            <label>Coordenadas</label>
            <input readOnly value={borrador.lat != null && borrador.lng != null ? `${borrador.lat}, ${borrador.lng}` : 'Sin marcar'} aria-label="Coordenadas del punto" />
          </div>
        </div>
        <div className="entregas-acciones">
          <button className="btn-admin" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : borrador.id ? 'Guardar cambios' : 'Crear punto'}
          </button>
          {(borrador.id || borrador.lat != null) && (
            <button className="btn-admin sec" type="button" onClick={limpiar}>Cancelar</button>
          )}
        </div>
      </form>

      <h3 className="entregas-subtitulo">Puntos registrados ({puntos.length})</h3>
      {puntos.length === 0 ? (
        <p className="estado-vacio">Todavía no hay puntos. Mientras no haya ninguno activo, el cliente no tendrá que elegir una entrega al pagar.</p>
      ) : (
        <div className="tabla-wrap">
          <table className="tabla-admin">
            <thead>
              <tr><th>Punto</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {puntos.map((p) => (
                <tr key={p.id} className={p.activo ? '' : 'suspendido'}>
                  <td>
                    <strong>{p.nombre}</strong><br />
                    <small>{p.direccion}</small>
                    {p.referencia && (<><br /><small>{p.referencia}</small></>)}
                  </td>
                  <td>
                    <span className={`badge badge-${p.activo ? 'ok' : 'warn'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td>
                    <div className="entregas-acciones">
                      <button className="btn-admin sec" type="button" onClick={() => editar(p)}>Editar</button>
                      <button className="btn-admin sec" type="button" disabled={guardando} onClick={() => cambiarEstado(p)}>
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button className="btn-admin peligro" type="button" disabled={guardando} onClick={() => eliminar(p)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
