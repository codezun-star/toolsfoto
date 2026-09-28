// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://toolsfoto.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [
    react(),
    sitemap({
      // Fuera del sitemap: las páginas legales, la 404 y la de sin conexión de la PWA, todas noindex
      filter: (page) =>
        !['/privacidad', '/terminos', '/cookies', '/aviso-legal', '/404', '/offline'].some(
          (p) => page === `https://toolsfoto.com${p}` || page === `https://toolsfoto.com${p}/`,
        ),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@imgly/background-removal'],
    },
  },
});
