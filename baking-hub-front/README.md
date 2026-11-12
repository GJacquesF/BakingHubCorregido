# Baking Hub — frontend (Astro)

Tienda de postres. Astro 7 con renderizado en servidor (`@astrojs/node`), islas de React solo para lo interactivo (carrito y checkout) y autenticación con cookie `HttpOnly`.

```bash
cp .env.example .env   # GRAPHQL_URL apunta al backend (por defecto http://localhost:4000/)
npm install
npm run dev            # http://localhost:4321
```

El adaptador de Netlify mantiene habilitado el despliegue SSR, pero desactiva la emulación local
de Edge Functions porque este proyecto no define ninguna. Así, `astro dev` no depende de Deno.

Otros comandos: `npm run check` (tipos), `npm run build`, `npm start` (sirve el build).

## Estructura

```
src/
├── layouts/Layout.astro        Página base: <head>, Header, Sidebar opcional, Footer
├── components/
│   ├── Header.astro            Marca, enlaces de cuenta, instalación PWA y carrito
│   ├── Sidebar.astro           Categorías (enlaces reales: /?categoria=…)
│   ├── Hero.astro  WhyUs.astro  Footer.astro  Alert.astro
│   ├── ProductCard.astro       Tarjeta del catálogo
│   ├── ProductDetail.astro     Detalle de un producto
│   ├── PedidoCard.astro        Un pedido del historial
│   ├── AuthCard.astro  FormField.astro   Tarjeta y campo de los formularios de login/registro
│   └── (islas React)  CartButton.tsx  AddToCartButton.tsx  CartView.tsx  CheckoutView.tsx
├── pages/                      Una ruta por archivo (reemplaza el estado `pantallaActual`)
│   ├── index.astro             /                  catálogo (?categoria=Chocolates)
│   ├── producto/[id].astro     /producto/2        detalle
│   ├── carrito.astro           /carrito
│   ├── checkout.astro          /checkout          🔒 requiere sesión
│   ├── pedidos.astro           /pedidos           🔒 requiere sesión
│   ├── login.astro  registro.astro
│   └── api/
│       ├── auth/logout.ts      POST /api/auth/logout
│       └── pedido.ts           POST /api/pedido   crea el pedido con el token de la cookie
├── middleware.ts               Lee la cookie, consulta `me` al backend y protege rutas
├── stores/carrito.ts           Carrito compartido entre islas (nanostores + localStorage)
├── lib/                        graphql.ts (cliente fetch), queries.ts, auth.ts, categorias.ts, format.ts
├── styles/                     global.css (tokens y piezas compartidas), carrito.css (islas React)
└── types.ts
```

## PWA y prueba sin conexión

`npm run build` crea el service worker y precarga los bundles de CSS/JS, el manifiesto, los
iconos y la página `offline.html`. Si un bundle individual no está disponible, se registra el
aviso y la instalación del worker continúa; los recursos estáticos también se guardan al usarse.
Durante el uso guarda imágenes y las páginas públicas del
catálogo y de productos visitadas. Las rutas `/api/`, administración, pagos, pedidos y sesión
no se guardan en caché.

Para probar localmente, inicia Astro desde `baking-hub-front` (no requiere créditos ni despliegue en Netlify):

```bash
cd baking-hub-front
npm run dev -- --host 127.0.0.1
```

Abre `http://localhost:4321`, visita el catálogo y al menos un producto, y luego usa Chrome
DevTools → **Application** para confirmar el manifiesto y el service worker. En **Network**,
activa **Offline** y recarga esas páginas; las visitadas deben cargar desde caché y las no
guardadas deben mostrar `offline.html`. Toma las capturas con la aplicación en esa ventana.
El catálogo y las fichas pueden estar desactualizados; pagos, autenticación y datos nuevos
requieren conexión.

Para comprobar la lista de recursos precargados del build de producción, ejecuta `npm run build`
y verifica `dist/sw.js`; el servidor de desarrollo también guarda los recursos a medida que se
visitan.

Astro i18n usa español por defecto en `/` e inglés en `/en/`. Cambia el idioma desde el selector
del encabezado; el sitio conserva la ruta de la página cuando existe en ambos idiomas.

Para el almacenamiento de imágenes en Netlify, configura `PUBLIC_SUPABASE_URL`,
`PUBLIC_SUPABASE_ANON_KEY` y `PUBLIC_SUPABASE_BUCKET` para los contextos de build. La URL y la
anon key llevan prefijo `PUBLIC_` porque el navegador las necesita; el bucket debe permitir
lecturas públicas para que funcionen las URL de imágenes. No uses una service-role key en el
frontend. Si ya existe `SUPABASE_URL` sin `PUBLIC_`, agrega también `PUBLIC_SUPABASE_URL`: la
variable privada del backend no se incorpora al bundle del navegador.

Cloudflare Turnstile requiere `PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` en el frontend y
`CLOUDFLARE_TURNSTILE_SECRET_KEY` en el backend. La clave secreta es obligatoria en producción.

Usa Node.js 22.23.4 o superior para ejecutar Astro (`npm run check` y `npm run build`).

## Cómo funciona la autenticación

1. `login.astro` / `registro.astro` reciben el formulario (POST), llaman al backend y guardan el JWT en la cookie `bh_token` (`HttpOnly`, `SameSite=Lax`, `Secure` en producción). El JavaScript del navegador nunca ve el token.
2. `middleware.ts` corre en cada petición: si hay cookie, pregunta `me` al backend. Si el token venció o es falso, borra la cookie.
3. Las rutas de `RUTAS_PROTEGIDAS` (en `middleware.ts`) redirigen a `/login?next=…` si no hay sesión. Para proteger otra ruta, agrégala a esa lista.
4. Los permisos reales viven en el **backend** (crear pedidos requiere sesión; crear/eliminar productos requiere rol `admin`), no solo en la interfaz.

## Pagos y panel admin

El proyecto inicia en `MP_MODO=simulado`, así puedes presentar y probar tarjeta, OXXO y SPEI sin
credenciales ni cargos reales. Para procesar cobros reales, configura `MP_ACCESS_TOKEN`,
`MP_WEBHOOK_SECRET` y `BACKEND_PUBLIC_URL` en el `.env` del backend; configura además
`PUBLIC_MP_PUBLIC_KEY` en el `.env` del frontend para los Secure Fields de tarjeta. Usa credenciales
de prueba `TEST-` para validar primero. OXXO y SPEI requieren que el webhook del backend tenga una
URL HTTPS pública y la URL/clave secreta configuradas en Mercado Pago para confirmación inmediata; si no configuras
webhook, el backend concilia los pagos pendientes consultando Mercado Pago cada cinco minutos.

| Ruta / archivo | Qué hace |
|---|---|
| `/checkout` + `components/CheckoutView.tsx` | Elegir método de pago (tarjeta, OXXO, SPEI, Mercado Pago) |
| `lib/mercadopago-cliente.ts` | Tokeniza en el navegador mediante los Secure Fields de Mercado Pago |
| `/pedidos/[id]` + `components/InstruccionesPago.astro` | Ficha de pago OXXO / SPEI y estado del pedido |
| `/admin`, `/admin/inventario`, `/admin/usuarios` | Panel de administración (solo rol `admin`, ver `middleware.ts`) |
