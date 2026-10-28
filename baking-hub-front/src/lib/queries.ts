export const OBTENER_MENU = `
  query ObtenerMenu {
    productos { id nombre precio imagen stock }
  }
`;

export const OBTENER_PRODUCTO = `
  query ObtenerProducto($id: ID!) {
    producto(id: $id) { id nombre precio imagen stock }
  }
`;

const CAMPOS_PEDIDO = `
  id total status fecha
  metodoPago pagoReferencia pagoUrl pagoExpira
  entrega { nombre direccion referencia lat lng }
  productos { id nombre precio cantidad }
`;

export const CREAR_PEDIDO = `
  mutation CrearPedido($productos: [ID!]!, $metodoPago: String!, $tarjeta: TarjetaInput, $puntoEntregaId: ID) {
    crearPedido(productos: $productos, metodoPago: $metodoPago, tarjeta: $tarjeta, puntoEntregaId: $puntoEntregaId) {
      id total status metodoPago pagoUrl
    }
  }
`;

export const MIS_PEDIDOS = `
  query MisPedidos {
    misPedidos { ${CAMPOS_PEDIDO} }
  }
`;

export const OBTENER_PEDIDO = `
  query ObtenerPedido($id: ID!) {
    pedido(id: $id) { ${CAMPOS_PEDIDO} }
  }
`;

export const CONFIG_PAGOS = `
  query ConfigPagos {
    configPagos { modo metodos horasParaPagar }
  }
`;

/** Solo funciona con MP_MODO=simulado en el backend. */
export const SIMULAR_PAGO = `
  mutation SimularPago($pedidoId: ID!) {
    simularPago(pedidoId: $pedidoId) { id status }
  }
`;

export const ME = `
  query Me {
    me { id nombre email rol }
  }
`;

export const LOGIN = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) { token }
  }
`;

export const REGISTRAR = `
  mutation Registrar($nombre: String!, $email: String!, $password: String!) {
    registrar(nombre: $nombre, email: $email, password: $password) { token }
  }
`;

/* ---------------------------------- Panel de administración ---------------------------------- */

export const ADMIN_RESUMEN = `
  query AdminResumen {
    adminResumen {
      productos sinStock stockBajo clientes clientesSuspendidos
      pedidosPendientes pedidosPagados ventas
    }
  }
`;

export const ADMIN_PEDIDOS = `
  query AdminPedidos {
    adminPedidos {
      id total status fecha clienteNombre clienteEmail
      entrega { nombre direccion referencia lat lng }
      productos { id nombre precio cantidad }
    }
  }
`;

export const PEDIDO_PAGADO_SUBSCRIPTION = `
  subscription PedidoPagado {
    pedidoPagado { pedidoId total pagadoEn }
  }
`;

export const REGISTRAR_PRESENCIA = `
  mutation RegistrarPresencia {
    registrarPresencia
  }
`;

export const USUARIO_PRESENCIA_SUBSCRIPTION = `
  subscription UsuarioPresenciaActualizada {
    usuarioPresenciaActualizada { usuarioId online }
  }
`;

export const ADMIN_PRODUCTOS = `
  query AdminProductos {
    adminProductos { id nombre precio imagen stock }
  }
`;

export const ADMIN_USUARIOS = `
  query AdminUsuarios($busqueda: String) {
    adminUsuarios(busqueda: $busqueda) {
      id nombre email rol activo creado pedidos totalComprado online
    }
  }
`;

export const CREAR_PRODUCTO = `
  mutation CrearProducto($nombre: String!, $precio: Float!, $imagen: String!, $stock: Int) {
    crearProducto(nombre: $nombre, precio: $precio, imagen: $imagen, stock: $stock) { id }
  }
`;

export const ACTUALIZAR_PRODUCTO = `
  mutation ActualizarProducto($id: ID!, $nombre: String!, $precio: Float!, $imagen: String!, $stock: Int!) {
    actualizarProducto(id: $id, nombre: $nombre, precio: $precio, imagen: $imagen, stock: $stock) { id }
  }
`;

export const AJUSTAR_STOCK = `
  mutation AjustarStock($id: ID!, $cantidad: Int!) {
    ajustarStock(id: $id, cantidad: $cantidad) { id stock }
  }
`;

export const ELIMINAR_PRODUCTO = `
  mutation EliminarProducto($id: ID!) {
    eliminarProducto(id: $id)
  }
`;

export const ACTUALIZAR_USUARIO = `
  mutation ActualizarUsuario($id: ID!, $nombre: String!, $email: String!) {
    actualizarUsuario(id: $id, nombre: $nombre, email: $email) { id }
  }
`;

export const CAMBIAR_ESTADO_USUARIO = `
  mutation CambiarEstadoUsuario($id: ID!, $activo: Boolean!) {
    cambiarEstadoUsuario(id: $id, activo: $activo) { id activo }
  }
`;

export const ELIMINAR_USUARIO = `
  mutation EliminarUsuario($id: ID!) {
    eliminarUsuario(id: $id)
  }
`;

/* ---------------------------------- Mapa de entregas ---------------------------------- */

const CAMPOS_PUNTO = 'id nombre direccion referencia lat lng activo';

/** Puntos activos que el cliente puede elegir en el checkout. */
export const PUNTOS_ENTREGA = `
  query PuntosEntrega {
    puntosEntrega { ${CAMPOS_PUNTO} }
  }
`;

export const ADMIN_PUNTOS_ENTREGA = `
  query AdminPuntosEntrega {
    adminPuntosEntrega { ${CAMPOS_PUNTO} }
  }
`;

export const CREAR_PUNTO_ENTREGA = `
  mutation CrearPuntoEntrega($nombre: String!, $direccion: String!, $referencia: String, $lat: Float!, $lng: Float!) {
    crearPuntoEntrega(nombre: $nombre, direccion: $direccion, referencia: $referencia, lat: $lat, lng: $lng) { id }
  }
`;

export const ACTUALIZAR_PUNTO_ENTREGA = `
  mutation ActualizarPuntoEntrega($id: ID!, $nombre: String!, $direccion: String!, $referencia: String, $lat: Float!, $lng: Float!) {
    actualizarPuntoEntrega(id: $id, nombre: $nombre, direccion: $direccion, referencia: $referencia, lat: $lat, lng: $lng) { id }
  }
`;

export const CAMBIAR_ESTADO_PUNTO_ENTREGA = `
  mutation CambiarEstadoPuntoEntrega($id: ID!, $activo: Boolean!) {
    cambiarEstadoPuntoEntrega(id: $id, activo: $activo) { id activo }
  }
`;

export const ELIMINAR_PUNTO_ENTREGA = `
  mutation EliminarPuntoEntrega($id: ID!) {
    eliminarPuntoEntrega(id: $id)
  }
`;
