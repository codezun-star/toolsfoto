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
      // Fuera del sitemap: las páginas legales y la 404, todas noindex
      filter: (page) =>
        !['/privacidad', '/terminos', '/cookies', '/aviso-legal', '/404'].some(
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
