import type { APIRoute } from 'astro';
import { TOOL_BY_SLUG } from '@/lib/constants/tools';
import { EN_TOOLS } from '@/i18n/tools-en';

/**
 * /search-index-en.json — índice del buscador en las páginas en inglés
 * (mismas claves que `/search-index.json`; `s` lleva el prefijo `en/`).
 */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(EN_TOOLS.map((t) => ({ s: `en/${t.slug}`, n: t.name, d: t.description, c: TOOL_BY_SLUG[t.es].domain, i: TOOL_BY_SLUG[t.es].icon }))),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
