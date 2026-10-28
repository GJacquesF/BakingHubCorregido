import type { APIRoute } from 'astro';
import { ApiError, graphql } from '../../../lib/graphql';
import {
  ACTUALIZAR_PUNTO_ENTREGA,
  ADMIN_PUNTOS_ENTREGA,
  CAMBIAR_ESTADO_PUNTO_ENTREGA,
  CREAR_PUNTO_ENTREGA,
  ELIMINAR_PUNTO_ENTREGA,
} from '../../../lib/queries';
import type { PuntoEntrega } from '../../../types';

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

const esId = (v: unknown): v is string => typeof v === 'string' && /^\d{1,9}$/.test(v);
const esTexto = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;

/**
 * Acciones del administrador sobre los puntos de entrega: crear | actualizar | estado | eliminar.
 * Devuelve siempre la lista actualizada. El backend vuelve a comprobar que quien llama sea admin.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.token || !locals.usuario) return json({ error: 'Inicia sesión de nuevo.' }, 401);
  if (locals.usuario.rol !== 'admin') return json({ error: 'No tienes permiso.' }, 403);

  const c = await request.json().catch(() => null);
  if (!c || typeof c !== 'object') return json({ error: 'Solicitud no válida.' }, 400);

  try {
    switch (c.accion) {
      case 'crear':
      case 'actualizar': {
        const datos = {
          nombre: c.nombre,
          direccion: c.direccion,
          referencia: typeof c.referencia === 'string' && c.referencia.trim() ? c.referencia : null,
          lat: c.lat,
          lng: c.lng,
        };
        if (
          !esTexto(datos.nombre, 100) || !esTexto(datos.direccion, 255) ||
          (datos.referencia != null && !esTexto(datos.referencia, 255)) ||
          typeof datos.lat !== 'number' || typeof datos.lng !== 'number'
        ) return json({ error: 'Los datos del punto no son válidos.' }, 400);
        if (c.accion === 'crear') {
          await graphql(CREAR_PUNTO_ENTREGA, datos, locals.token);
        } else {
          if (!esId(c.id)) return json({ error: 'Punto no válido.' }, 400);
          await graphql(ACTUALIZAR_PUNTO_ENTREGA, { id: c.id, ...datos }, locals.token);
        }
        break;
      }
      case 'estado':
        if (!esId(c.id) || typeof c.activo !== 'boolean') return json({ error: 'Solicitud no válida.' }, 400);
        await graphql(CAMBIAR_ESTADO_PUNTO_ENTREGA, { id: c.id, activo: c.activo }, locals.token);
        break;
      case 'eliminar':
        if (!esId(c.id)) return json({ error: 'Punto no válido.' }, 400);
        await graphql(ELIMINAR_PUNTO_ENTREGA, { id: c.id }, locals.token);
        break;
      default:
        return json({ error: 'Acción no reconocida.' }, 400);
    }
    const { adminPuntosEntrega } = await graphql<{ adminPuntosEntrega: PuntoEntrega[] }>(ADMIN_PUNTOS_ENTREGA, {}, locals.token);
    return json({ puntos: adminPuntosEntrega });
  } catch (e) {
    if (e instanceof ApiError) {
      const status = e.codigo === 'UNAUTHENTICATED' ? 401 : e.codigo === 'FORBIDDEN' ? 403 : e.codigo === 'BAD_USER_INPUT' ? 400 : 502;
      return json({ error: e.message }, status);
    }
    return json({ error: 'Error inesperado.' }, 500);
  }
};
