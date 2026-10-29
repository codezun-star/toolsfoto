/**
 * Herramientas recientes y favoritas, solo en el navegador (localStorage).
 * Las muestran el home (`MyTools.tsx`) y el buscador de `AppShell.astro`.
 * Claves: `tf-recent` y `tf-favs` (arrays de slugs). Están descritas en
 * `cookies.astro`: si se añade otra, actualizar esa página.
 */

const RECENT_KEY = 'tf-recent';
const FAVS_KEY = 'tf-favs';
const MAX_RECENT = 8;
const MAX_FAVS = 24;
export const FAVS_EVENT = 'tf:favs';

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function write(key: string, list: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* sin almacenamiento */ }
}

export function getRecent(): string[] {
  return read(RECENT_KEY);
}

export function recordRecent(slug: string): void {
  write(RECENT_KEY, [slug, ...read(RECENT_KEY).filter((s) => s !== slug)].slice(0, MAX_RECENT));
}

export function getFavs(): string[] {
  return read(FAVS_KEY);
}

export function isFav(slug: string): boolean {
  return read(FAVS_KEY).includes(slug);
}

/** Alterna la herramienta en favoritas. Devuelve el estado nuevo. */
export function toggleFav(slug: string): boolean {
  const favs = read(FAVS_KEY);
  const on = !favs.includes(slug);
  write(FAVS_KEY, on ? [slug, ...favs].slice(0, MAX_FAVS) : favs.filter((s) => s !== slug));
  window.dispatchEvent(new CustomEvent(FAVS_EVENT));
  return on;
}
