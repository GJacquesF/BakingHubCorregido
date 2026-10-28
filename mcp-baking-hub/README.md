# MCP de Baking Hub

Este servidor local conecta GitHub Copilot en VS Code con el backend GraphQL de Baking Hub. Expone dos herramientas (`buscar_producto` y `crear_nuevo_producto`), dos recursos (`tienda://catalogo` y `tienda://politicas`) y dos prompts (`recomendar_combo` y `auditoria_catalogo`).

## Requisitos

- Python 3.10 o posterior.
- Visual Studio Code con GitHub Copilot Chat y soporte MCP.
- Acceso de red al backend de Render.

## Instalación

Desde la raíz del repositorio, crea un entorno virtual e instala las dependencias:

```powershell
py -m venv mcp-baking-hub\venv
mcp-baking-hub\venv\Scripts\python.exe -m pip install -r mcp-baking-hub\requirements.txt
```

No subas ni compartas `venv`: cada integrante crea su propio entorno local.

## Iniciar en VS Code

Abre la raíz de este repositorio en VS Code. El archivo `.vscode/mcp.json` registra el servidor `tienda`. Ejecuta **MCP: List Servers**, selecciona `tienda` y elige **Start Server**. VS Code solicitará el correo y la contraseña de una cuenta administradora; la contraseña se introduce en un campo oculto y no se guarda en Git.

Para usar solo las búsquedas y recursos, se puede dejar vacía la entrada de credenciales. Para crear productos se necesitan credenciales válidas de una cuenta con rol `admin`. Cada miembro debe usar su propia cuenta; no se compartan contraseñas entre el equipo. Si el servidor ya está en ejecución después de editar la configuración, reinícialo.

La URL de GraphQL del servicio de Render está definida en `.vscode/mcp.json`. El backend expone GraphQL en la ruta raíz, por lo que la URL termina en `/` y no en `/graphql`.

## Probar

En Copilot Chat, cambia a **Agent** y pide:

> Usa la herramienta buscar_producto para encontrar productos que contengan “brownie” o “galleta” y dime sus precios.

Desde **Add Context → MCP Resources** o **MCP: Browse Resources**, se pueden agregar `tienda://catalogo` y `tienda://politicas`. Para ejecutar una plantilla de prompt, escribe `/` en el chat y selecciona `recomendar_combo` o `auditoria_catalogo`.

Para probar la creación de un producto, pide al agente usar `crear_nuevo_producto` e incluye nombre, precio y URL de imagen HTTP(S). La operación modifica el catálogo compartido en la base de datos de la tienda; confirma el cambio antes de aprobar la llamada.

## Configuración alternativa

Si abres directamente la carpeta `mcp-baking-hub` en VS Code, usa `mcp-baking-hub/.vscode/mcp.json`. También se requiere crear `venv` e instalar `requirements.txt` desde esa carpeta:

```powershell
py -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt
```
