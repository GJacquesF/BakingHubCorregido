import { useStore } from "@nanostores/react";
import { precio } from "../lib/format";
import { cambiarCantidad, carrito, quitar, tope, totalPrecio } from "../stores/carrito";
import "../styles/carrito.css";

export default function CartView() {
    const items = useStore(carrito);
    const total = useStore(totalPrecio);
    const locale = document.documentElement.dataset.locale === "en" ? "en" : "es";
    const strings = {
        es: {
            empty: "Aún no has agregado nada delicioso.",
            viewCatalog: "Ver el catálogo",
            removeOne: "Quitar una unidad de",
            addOne: "Agregar una unidad de",
            reachedLimit: "Alcanzaste el máximo disponible",
            remove: "Quitar",
            total: "Total",
            checkout: "Ir al checkout",
        },
        en: {
            empty: "You have not added anything delicious yet.",
            viewCatalog: "View catalog",
            removeOne: "Remove one unit of",
            addOne: "Add one unit of",
            reachedLimit: "You reached the maximum available",
            remove: "Remove",
            total: "Total",
            checkout: "Go to checkout",
        },
    } as const;
    const t = strings[locale];

    if (items.length === 0) {
        return (
            <p className="estado-vacio">
                {t.empty} <a href="/">{t.viewCatalog}</a>
            </p>
        );
    }

    return (
        <>
            <ul className="carrito-lista">
                {items.map(item => (
                    <li className="carrito-item" key={item.id}>
                        <strong>{item.nombre}</strong>
                        <span className="carrito-cantidad">
                            <button
                                aria-label={`${t.removeOne} ${item.nombre}`}
                                onClick={() => cambiarCantidad(item.id, -1)}
                            >
                                −
                            </button>
                            <span aria-label={`${locale === "en" ? "Quantity" : "Cantidad"}: ${item.cantidad}`}>
                                {item.cantidad}
                            </span>
                            <button
                                aria-label={`${t.addOne} ${item.nombre}`}
                                onClick={() => cambiarCantidad(item.id, 1)}
                                disabled={item.cantidad >= tope(item)}
                                title={item.cantidad >= tope(item) ? t.reachedLimit : undefined}
                            >
                                +
                            </button>
                        </span>
                        <span>{precio(item.precio * item.cantidad)}</span>
                        <button className="quitar-btn" onClick={() => quitar(item.id)}>
                            {t.remove}
                        </button>
                    </li>
                ))}
            </ul>
            <p className="carrito-total">
                {t.total}: <strong>{precio(total)}</strong>
            </p>
            <a className="checkout-btn" href="/checkout">
                {t.checkout}
            </a>
        </>
    );
}
