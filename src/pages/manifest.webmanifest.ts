import type { APIRoute } from 'astro';
import { TOOLS, TOOL_BY_SLUG } from '@/lib/constants/tools';
import { SITE } from '@/lib/constants/seo';

/**
 * /manifest.webmanifest — manifiesto de la app instalable (PWA).
 * Se genera en cada build para que el recuento de herramientas y los nombres
 * de los accesos directos salgan siempre de TOOLS.
 */

// Accesos directos al mantener pulsado el icono de la app (Android / escritorio).
const SHORTCUTS = ['comprimir', 'eliminar-fondo', 'unir-pdfs', 'comprimir-video'];

const ICON = { src: '/icon-192.png', sizes: '192x192', type: 'image/png' };

export const GET: APIRoute = () => {
  const manifest = {
    id: '/',
    name: `${SITE.name}: herramientas de imagen, PDF, vídeo y audio`,
    short_name: SITE.name,
    description: `${TOOLS.length} herramientas gratis para imágenes, PDF, vídeo, audio y developers. Todo se procesa en tu dispositivo: ningún archivo se sube a un servidor.`,
    lang: 'es',
    dir: 'ltr',
    // Los parámetros utm separan en Analytics las sesiones abiertas desde la app instalada.
    start_url: '/?utm_source=pwa&utm_medium=app',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F3EF',
    theme_color: '#FFFFFF',
    categories: ['photo', 'productivity', 'utilities'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: SHORTCUTS.filter((slug) => TOOL_BY_SLUG[slug]).map((slug) => ({
      name: TOOL_BY_SLUG[slug].name,
      short_name: TOOL_BY_SLUG[slug].name,
      description: TOOL_BY_SLUG[slug].description,
      url: `/${slug}`,
      icons: [ICON],
    })),
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
