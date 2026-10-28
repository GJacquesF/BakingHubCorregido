# 📍 Mapa de entregas

Funcionalidad nueva: el **administrador** marca puntos de entrega en un mapa y el **cliente** elige uno al hacer el checkout.

## Qué API de mapas se usa y por qué

**Leaflet + OpenStreetMap** (mosaicos) + **Nominatim** (buscar direcciones). Es 100 % gratis y **no necesita API key, tarjeta ni cuenta**, así que funciona al clonar el proyecto (importante para un proyecto académico y para Netlify/Render). Google Maps y Mapbox exigen clave y tarjeta de crédito.

Si algún día esperas mucho tráfico, cambia de proveedor de mosaicos **sin tocar código**: solo variables `PUBLIC_MAPA_TILES_URL` y `PUBLIC_MAPA_ATTRIBUTION` en `baking-hub-front/.env` (MapTiler, Stadia, Mapbox Styles, etc.). Los servidores públicos de OSM/Nominatim son para uso moderado.

## Cómo se usa

- **Admin → pestaña "Entregas"** (`/admin/entregas`): clic en el mapa para colocar un pin (se puede arrastrar), o buscar una dirección. La dirección se autocompleta; pon nombre y, si quieres, una referencia. Puedes editar, desactivar/activar y eliminar puntos.
- **Cliente → `/checkout`**: ve el mapa con los puntos activos, elige uno haciendo clic en el pin o en la lista (botón "Ordenar por cercanía" usa su ubicación). Es obligatorio si hay al menos un punto activo.
- El pedido guarda **una copia** del punto (nombre, dirección, coordenadas): si luego editas o borras el punto, el historial no cambia. Se muestra en el detalle del pedido del cliente y en **Admin → Pedidos**.
- Si no hay ningún punto activo, el checkout funciona como antes (sin pedir entrega).

## Base de datos

No necesitas hacer nada a mano: al arrancar, el backend crea la tabla `puntos_entrega` y las columnas nuevas de `pedidos` (idempotente, como el resto del esquema). `db.sql` ya incluye todo para instalaciones nuevas, con un punto de ejemplo.

## Archivos

**Nuevos**
- `baking-hub-front/src/lib/mapa.ts` — configuración, búsqueda de direcciones, distancias
- `baking-hub-front/src/components/mapaLeaflet.ts` — utilidades de Leaflet (mapa, pines, popups)
- `baking-hub-front/src/components/SelectorEntrega.tsx` — selector del checkout
- `baking-hub-front/src/components/AdminEntregas.tsx` — mapa y CRUD del admin
- `baking-hub-front/src/styles/entregas.css`
- `baking-hub-front/src/pages/admin/entregas.astro`
- `baking-hub-front/src/pages/api/admin/puntos-entrega.ts`

**Modificados**
- `backend-practica-6-2/index.js`, `backend-practica-6-2/db.sql`
- `baking-hub-front/package.json` + `package-lock.json` (dependencias `leaflet`, `@types/leaflet`)
- `baking-hub-front/src/`: `types.ts`, `env.d.ts`, `lib/queries.ts`, `components/CheckoutView.tsx`, `components/AdminNav.astro`, `layouts/AdminLayout.astro`, `pages/checkout.astro`, `pages/api/pedido.ts`, `pages/pedidos/[id].astro`, `pages/admin/pedidos.astro`
- `baking-hub-front/.env.example` (variables opcionales `PUBLIC_MAPA_*`)

Después de actualizar: `cd baking-hub-front && npm install`.
