import type { APIRoute } from 'astro';
import { TOOLS } from '@/lib/constants/tools';

/**
 * /search-index.json — índice del buscador de herramientas (AppShell.astro).
 * Se genera en cada build desde TOOLS y el navegador lo pide solo la primera
 * vez que se abre el buscador. Claves cortas para que pese poco:
 * s = slug, n = nombre, d = descripción corta, c = dominio.
 */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(TOOLS.map((t) => ({ s: t.slug, n: t.name, d: t.description, c: t.domain }))),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
