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
    // "Compartir" desde otra app (Android/ChromeOS): el service worker recibe
    // el POST, deja los archivos en el buzón (IndexedDB) y redirige a /compartir.
    share_target: {
      action: '/compartir',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
        files: [{ name: 'files', accept: ['image/*', 'application/pdf', '.pdf', 'video/*', 'audio/*'] }],
      },
    },
    // "Abrir con ToolsFoto" en escritorio (app instalada). La página lee los
    // archivos con `launchQueue` (CompartirTool.tsx).
    file_handlers: [{
      action: '/compartir',
      accept: {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'image/gif': ['.gif'],
        'application/pdf': ['.pdf'],
        'video/mp4': ['.mp4'],
        'video/webm': ['.webm'],
        'video/quicktime': ['.mov'],
        'audio/mpeg': ['.mp3'],
        'audio/wav': ['.wav'],
        'audio/ogg': ['.ogg'],
        'audio/flac': ['.flac'],
        'audio/mp4': ['.m4a'],
      },
    }],
    launch_handler: { client_mode: 'navigate-existing' },
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
