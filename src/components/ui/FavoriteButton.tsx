import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { isFav, toggleFav } from '@/lib/utils/recent';

/** Estrella junto al H1: guarda la herramienta en favoritas (localStorage). */
export default function FavoriteButton({ slug }: { slug: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => { setOn(isFav(slug)); }, [slug]);

  return (
    <button
      type="button"
      onClick={() => setOn(toggleFav(slug))}
      aria-pressed={on}
      title={on ? 'Quitar de favoritas' : 'Guardar en favoritas'}
      className={[
        'shrink-0 mt-1 w-10 h-10 grid place-items-center rounded-full border transition-colors',
        on
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
          : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:text-[var(--color-accent)]',
      ].join(' ')}
    >
      <Star size={18} fill={on ? 'currentColor' : 'none'} />
      <span className="sr-only">{on ? 'Quitar de favoritas' : 'Guardar en favoritas'}</span>
    </button>
  );
}
