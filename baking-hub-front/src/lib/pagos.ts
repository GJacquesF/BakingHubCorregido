import type { MetodoPago } from '../types';
import { messages, type AppLocale } from '../i18n/messages';

const METODO_ICONOS: Record<MetodoPago, string> = {
  tarjeta: 'VISA',
  oxxo: 'OXXO',
  spei: 'SPEI',
  mercadopago: 'MP',
};

export function metodoPago(metodo: MetodoPago, locale: AppLocale = 'es') {
  return { ...messages[locale].paymentMethods[metodo], icono: METODO_ICONOS[metodo] };
}

const ESTADO_CLASES: Record<string, 'ok' | 'warn' | 'error' | 'muted'> = {
  pendiente: 'warn',
  pagado: 'ok',
  cancelado: 'error',
  expirado: 'error',
  reembolsado: 'muted',
};

export const estadoPedido = (status: string, locale: 'es' | 'en' = 'es') => {
  const clave = status.toLowerCase();
  return {
    etiqueta: messages[locale].orderStates[clave as keyof typeof messages.es.orderStates] ?? status,
    clase: ESTADO_CLASES[clave] ?? 'muted',
  };
};

/** Agrupa una referencia en bloques de 4 dígitos para leerla mejor: 1234 5678 9012 34 */
export const formatearReferencia = (ref: string) => ref.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();

export const formatearFecha = (iso: string, locale: 'es' | 'en' = 'es') =>
  new Date(iso).toLocaleString(locale === 'en' ? 'en-US' : 'es-MX', { dateStyle: 'medium', timeStyle: 'short' });
