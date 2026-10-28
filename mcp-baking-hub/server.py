import math
import os
from typing import Any

import httpx
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ResourceError, ToolError

mcp = MCPServer("baking-hub")

GRAPHQL_URL = os.getenv("GRAPHQL_URL", "http://localhost:4000/").strip()
ADMIN_EMAIL = os.getenv("MCP_ADMIN_EMAIL", "").strip()
ADMIN_PASSWORD = os.getenv("MCP_ADMIN_PASSWORD", "")
HTTP_TIMEOUT = 60.0

POLITICAS = """POLÍTICAS DE LA TIENDA (Baking Hub)
- Devoluciones y Garantía: Garantía de frescura del 100%. Reposición inmediata si el postre llega en mal estado.
- Envíos: Gratis en compras mayores a $300 MXN; recolección sin costo en punto de entrega escolar.
- Pre-órdenes: Pasteles completos requieren 24 horas de anticipación.
- Pagos: Mercado Pago y sus demás métodos de pago."""

LOGIN_QUERY = """
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      usuario { rol }
    }
  }
"""


class GraphQLRequestError(RuntimeError):
    """Error de transporte o formato recibido desde el backend GraphQL."""


def consultar_graphql(
    query: str,
    variables: dict[str, object] | None = None,
    token: str | None = None,
) -> dict[str, Any]:
    """Envía una query o mutation al backend GraphQL."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        response = httpx.post(
            GRAPHQL_URL,
            json={"query": query, "variables": variables or {}},
            headers=headers,
            timeout=HTTP_TIMEOUT,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise GraphQLRequestError(f"No se pudo conectar con GraphQL ({GRAPHQL_URL}): {error}") from error

    try:
        result = response.json()
    except ValueError as error:
        raise GraphQLRequestError("El backend GraphQL devolvió una respuesta que no es JSON válido.") from error

    if not isinstance(result, dict):
        raise GraphQLRequestError("El backend GraphQL devolvió una respuesta con formato inválido.")

    errors = result.get("errors")
    if errors:
        messages = [
            item.get("message", "Error GraphQL")
            for item in errors
            if isinstance(item, dict)
        ]
        raise GraphQLRequestError("; ".join(messages) or "El backend devolvió un error GraphQL.")
    return result


def obtener_catalogo_render() -> list[dict[str, Any]]:
    """Obtiene el catálogo publicado en el backend GraphQL."""
    query = """
      query ObtenerCatalogo {
        productos {
          id
          nombre
          precio
          imagen
        }
      }
    """
    result = consultar_graphql(query)
    data = result.get("data")
    productos = data.get("productos") if isinstance(data, dict) else None
    if not isinstance(productos, list):
        raise GraphQLRequestError("El backend GraphQL no devolvió una lista de productos.")
    return productos


def obtener_token_admin() -> str:
    """Inicia sesión con las credenciales de administrador configuradas para el MCP."""
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        raise ToolError(
            "Para crear productos configura MCP_ADMIN_EMAIL y MCP_ADMIN_PASSWORD "
            "con las credenciales de una cuenta administradora."
        )

    try:
        result = consultar_graphql(
            LOGIN_QUERY,
            {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
    except GraphQLRequestError as error:
        raise ToolError(str(error)) from error
    data = result.get("data")
    login = data.get("login") if isinstance(data, dict) else None
    if not isinstance(login, dict) or not login.get("token"):
        raise ToolError("El backend no devolvió un token válido al iniciar sesión.")
    usuario = login.get("usuario")
    if not isinstance(usuario, dict) or usuario.get("rol") != "admin":
        raise ToolError("La cuenta configurada en MCP no tiene permisos de administrador.")
    return login["token"]


@mcp.tool()
def buscar_producto(texto: str) -> list[dict[str, object]]:
    """Busca productos por nombre y devuelve su ID, nombre y precio en MXN.

    Args:
        texto: Parte del nombre, por ejemplo "brownie", "galleta" o "pastel".
    """
    termino = texto.strip().casefold()
    if not termino:
        raise ToolError("Escribe el nombre o una parte del nombre del producto que buscas.")

    try:
        catalogo = obtener_catalogo_render()
    except GraphQLRequestError as error:
        raise ToolError(str(error)) from error
    return [
        {
            "id": producto["id"],
            "producto": producto["nombre"],
            "precio_mxn": float(producto["precio"]),
        }
        for producto in catalogo
        if termino in producto["nombre"].casefold()
    ]


@mcp.tool()
def crear_nuevo_producto(
    nombre: str,
    precio: float,
    imagen_url: str,
    stock: int = 0,
) -> dict[str, object]:
    """Crea un producto en la tienda; requiere una cuenta administradora configurada.

    Args:
        nombre: Nombre del producto (máximo 100 caracteres).
        precio: Precio de venta en MXN, mayor que cero.
        imagen_url: URL HTTP(S) o ruta local de la imagen.
        stock: Existencias iniciales (de 0 a 100000).
    """
    nombre = nombre.strip()
    imagen_url = imagen_url.strip()
    if not nombre or len(nombre) > 100:
        raise ToolError("El nombre debe tener entre 1 y 100 caracteres.")
    if not math.isfinite(precio) or precio <= 0 or precio > 1_000_000:
        raise ToolError("El precio debe ser mayor que 0 y no exceder 1000000 MXN.")
    if (
        not imagen_url
        or len(imagen_url) > 255
        or not (imagen_url.lower().startswith(("http://", "https://")) or imagen_url.startswith("/"))
        or imagen_url.startswith("//")
    ):
        raise ToolError("La imagen debe ser una URL HTTP(S) o una ruta local de máximo 255 caracteres.")
    if not isinstance(stock, int) or isinstance(stock, bool) or not 0 <= stock <= 100_000:
        raise ToolError("El stock debe ser un entero entre 0 y 100000.")

    mutation = """
      mutation CrearProducto(
        $nombre: String!
        $precio: Float!
        $imagen: String!
        $stock: Int!
      ) {
        crearProducto(
          nombre: $nombre
          precio: $precio
          imagen: $imagen
          stock: $stock
        ) {
          id
          nombre
          precio
          imagen
          stock
        }
      }
    """
    try:
        result = consultar_graphql(
            mutation,
            {
                "nombre": nombre,
                "precio": float(precio),
                "imagen": imagen_url,
                "stock": stock,
            },
            token=obtener_token_admin(),
        )
    except GraphQLRequestError as error:
        raise ToolError(str(error)) from error
    data = result.get("data")
    producto = data.get("crearProducto") if isinstance(data, dict) else None
    if not isinstance(producto, dict):
        raise ToolError("El backend no devolvió el producto creado.")
    return {"mensaje": "Producto creado correctamente.", "producto": producto}


@mcp.resource("tienda://catalogo")
def catalogo() -> str:
    """Catálogo de productos en vivo desde el backend."""
    try:
        productos = obtener_catalogo_render()
    except GraphQLRequestError as error:
        raise ResourceError(str(error)) from error
    if not productos:
        return "El catálogo no tiene productos."
    lineas = [
        f"- [ID {producto['id']}] {producto['nombre']}: "
        f"${float(producto['precio']):.2f} MXN"
        for producto in productos
    ]
    return "CATÁLOGO EN VIVO\n" + "\n".join(lineas)


@mcp.resource("tienda://politicas")
def politicas() -> str:
    """Políticas de la tienda Baking Hub."""
    return POLITICAS


@mcp.prompt()
def recomendar_combo(presupuesto: str = "350") -> str:
    """Solicita una combinación de productos dentro del presupuesto indicado."""
    return (
        "Revisa los recursos tienda://catalogo y tienda://politicas. Ármame la mejor "
        f"combinación de productos posible con un presupuesto aproximado de ${presupuesto} MXN, "
        "procurando alcanzar el monto necesario para tener envío gratis."
    )


@mcp.prompt()
def auditoria_catalogo() -> str:
    """Solicita un análisis de los precios actuales del catálogo."""
    return (
        "Revisa el recurso tienda://catalogo, dime cuántos productos hay actualmente "
        "registrados, cuál es el más caro, cuál es el más barato y sugiéreme un nuevo "
        "producto que podríamos agregar usando la herramienta crear_nuevo_producto."
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")
