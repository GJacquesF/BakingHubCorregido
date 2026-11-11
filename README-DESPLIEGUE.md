# Despliegue: Supabase + Render + Netlify

| Pieza | Servicio | Carpeta |
|---|---|---|
| Base de datos PostgreSQL | **Supabase** | `backend-practica-6-2/db.sql` |
| Backend GraphQL (Express + Apollo + WebSocket `/subscriptions`) | **Render** (Web Service) | `backend-practica-6-2` |
| Frontend (Astro SSR + React) | **Netlify** | `baking-hub-front` |

El navegador solo habla con Netlify. El servidor de Astro (función de Netlify) llama al backend de Render
por HTTP (`GRAPHQL_URL`) y por WebSocket (`GRAPHQL_WS_URL`), y reenvía los eventos al navegador por SSE.
Por eso **no hace falta configurar CORS**.

Haz los pasos **en este orden**, porque cada URL se necesita en el paso siguiente.

## 1. Supabase (base de datos)

1. Crea un proyecto en Supabase y guarda la contraseña de la base de datos.
2. Abre **SQL Editor**, pega todo `backend-practica-6-2/db.sql` y ejecútalo. Crea las tablas, inserta los
   productos de ejemplo y activa RLS (importante: sin RLS la API pública de Supabase podría leer
   `usuarios.password_hash`). Este SQL inicial sigue siendo necesario para crear las tablas de tienda;
   las columnas de autenticación por correo y Google se agregan automáticamente al iniciar el backend.
3. Abre **Connect** y copia la cadena del **Session pooler** (host `...pooler.supabase.com`, puerto `5432`,
   usuario `postgres.<ref>`). Esa es tu `DATABASE_URL`. Usa el pooler, no la "Direct connection":
   la directa solo funciona por IPv6 y Render gratis usa IPv4.

## 2. Render (backend)

1. **New → Blueprint**, elige este repo. Render lee `render.yaml` y crea el servicio `baking-hub-backend`.
2. Captura las variables marcadas `sync: false`:
   - `DATABASE_URL`: la del paso 1.
   - `MP_ACCESS_TOKEN`: Access Token de **prueba** (Mercado Pago → tu aplicación → *Pruebas → Credenciales de prueba*). Hoy suele empezar con `APP_USR-`, igual que el de producción: lo que cuenta es de qué sección lo copiaste.
   - `MP_TEST_PAYER_EMAIL`: **opcional**. Déjalo vacío al principio (se cobra con el correo del cliente). Define una cuenta compradora de *Cuentas de prueba* solo si Mercado Pago rechaza al comprador.
   - `ADMIN_EMAIL`: el correo con el que te registrarás como admin.
   - `GOOGLE_CLIENT_ID`: Client ID de OAuth para una aplicación web de Google Cloud.
   - `SMTP_USER` y `SMTP_PASS`: cuenta Gmail y su contraseña de aplicación para enviar códigos de verificación.
     No uses la contraseña normal de Gmail. Si la contraseña de aplicación aparece separada en grupos,
     puedes pegarla con o sin espacios.
   - `FRONTEND_URL`, `BACKEND_PUBLIC_URL` y `MP_WEBHOOK_SECRET`: déjalas vacías por ahora y vuelve al paso 4
     (`pagos.js` exige `MP_WEBHOOK_SECRET` solo si `BACKEND_PUBLIC_URL` tiene valor).
3. Cuando termine el deploy, abre `https://TU-SERVICIO.onrender.com/health`. Debe responder `{"ok":true}`.

> `NODE_ENV=production` y `MP_MODO=real` son obligatorios en Render: `pagos.js` rechaza el modo simulado en
> producción porque cualquiera podría marcar sus pedidos como pagados. Con credenciales de prueba no se hace
> ningún cobro real.
>
> `MP_CREDENCIALES_PRUEBA=true` (ya viene en `render.yaml`) le indica al backend que las credenciales son de
> prueba aunque empiecen con `APP_USR-`. Al pasar a producción, quita esa variable y usa las credenciales de
> *Producción*.
>
> **Pagos:** tarjeta, OXXO y SPEI usan la **API de Orders** de Mercado Pago (`POST /v1/orders`); la billetera
> sigue con Checkout Pro. Si algo falla, pon `MP_DEBUG=1` en Render para ver la respuesta completa en los Logs.
>
> Mantén **una sola instancia**: la presencia de clientes y las suscripciones viven en la memoria del proceso.
>
> Al arrancar, el backend migra las columnas de autenticación en la base indicada por `DATABASE_URL`. El usuario
> de PostgreSQL debe poder ejecutar `ALTER TABLE` y crear índices. Las cuentas preexistentes quedan verificadas;
> las cuentas nuevas requieren el código enviado por correo.

## 3. Netlify (frontend)

1. **Add new site → Import from Git**, elige este repo. `netlify.toml` ya indica la carpeta y el comando.
2. En **Site configuration → Environment variables** agrega **antes del primer build**:

   | Variable | Valor |
   |---|---|
   | `GRAPHQL_URL` | `https://TU-SERVICIO.onrender.com/` (con la `/` final) |
   | `GRAPHQL_WS_URL` | `wss://TU-SERVICIO.onrender.com/subscriptions` |
   | `SSE_MAX_MS` | `9000` |
   | `PUBLIC_MP_PUBLIC_KEY` | Public Key de **Credenciales de prueba**, de la misma aplicación que el Access Token |
   | `PUBLIC_GOOGLE_CLIENT_ID` | El mismo Client ID configurado en Render |

   Las variables `PUBLIC_` se incrustan al compilar: si las cambias, hay que volver a desplegar. En Google Cloud,
   autoriza `http://localhost:4321` y el origen HTTPS exacto de Netlify como JavaScript origins.
3. Despliega y anota la URL de Netlify.

## 4. Cerrar el círculo

1. En Render pon `FRONTEND_URL` = URL de Netlify (con `https://`, sin `/` final) y
   `BACKEND_PUBLIC_URL` = URL de Render.
2. En Mercado Pago → tu aplicación → **Webhooks**, configura (modo de prueba) la URL
   `https://TU-SERVICIO.onrender.com/webhooks/mercadopago` y suscribe el evento **Order (Mercado Pago)**
   (el de *Pagos* solo sirve para la billetera). Copia la clave secreta en `MP_WEBHOOK_SECRET` (Render) y guarda:
   Render redespliega solo.
3. Regístrate en el sitio con el correo de `ADMIN_EMAIL`: ese usuario obtiene rol `admin` después de verificar
   su correo. El acceso con Google verifica automáticamente el correo confirmado por Google.

## Probar un pago con tarjeta

Usa las tarjetas de la sección **Pruebas → Tarjetas de prueba** del panel de Mercado Pago. Con las credenciales de prueba,
el **nombre del titular** decide el resultado: `APRO` aprueba el pago. Si queda aprobado, el pedido pasa a *pagado* al
instante; con OXXO o SPEI queda *pendiente* y se confirma por el webhook (o por la conciliación cada 5 min).

## Limitaciones a tener en cuenta

- **Tiempo real del panel admin en Netlify.** Las funciones de Netlify con streaming se cortan a los 10 s.
  Por eso `SSE_MAX_MS=9000` cierra cada conexión SSE limpiamente y el navegador reconecta en ~1 s. Funciona,
  pero un evento (pedido pagado, cliente en línea) que ocurra justo durante esa reconexión puede perderse
  hasta que recargues el panel. En local, o si el frontend corre en un servidor propio, deja `SSE_MAX_MS` en 0
  y no hay cortes. Si necesitas tiempo real sin huecos, la salida es desplegar el frontend como segundo
  Web Service en Render con `@astrojs/node` (el repo original ya lo tenía configurado).
- **Render gratis se duerme** tras ~15 min sin tráfico y tarda hasta ~50 s en despertar. El frontend corta
  las llamadas a los 8 s (`src/lib/graphql.ts`), así que la primera visita tras la pausa puede mostrar
  "No pudimos validar tu sesión" o "No se pudo conectar con el servidor". Para una demo, haz un ping a `/health`
  cada 10 min (por ejemplo con UptimeRobot) o usa un plan de pago.
- Si el banco pide autenticación 3D Secure (`action_required` / `pending_challenge`), el pedido queda pendiente: esa verificación no está implementada.
- Dormido, tampoco corre el mantenimiento que concilia pagos pendientes y libera stock cada 5 minutos.
- Supabase gratis pausa proyectos sin actividad durante una semana.
- Si ves `Unauthorized use of live credentials`, estás mezclando credenciales de prueba con las de producción: copia la Public Key y el Access Token de la **misma** sección (*Credenciales de prueba*), sin fijarte en el prefijo.

## Desarrollo local

Sigue igual: copia los `.env.example` a `.env`, deja `DATABASE_URL` vacía y usa las variables `DB_*`.
En el frontend no definas `SSE_MAX_MS`.
