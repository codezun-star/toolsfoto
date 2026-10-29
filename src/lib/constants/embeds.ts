/**
 * Herramientas que se pueden incrustar en otras webs con un iframe
 * (`/embed/<slug>`). Generan enlaces entrantes: el código que copia el
 * usuario incluye, debajo del iframe, un enlace de atribución a la
 * herramienta, que es el que cuenta como backlink para su web.
 *
 * Solo herramientas autocontenidas, que no necesitan subir archivos grandes
 * ni librerías pesadas. `height` es la altura inicial del iframe; la página
 * incrustada avisa al padre de su altura real con `postMessage`.
 */
export interface Embed { slug: string; height: number }

export const EMBEDS: Embed[] = [
  { slug: 'generar-qr', height: 1080 },
  { slug: 'contador-palabras', height: 620 },
  { slug: 'contraste-color', height: 500 },
  { slug: 'generador-contrasenas', height: 480 },
  { slug: 'convertir-color', height: 360 },
];

export const EMBED_BY_SLUG: Record<string, Embed> = Object.fromEntries(EMBEDS.map((e) => [e.slug, e]));
