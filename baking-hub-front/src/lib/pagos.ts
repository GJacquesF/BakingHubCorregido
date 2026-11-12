import type { MetodoPago } from '../types';

/** Textos de cada método de pago. Para agregar o quitar métodos, ver también MP_METODOS en el .env del backend. */
export const METODOS: Record<MetodoPago, { etiqueta: string; descripcion: string; icono: string }> = {
  tarjeta: {
    etiqueta: 'Tarjeta de crédito o débito',
    descripcion: 'Visa, Mastercard y American Express. Se cobra al instante.',
    icono: 'VISA',
  },
  oxxo: {
    etiqueta: 'Efectivo en OXXO',
    descripcion: 'Genera una ficha y paga en caja en cualquier tienda OXXO.',
    icono: 'OXXO',
  },
  spei: {
    etiqueta: 'Transferencia SPEI',
    descripcion: 'Transfiere desde la app o la banca en línea de tu banco.',
    icono: 'SPEI',
  },
  mercadopago: {
    etiqueta: 'Mercado Pago',
    descripcion: 'Paga con tu saldo o con las tarjetas guardadas en tu cuenta.',
    icono: 'MP',
  },
};

const METODOS_EN: Record<MetodoPago, { etiqueta: string; descripcion: string }> = {
  tarjeta: {
    etiqueta: 'Credit or debit card',
    descripcion: 'Visa, Mastercard, and American Express. Charged instantly.',
  },
  oxxo: {
    etiqueta: 'Cash at OXXO',
    descripcion: 'Get a payment slip and pay at any OXXO store.',
  },
  spei: {
    etiqueta: 'SPEI bank transfer',
    descripcion: 'Transfer from your bank app or online banking.',
  },
  mercadopago: {
    etiqueta: 'Mercado Pago',
    descripcion: 'Pay with your balance or cards saved to your account.',
  },
};

export function metodoPago(metodo: MetodoPago, locale: 'es' | 'en' = 'es') {
  return locale === 'en'
    ? { ...METODOS[metodo], ...METODOS_EN[metodo] }
    : METODOS[metodo];
}

/** Estados de un pedido: texto y color de la insignia. */
export const ESTADOS_PEDIDO: Record<string, { etiqueta: string; clase: 'ok' | 'warn' | 'error' | 'muted' }> = {
  pendiente: { etiqueta: 'Pendiente de pago', clase: 'warn' },
  pagado: { etiqueta: 'Pagado', clase: 'ok' },
  cancelado: { etiqueta: 'Cancelado', clase: 'error' },
  expirado: { etiqueta: 'Expirado', clase: 'error' },
  reembolsado: { etiqueta: 'Reembolsado', clase: 'muted' },
};

const ESTADOS_PEDIDO_EN: Record<string, string> = {
  pendiente: 'Awaiting payment',
  pagado: 'Paid',
  cancelado: 'Canceled',
  expirado: 'Expired',
  reembolsado: 'Refunded',
};

export const estadoPedido = (status: string, locale: 'es' | 'en' = 'es') => {
  const estado = ESTADOS_PEDIDO[status.toLowerCase()] ?? { etiqueta: status, clase: 'muted' as const };
  return locale === 'en'
    ? { ...estado, etiqueta: ESTADOS_PEDIDO_EN[status.toLowerCase()] ?? status }
    : estado;
};

/** Agrupa una referencia en bloques de 4 dígitos para leerla mejor: 1234 5678 9012 34 */
export const formatearReferencia = (ref: string) => ref.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();

export const formatearFecha = (iso: string, locale: 'es' | 'en' = 'es') =>
  new Date(iso).toLocaleString(locale === 'en' ? 'en-US' : 'es-MX', { dateStyle: 'medium', timeStyle: 'short' });
