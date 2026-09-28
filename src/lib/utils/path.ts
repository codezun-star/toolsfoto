/**
 * Ruta canónica de la página actual a partir de `Astro.url.pathname`.
 *
 * Con `build.format: 'file'` Astro entrega en el build rutas como
 * `/imagen.html` o `/index.html`, mientras que en el sitio servido son
 * `/imagen` y `/`. Comparar el pathname en crudo contra `/imagen` falla en
 * silencio (el nav nunca marcaba la sección activa), así que toda comparación
 * de rutas debe pasar por aquí.
 */
export function currentPath(pathname: string): string {
  const path = pathname
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
    .replace(/(.)\/+$/, '$1');
  return path || '/';
}
