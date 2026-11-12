import { agregar } from '../stores/carrito';
import { messages, type AppLocale } from '../i18n/messages';
import type { Producto } from '../types';

const locale: AppLocale = document.documentElement.dataset.locale === 'en' ? 'en' : 'es';
const productLinks = () => document.querySelectorAll<HTMLAnchorElement>('[data-offline-product]');

function productFromLink(link: HTMLAnchorElement): Producto | null {
  const { productId, productName, productPrice, productImage, productStock } = link.dataset;
  const precio = Number(productPrice);
  const stock = Number(productStock);
  if (!productId || !productName || !Number.isFinite(precio) || !Number.isFinite(stock)) return null;

  return {
    id: productId,
    nombre: productName,
    precio,
    imagen: productImage ?? '',
    stock,
  };
}

function makeElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

function openProduct(product: Producto) {
  const copy = messages[locale].product;
  const dialog = makeElement('dialog', 'offline-product-dialog');
  dialog.setAttribute('aria-label', product.nombre);

  const closeButton = makeElement('button', 'offline-product-dialog-close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', locale === 'en' ? 'Close product details' : 'Cerrar detalles del producto');
  closeButton.addEventListener('click', () => {
    const productPath = /^\/(?:en\/)?producto\//.test(location.pathname);
    if (productPath) {
      location.replace(locale === 'en' ? '/en/' : '/');
      return;
    }
    dialog.close();
  });
  dialog.append(closeButton);

  const title = makeElement('h2', '', product.nombre);
  dialog.append(title);

  if (product.imagen) {
    const image = makeElement('img', '');
    image.src = product.imagen;
    image.alt = product.nombre;
    image.width = 720;
    image.height = 480;
    image.loading = 'eager';
    image.addEventListener('error', () => image.remove(), { once: true });
    dialog.append(image);
  }

  const price = makeElement('p', 'offline-product-price');
  price.textContent = copy.price.replace(
    '{price}',
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(product.precio),
  );
  dialog.append(price);

  if (product.stock <= 0) {
    dialog.append(makeElement('p', 'offline-product-stock agotado', copy.outOfStock));
  } else if (product.stock <= 5) {
    dialog.append(
      makeElement(
        'p',
        'offline-product-stock pocas',
        copy.fewLeft.replace('{count}', String(product.stock)),
      ),
    );
  }

  const addButton = makeElement(
    'button',
    'btn-primario',
    product.stock <= 0 ? copy.soldOut : copy.addToCart,
  );
  addButton.type = 'button';
  addButton.disabled = product.stock <= 0;
  addButton.addEventListener('click', () => {
    agregar(product);
    addButton.textContent = copy.addedToCart;
  });
  dialog.append(addButton);

  const catalogLink = makeElement('a', 'offline-product-catalog', copy.backCatalog);
  catalogLink.href = locale === 'en' ? '/en/' : '/';
  dialog.append(catalogLink);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  document.body.append(dialog);
  dialog.showModal();
  closeButton.focus();
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest<HTMLAnchorElement>('[data-offline-product]');
  if (!link || navigator.onLine) return;

  const product = productFromLink(link);
  if (!product) return;

  event.preventDefault();
  openProduct(product);
});

const productRoute = location.pathname.match(/^\/(?:en\/)?producto\/([^/]+)\/?$/);
if (productRoute) {
  let productId: string;
  try {
    productId = decodeURIComponent(productRoute[1]);
  } catch {
    productId = productRoute[1];
  }
  const link = Array.from(productLinks()).find((candidate) => candidate.dataset.productId === productId);
  const product = link ? productFromLink(link) : null;
  if (product) openProduct(product);
}
