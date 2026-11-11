import { agregar } from "../stores/carrito";
import type { Producto } from "../types";

export default function AddToCartButton({ producto }: { producto: Producto }) {
    if (producto.stock <= 0) {
        return (
            <button className="btn-primario" disabled data-i18n="product.soldOut">
                Agotado
            </button>
        );
    }

    const alHacerClic = () => {
        agregar(producto);
        window.location.assign("/carrito");
    };

    return (
        <button className="btn-primario" onClick={alHacerClic} data-i18n="product.addToCart">
            Añadir al carrito
        </button>
    );
}
