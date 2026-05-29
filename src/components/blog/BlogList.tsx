import { useState } from 'react';

const PER_PAGE = 10;

const CATEGORIA_LABEL: Record<string, string> = {
  herramientas:    'Herramientas',
  tips:            'Tips',
  tutoriales:      'Tutoriales',
  actualizaciones: 'Novedades',
  general:         'General',
};

interface Article {
  id:          string;
  titulo:      string;
  descripcion: string;
  categoria:   string;
}

interface Props {
  articles: Article[];
}

export default function BlogList({ articles }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(articles.length / PER_PAGE);
  const visible = articles.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function goTo(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-text-muted)]">No hay artículos publicados aún.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col divide-y divide-[var(--color-border)]">
        {visible.map((art) => (
          <a
            key={art.id}
            href={`/blog/${art.id}`}
            className="group flex items-center bg-white hover:bg-[#FAFAF8] border-l-2 border-transparent hover:border-[var(--color-accent)] transition-all duration-150 overflow-hidden"
          >
            <div className="flex-1 min-w-0 px-5 py-5">
              <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                {art.categoria && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest bg-[var(--color-text)] text-[var(--color-accent)] px-2 py-0.5 font-mono">
                    {CATEGORIA_LABEL[art.categoria] ?? art.categoria}
                  </span>
                )}
              </div>
              <p className="text-base font-semibold text-[var(--color-text)] mb-1.5 leading-snug group-hover:text-[var(--color-accent)] transition-colors">
                {art.titulo}
              </p>
              {art.descripcion && (
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                  {art.descripcion}
                </p>
              )}
            </div>
            <div className="flex items-center px-4 shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[var(--color-accent)] group-hover:translate-x-0.5 transition-all">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
          <button
            onClick={() => goTo(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg bg-white text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goTo(p)}
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
        </div>
      )}

      <p className="text-center text-xs text-[var(--color-text-muted)] mt-4 font-mono">
        {articles.length} artículos · página {page} de {totalPages}
      </p>
    </div>
  );
}
