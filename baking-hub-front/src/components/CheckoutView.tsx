import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { carrito, totalArticulos, totalPrecio, vaciar } from '../stores/carrito';
import { precio } from '../lib/format';
import { messages } from '../i18n/messages';
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
  const t = messages[locale].checkout;

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
                {t.expiresOxxo} <strong>{config.horasParaPagar} {t.hours}</strong> {t.expiresOxxoEnd}
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
              <p className="nota">{t.expiresOxxo} <strong>{config.horasParaPagar} {t.hours}</strong> {t.expiresSpei}</p>
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
          <span>{t.totalDue}</span>
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