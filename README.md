# 🧁 BakingHub

**BakingHub** es una aplicación web de comercio electrónico orientada a la venta de productos de repostería. Incluye un catálogo público, carrito de compras, cuentas de usuario, gestión de pedidos, control de inventario y un panel de administración. El proyecto está dividido en un frontend desarrollado con Astro y React y un backend con una API GraphQL, conectado a PostgreSQL.

> Proyecto de desarrollo académico. Las opciones de pago pueden ejecutarse en modo simulado durante el desarrollo o integrarse con Mercado Pago mediante las credenciales correspondientes.

## ✨ Funcionalidades

- **Catálogo de productos:** consulta de los productos disponibles sin necesidad de iniciar sesión.
- **Carrito de compras:** agrega productos y administra las cantidades antes de realizar un pedido.
- **Cuentas de usuario:** registro, inicio y cierre de sesión.
- **Autenticación y autorización:** contraseñas almacenadas mediante hash, sesión basada en JWT y cookie `HttpOnly`.
- **Checkout:** flujo de compra que requiere autenticación.
- **Métodos de pago:** integración con Mercado Pago para tarjeta, efectivo en OXXO, transferencia SPEI y billetera de Mercado Pago, según la configuración.
- **Pedidos:** consulta del historial y del estado de los pedidos.
- **Inventario:** reserva y devolución de existencias según el estado del pedido.
- **Panel de administración:** administración de productos, inventario y clientes, además de un resumen de actividad.
- **Actualizaciones en tiempo real:** suscripciones GraphQL en el backend y reenvío de eventos al frontend mediante Server-Sent Events (SSE).
- **Despliegue separado:** frontend, backend y base de datos pueden alojarse en servicios independientes.

## 🧰 Tecnologías

| Área | Tecnologías |
|---|---|
| Frontend | Astro, React, JavaScript/TypeScript según el módulo |
| Backend | Node.js, Express, Apollo Server, GraphQL |
| Comunicación en tiempo real | GraphQL Subscriptions, WebSocket y SSE |
| Base de datos | PostgreSQL |
| Seguridad | JWT, bcrypt, cookies `HttpOnly` y control de roles |
| Pagos | Mercado Pago |
| Despliegue | Netlify (frontend), Render (backend) y Supabase (PostgreSQL) |

## 📁 Estructura del repositorio

```text
BakingHubCorregido/
├── backend-practica-6-2/   # API GraphQL, lógica de negocio y conexión a PostgreSQL
├── baking-hub-front/       # Aplicación web con Astro y React
├── mcp-baking-hub/         # Servidor MCP local para GitHub Copilot en VS Code
├── README.md              # Documentación principal
├── README-EJECUTAR.md     # Guía para ejecutar localmente
├── README-EJECUTARPRO.md  # Guía alternativa de ejecución
├── README-DESPLIEGUE.md   # Guía de despliegue
├── render.yaml             # Configuración de despliegue del backend
└── netlify.toml            # Configuración de despliegue del frontend
```

## ⚙️ Requisitos previos

Para ejecutar el proyecto localmente necesitas:

- [Node.js](https://nodejs.org/) y npm.
- [PostgreSQL](https://www.postgresql.org/).
- Git.
- Un terminal y un navegador web.

Mercado Pago solo es necesario si quieres probar la integración de pagos. Para desarrollo puedes utilizar el modo simulado configurado en el backend.

## 🚀 Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/GJacquesF/BakingHubCorregido.git
cd BakingHubCorregido
```

### 2. Preparar PostgreSQL

Crea una base de datos llamada `bakinghub` y carga el esquema y los datos de ejemplo incluidos en `backend-practica-6-2/db.sql`.

Por ejemplo, si PostgreSQL está instalado y configurado localmente:

```bash
createdb bakinghub
psql -d bakinghub -f backend-practica-6-2/db.sql
```

Ajusta estos comandos según la configuración y el usuario de PostgreSQL de tu equipo.

### 3. Configurar y ejecutar el backend

```bash
cd backend-practica-6-2
cp .env.example .env
npm install
```

Edita el archivo `.env` y configura las variables necesarias para tu entorno, como las credenciales de PostgreSQL y `JWT_SECRET`. Usa un secreto aleatorio robusto de al menos 32 caracteres. Si quieres asignar el rol de administrador a una cuenta, configura también `ADMIN_EMAIL` con el correo que utilizarás para registrarte.

Inicia el servidor:

```bash
npm run dev
```

El backend está configurado para ejecutarse en el puerto `4000` de forma predeterminada.

### 4. Configurar y ejecutar el frontend

Abre una segunda terminal desde la carpeta raíz del repositorio y ejecuta:

```bash
cd baking-hub-front
cp .env.example .env
npm install
npm run dev
```

Astro normalmente estará disponible en `http://localhost:4321/`. Comprueba que las variables de conexión GraphQL del frontend apunten al backend local.

> **Importante:** los nombres y valores requeridos de las variables de entorno pueden variar según el modo de ejecución. Consulta los archivos `.env.example` y las guías incluidas en el repositorio. No subas archivos `.env`, contraseñas, tokens ni claves privadas a Git.

## 💳 Configuración de pagos

BakingHub contempla un modo simulado para probar el flujo de compra sin realizar cobros reales y una integración con Mercado Pago.

Para habilitar la integración, configura las variables de entorno correspondientes en el backend y el frontend. Entre ellas se encuentran `MP_ACCESS_TOKEN` y `PUBLIC_MP_PUBLIC_KEY`; los pagos que requieren confirmación asíncrona también necesitan la configuración adecuada de webhooks.

- Usa credenciales de prueba para desarrollar y validar el flujo.
- Mantén las credenciales de prueba separadas de las de producción.
- No compartas tokens ni los incluyas en el código fuente.
- Antes de aceptar pagos reales, verifica la configuración de webhooks, URLs públicas y variables de producción.

Consulta [`README-EJECUTAR.md`](README-EJECUTAR.md) y [`README-DESPLIEGUE.md`](README-DESPLIEGUE.md) para obtener instrucciones específicas.

## ☁️ Despliegue

La arquitectura documentada utiliza los siguientes servicios:

- **Supabase:** base de datos PostgreSQL.
- **Render:** servicio del backend GraphQL.
- **Netlify:** frontend Astro.

La configuración del repositorio incluye `render.yaml` y `netlify.toml`. El despliegue requiere configurar las variables de entorno y las URLs de comunicación entre frontend, backend y Mercado Pago.

Consulta la [guía de despliegue](README-DESPLIEGUE.md) antes de publicar la aplicación.

## 🤖 Servidor MCP para GitHub Copilot

El repositorio incluye un servidor MCP local para consultar el catálogo de Baking Hub desde Copilot Chat y, con una cuenta administradora, agregar productos. Cada integrante debe crear su propio entorno Python y configurar sus credenciales en VS Code; no se deben compartir contraseñas ni subir el entorno virtual.

Consulta [`mcp-baking-hub/README.md`](mcp-baking-hub/README.md) para instalar dependencias, iniciar `tienda` y probar sus herramientas, recursos y prompts.

## 🔐 Consideraciones de seguridad

- Define un `JWT_SECRET` único y seguro para cada entorno.
- Guarda las credenciales en variables de entorno y en los administradores de secretos de la plataforma de despliegue.
- No publiques contraseñas, tokens de Mercado Pago ni cadenas de conexión a la base de datos.
- Mantén habilitadas las políticas de seguridad de la base de datos según la configuración documentada.
- Prueba los pagos en el entorno de pruebas antes de cambiar a producción.
- Asigna el rol de administrador únicamente a cuentas autorizadas.

## 🗺️ Rutas principales

Entre las rutas de la aplicación documentadas se encuentran:

| Ruta | Propósito |
|---|---|
| `/` | Catálogo principal |
| `/producto/:id` | Detalle de un producto |
| `/carrito` | Carrito de compras |
| `/checkout` | Proceso de compra |
| `/pedidos` | Historial de pedidos del usuario |
| `/login` | Inicio de sesión |
| `/registro` | Creación de cuenta |
| `/admin` | Panel de administración para usuarios autorizados |

## 🧪 Desarrollo y solución de problemas

- **El frontend no conecta con el backend:** revisa la URL configurada para GraphQL y confirma que el backend esté ejecutándose.
- **Error de conexión con PostgreSQL:** comprueba que el servicio esté activo y que los datos de conexión coincidan con `.env`.
- **No puedes iniciar sesión:** verifica `JWT_SECRET`, la configuración de cookies y que el navegador esté usando el entorno correcto.
- **Los pagos no se confirman:** revisa que la clave pública y el token pertenezcan al mismo entorno de Mercado Pago y comprueba la configuración de webhooks.
- **El primer acceso tarda:** en el despliegue gratuito de Render el servicio puede entrar en reposo y tardar en volver a estar disponible.

Para pasos detallados, consulta los documentos de ejecución y despliegue que aparecen en la raíz del repositorio.

## 🤝 Contribuciones

Las mejoras, correcciones y sugerencias son bienvenidas. Para proponer cambios, crea una rama, realiza tus modificaciones y abre un *pull request* con una descripción clara de los cambios.

## 📄 Licencia

No se especifica una licencia en este README. Antes de reutilizar o distribuir el código, revisa si el repositorio incluye un archivo `LICENSE` y cuáles son sus condiciones.

## 👥 Autores y colaboradores

Gracias a las personas que participaron en el desarrollo de BakingHub:

- [Diego233-maker](https://github.com/Diego233-maker)
- [GJacquesF](https://github.com/GJacquesF)
- [zilv4008](https://github.com/zilv4008)

---

Si encuentras un problema o tienes una sugerencia, puedes abrir un [issue en GitHub](https://github.com/GJacquesF/BakingHubCorregido/issues).
