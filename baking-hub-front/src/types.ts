export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  /** Piezas disponibles en inventario. */
  stock: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'cliente' | 'admin';
}

/** Lo que se guarda en el carrito (localStorage). `stock` puede faltar en carritos guardados antes de existir el inventario. */
export interface ItemCarrito extends Omit<Producto, 'stock'> {
  stock?: number;
  cantidad: number;
}

export interface ItemPedido {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export type MetodoPago = 'tarjeta' | 'oxxo' | 'spei' | 'mercadopago';

export interface PuntoEntrega {
  id: string;
  nombre: string;
  direccion: string;
  referencia: string | null;
  lat: number;
  lng: number;
  activo: boolean;
}

/** Copia del punto de entrega guardada en el pedido. */
export interface EntregaPedido {
  nombre: string;
  direccion: string;
  referencia: string | null;
  lat: number;
  lng: number;
}

export interface Pedido {
  id: string;
  total: number;
  /** pendiente | pagado | cancelado | expirado | reembolsado */
  status: string;
  fecha: string;
  productos: ItemPedido[];
  metodoPago: MetodoPago | null;
  /** Referencia para pagar en OXXO o CLABE de SPEI. */
  pagoReferencia: string | null;
  /** Ficha de pago de Mercado Pago, o URL a la que redirigir al cliente (billetera). */
  pagoUrl: string | null;
  /** Fecha límite para pagar (ISO). */
  pagoExpira: string | null;
  entrega: EntregaPedido | null;
}

export interface PedidoAdmin {
  id: string;
  total: number;
  status: string;
  fecha: string;
  clienteNombre: string;
  clienteEmail: string;
  entrega: EntregaPedido | null;
  productos: ItemPedido[];
}

export interface ConfigPagos {
  /** simulado = no se llama a Mercado Pago · real = pagos reales */
  modo: 'simulado' | 'real';
  metodos: MetodoPago[];
  horasParaPagar: number;
}

/** Datos de tarjeta ya tokenizados. Los números reales de la tarjeta NUNCA salen del navegador. */
export interface TarjetaTokenizada {
  token: string;
  paymentMethodId?: string;
  /** credit_card | debit_card | prepaid_card: la API de Orders de Mercado Pago lo exige. */
  paymentTypeId?: string;
  issuerId?: string;
  cuotas: number;
}

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  creado: string;
  pedidos: number;
  totalComprado: number;
  online: boolean;
}

export interface ResumenAdmin {
  productos: number;
  sinStock: number;
  stockBajo: number;
  clientes: number;
  clientesSuspendidos: number;
  pedidosPendientes: number;
  pedidosPagados: number;
  ventas: number;
}
