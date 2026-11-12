import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { carrito, totalArticulos, totalPrecio, vaciar } from '../stores/carrito';
import { precio } from '../lib/format';
import { metodoPago } from '../lib/pagos';
import { tokenizarTarjeta, type DatosTarjeta } from '../lib/mercadopago-cliente';
import type { ErroresTarjeta } from '../lib/tarjeta';
import type { ConfigPagos, MetodoPago, PuntoEntrega, TarjetaTokenizada } from '../types';
import MetodosPago from './MetodosPago';
import FormularioTarjeta from './FormularioTarjeta';
import SelectorEntrega from './SelectorEntrega';
import '../styles/carrito.css';
import '../styles/pago.css';

interface Props {
  config: ConfigPagos;
  /** Puntos de entrega activos (si no hay ninguno, el checkout no pide dirección). */
  puntos: PuntoEntrega[];
  usuario: { nombre: string; email: string };
  locale: 'es' | 'en';
}

const TARJETA_VACIA: DatosTarjeta = { numero: '', titular: '', vencimiento: '', cvv: '' };

export default function CheckoutView({ config, puntos, usuario, locale }: Props) {
  const items = useStore(carrito);
  const articulos = useStore(totalArticulos);
  const total = useStore(totalPrecio);
  const localizedPath = (path: string) => `${locale === 'en' ? '/en' : ''}${path === '/' ? '' : path}`;
  const t = locale === 'en'
    ? {
        empty: 'Your cart is empty.',
        catalog: 'View catalog',
        deliveryRequired: 'Choose a delivery location on the map.',
        cardholderRequired: 'Enter the name as it appears on the card.',
        paymentError: 'There was an error processing the payment. Please try again.',
        processing: 'Processing…',
        oxxo: 'Generate payment slip',
        spei: 'Generate transfer details',
        continueMercadoPago: 'Continue to Mercado Pago',
        pay: 'Pay',
        paymentMethod: 'Payment method',
        testMode: 'Test mode.',
        noRealCharge: 'No real charge will be made.',
        cardInstructions: 'When you continue, we will generate a payment slip with a reference.',
        oxxoStep1: 'Take it to any OXXO store (you can show it on your phone).',
        oxxoStep2: 'Pay the exact amount at the checkout.',
        paymentConfirmed: 'Your order will be confirmed once the payment is credited.',
        expiresOxxo: 'You have',
        expiresOxxoEnd: 'hours to pay. After that, the order is canceled and the items return to inventory.',
        speiInstructions: 'When you continue, we will show you an interbank CLABE and the exact amount.',
        speiStep1: 'Open your bank app or online banking.',
        speiStep2: 'Make a SPEI transfer to that CLABE for the indicated amount.',
        expiresSpei: 'hours to make the transfer.',
        mercadoPago: 'We will take you to Mercado Pago to complete payment securely with your account, then bring you back here.',
        payer: 'Paying as',
        cancel: 'Cancel and go back',
        security: 'Mercado Pago processes your payment. Baking Hub does not store your card details.',
        orderSummary: 'Order summary',
        yourOrder: 'Your order',
        articles: 'Items',
        total: 'Total due',
        delivery: 'Delivery to',
      }
    : {
        empty: 'Tu carrito está vacío.',
        catalog: 'Ver el catálogo',
        deliveryRequired: 'Elige en el mapa dónde quieres recibir tu pedido.',
        cardholderRequired: 'Escribe el nombre como aparece en la tarjeta.',
        paymentError: 'Hubo un error al procesar el pago. Inténtalo de nuevo.',
        processing: 'Procesando…',
        oxxo: 'Generar ficha de pago',
        spei: 'Generar datos de transferencia',
        continueMercadoPago: 'Continuar a Mercado Pago',
        pay: 'Pagar',
        paymentMethod: 'Método de pago',
        testMode: 'Modo de pruebas.',
        noRealCharge: 'No se hará ningún cobro real.',
        cardInstructions: 'Al continuar generaremos una ficha con una referencia de pago.',
        oxxoStep1: 'Llévala a cualquier tienda OXXO (puedes mostrarla desde tu celular).',
        oxxoStep2: 'Paga el monto exacto en caja.',
        paymentConfirmed: 'Tu pedido se confirma en cuanto se acredite el pago.',
        expiresOxxo: 'Tienes',
        expiresOxxoEnd: 'horas para pagar; después el pedido se cancela y las piezas vuelven al inventario.',
        speiInstructions: 'Al continuar te mostraremos una CLABE interbancaria y el monto exacto.',
        speiStep1: 'Abre la app o la banca en línea de tu banco.',
        speiStep2: 'Haz una transferencia SPEI a esa CLABE por el monto indicado.',
        expiresSpei: 'horas para transferir.',
        mercadoPago: 'Te llevaremos a Mercado Pago para que completes el pago de forma segura con tu cuenta, y regresarás aquí al terminar.',
        payer: 'Pagas como',
        cancel: 'Cancelar y regresar',
        security: 'Mercado Pago procesa el pago. Baking Hub no almacena los datos de tu tarjeta.',
        orderSummary: 'Resumen de tu orden',
        yourOrder: 'Tu orden',
        articles: 'Artículos',
        total: 'Total a pagar',
        delivery: 'Entrega en',
      };

  const [metodo, setMetodo] = useState<MetodoPago>(config.metodos[0] ?? 'tarjeta');
  const [tarjeta, setTarjeta] = useState<DatosTarjeta>(TARJETA_VACIA);
  const [erroresTarjeta, setErroresTarjeta] = useState<ErroresTarjeta>({});
  const [puntoId, setPuntoId] = useState<string | null>(puntos.length === 1 ? puntos[0].id : null);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="estado-vacio">
        {t.empty} <a href={localizedPath('/')}>{t.catalog}</a>
      </p>
    );
  }

  const manejarPago = async () => {
    setError(null);
    if (puntos.length > 0 && !puntoId) {
      setError(t.deliveryRequired);
      document.getElementById('seccion-entrega')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    let datosTarjeta: TarjetaTokenizada | undefined;

    if (metodo === 'tarjeta' && config.modo === 'real') {
      const errores: ErroresTarjeta = tarjeta.titular.trim().length < 3
        ? { titular: t.cardholderRequired }
        : {};
      setErroresTarjeta(errores);
      if (Object.keys(errores).length > 0) return;
    }

    setPagando(true);

    try {
      // Los datos de la tarjeta se conservan en pantalla si algo falla, para que el cliente pueda reintentar.
      if (metodo === 'tarjeta') datosTarjeta = await tokenizarTarjeta(tarjeta, config.modo);

      const productos = items.flatMap((i) => Array<string>(i.cantidad).fill(i.id));
      const res = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productos, metodoPago: metodo, tarjeta: datosTarjeta, puntoEntregaId: puntoId }),
      });

      if (res.status === 401) {
        window.location.assign(`${localizedPath('/login')}?next=${encodeURIComponent(localizedPath('/checkout'))}`);
        return;
      }

      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? t.paymentError);

      vaciar();
      const { id, pagoUrl } = datos.pedido as { id: string; pagoUrl: string | null };

      if (metodo === 'mercadopago' && pagoUrl && pagoUrl.startsWith('https://')) {
        window.location.assign(pagoUrl);
        return;
      }

      window.location.assign(`${localizedPath('/pedidos')}/${id}?nuevo=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.paymentError);
      setPagando(false);
    }
  };

  const puntoSeleccionado = puntos.find((p) => p.id === puntoId) ?? null;

  const textoBoton = pagando
    ? t.processing
    : metodo === 'oxxo'
      ? `${t.oxxo} · ${precio(total)}`
      : metodo === 'spei'
        ? `${t.spei} · ${precio(total)}`
        : metodo === 'mercadopago'
          ? `${t.continueMercadoPago} · ${precio(total)}`
          : `${t.pay} ${precio(total)}`;

  return (
    <div className="checkout-grid">
      <section className="checkout-main" aria-label={t.paymentMethod}>
        {config.modo === 'simulado' && (
          <p className="aviso-simulado" role="note">
            <strong>{t.testMode}</strong> {t.noRealCharge}
          </p>
        )}

        {puntos.length > 0 && (
          <div id="seccion-entrega">
            <SelectorEntrega puntos={puntos} seleccionadoId={puntoId} locale={locale} deshabilitado={pagando} onChange={setPuntoId} />
          </div>
        )}

        <MetodosPago metodos={config.metodos} seleccionado={metodo} locale={locale} deshabilitado={pagando} onChange={setMetodo} />

        <div className="metodo-detalle">
          {metodo === 'tarjeta' && (
            <FormularioTarjeta
              modo={config.modo}
              locale={locale}
              valores={tarjeta}
              errores={erroresTarjeta}
              deshabilitado={pagando}
              onChange={setTarjeta}
            />
          )}

          {metodo === 'oxxo' && (
            <div className="instrucciones">
              <p>{t.cardInstructions}</p>
              <ol>
                <li>{t.oxxoStep1}</li>
                <li>{t.oxxoStep2}</li>
                <li>{t.paymentConfirmed}</li>
              </ol>
              <p className="nota">
                {t.expiresOxxo} <strong>{config.horasParaPagar} {locale === 'en' ? 'hours' : 'horas'}</strong> {t.expiresOxxoEnd}
              </p>
            </div>
          )}

          {metodo === 'spei' && (
            <div className="instrucciones">
              <p>{t.speiInstructions}</p>
              <ol>
                <li>{t.speiStep1}</li>
                <li>{t.speiStep2}</li>
                <li>{t.paymentConfirmed}</li>
              </ol>
              <p className="nota">{t.expiresOxxo} <strong>{config.horasParaPagar} {locale === 'en' ? 'hours' : 'horas'}</strong> {t.expiresSpei}</p>
            </div>
          )}

          {metodo === 'mercadopago' && (
            <div className="instrucciones">
              <p>{t.mercadoPago}</p>
            </div>
          )}
        </div>

        <p className="pagador">
          {t.payer} <strong>{usuario.nombre}</strong> ({usuario.email})
        </p>

        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}

        <button className={`pagar-btn ${pagando ? 'procesando' : 'activo'}`} onClick={manejarPago} disabled={pagando}>
          {textoBoton}
        </button>
        <a className="cancelar-btn" href={localizedPath('/carrito')}>{t.cancel}</a>
        <p className="seguridad">{t.security}</p>
      </section>

      <aside className="checkout-resumen" aria-label={t.orderSummary}>
        <h3>{t.yourOrder}</h3>
        <ul>
          {items.map((i) => (
            <li key={i.id}>
              <span>
                {i.cantidad} × {i.nombre}
              </span>
              <span>{precio(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <p className="resumen-linea">
          <span>{t.articles}</span>
          <span>{articulos}</span>
        </p>
        <p className="resumen-total">
          <span>{t.total}</span>
          <strong>{precio(total)}</strong>
        </p>
        {puntoSeleccionado && (
          <p className="checkout-entrega-resumen">
            📍 {t.delivery} <strong>{puntoSeleccionado.nombre}</strong>
            <br />
            {puntoSeleccionado.direccion}
          </p>
        )}
        <p className="resumen-metodo">
          {metodoPago(metodo, locale).icono} {metodoPago(metodo, locale).etiqueta}
        </p>
      </aside>
    </div>
  );
}