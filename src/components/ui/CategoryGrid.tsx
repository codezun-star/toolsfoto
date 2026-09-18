import { useState } from 'react';
import { TOOLS, type ToolDomain } from '@/lib/constants/tools';
import ToolCard from '@/components/ui/ToolCard';

const PER_PAGE = 24;

interface Props {
  domain: ToolDomain;
}

/**
 * Grid paginado de una categoría.
 *
 * Renderiza SIEMPRE las cards de todas las herramientas del dominio y oculta
 * con CSS las que quedan fuera de la página actual. La paginación no recorta el
 * array a propósito: si lo hiciera, el HTML servido solo contendría los
 * `<a href>` de las 24 primeras y el resto de la categoría quedaría sin ningún
 * enlace interno que los rastreadores puedan seguir (los botones de paginación
 * no son enlaces). Visualmente el usuario sigue viendo 24 por página.
 */
export default function CategoryGrid({ domain }: Props) {
  const tools = TOOLS.filter(t => t.domain === domain);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(tools.length / PER_PAGE);
  const from = (page - 1) * PER_PAGE;
  const to = page * PER_PAGE;

  function goTo(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((t, i) => (
          <ToolCard
            key={t.slug}
            tool={t}
            className={i >= from && i < to ? '' : 'hidden'}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-10 flex-wrap" aria-label="Paginación de herramientas">
          <button
            onClick={() => goTo(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg bg-white text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => goTo(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Página ${p} de ${totalPages}`}
              className={[
                'w-9 h-9 text-sm font-semibold rounded-lg transition-colors',
                p === page
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goTo(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg bg-white text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente →
          </button>
        </nav>
      )}
    </div>
  );
}
