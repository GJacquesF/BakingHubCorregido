import { agregar } from "../stores/carrito";
import type { Producto } from "../types";

export default function AddToCartButton({ producto }: { producto: Producto }) {
    const locale = document.documentElement.dataset.locale === 'en' ? 'en' : 'es';
    if (producto.stock <= 0) {
        return (
            <button className="btn-primario" disabled data-i18n="product.soldOut">
                {locale === 'en' ? 'Sold out' : 'Agotado'}
            </button>
        );
    }

    const alHacerClic = () => {
        agregar(producto);
        window.location.assign(`${locale === 'en' ? '/en' : ''}/carrito`);
    };

    return (
        <button className="btn-primario" onClick={alHacerClic} data-i18n="product.addToCart">
            {locale === 'en' ? 'Add to cart' : 'Añadir al carrito'}
        </button>
    );
}
