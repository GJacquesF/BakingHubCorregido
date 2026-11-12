import { localizedText } from '../i18n/messages';
import { agregar } from "../stores/carrito";
import type { Producto } from "../types";

export default function AddToCartButton({ producto }: { producto: Producto }) {
    const locale = document.documentElement.dataset.locale === 'en' ? 'en' : 'es';
    if (producto.stock <= 0) {
        return (
            <button className="btn-primario" disabled data-i18n="product.soldOut">
                {localizedText(locale, 'Agotado')}
            </button>
        );
    }

    const alHacerClic = () => {
        agregar(producto);
        window.location.assign(`${locale === 'en' ? '/en' : ''}/carrito`);
    };

    return (
        <button className="btn-primario" onClick={alHacerClic} data-i18n="product.addToCart">
            {localizedText(locale, 'Añadir al carrito')}
        </button>
    );
}
