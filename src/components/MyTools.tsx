import { useEffect, useState } from 'react';
import { Star, History } from 'lucide-react';
import ToolCard from '@/components/ui/ToolCard';
import { getFavs, getRecent, FAVS_EVENT } from '@/lib/utils/recent';

interface Entry { s: string; n: string; d: string; c: string; i: string }
type Card = { slug: string; name: string; description: string; icon: string };

const toCard = (e: Entry): Card => ({ slug: e.s, name: e.n, description: e.d, icon: e.i });

/**
 * "Tus herramientas" en el home: favoritas y usadas recientemente.
 * No pinta nada hasta que hay algo guardado en este navegador, y solo
 * entonces descarga el índice del buscador (`/search-index.json`) para
 * los nombres e iconos.
 */
export default function MyTools() {
  const [favs, setFavs] = useState<Card[]>([]);
  const [recent, setRecent] = useState<Card[]>([]);

  useEffect(() => {
    let index: Map<string, Entry> | null = null;

    const refresh = () => {
      const favSlugs = getFavs();
      const recentSlugs = getRecent().filter((s) => !favSlugs.includes(s)).slice(0, 4);
      if (!favSlugs.length && !recentSlugs.length) {
        setFavs([]);
        setRecent([]);
        return;
      }
      const load = index
        ? Promise.resolve(index)
        : fetch('/search-index.json')
          .then((r) => r.json() as Promise<Entry[]>)
          .then((data) => (index = new Map(data.map((e) => [e.s, e]))));
      load.then((map) => {
        const pick = (slugs: string[]) => slugs.map((s) => map.get(s)).filter((e): e is Entry => e !== undefined).map(toCard);
        setFavs(pick(favSlugs));
        setRecent(pick(recentSlugs));
      }).catch(() => { /* sin índice no hay sección: el home sigue igual */ });
    };

    refresh();
    window.addEventListener(FAVS_EVENT, refresh);
    return () => window.removeEventListener(FAVS_EVENT, refresh);
  }, []);

  if (!favs.length && !recent.length) return null;

  const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8" aria-labelledby="tf-my-tools">
      <h2 id="tf-my-tools" className="text-xl font-extrabold text-[var(--color-text)] mb-5">Tus herramientas</h2>
      {favs.length > 0 && (
        <>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
            <Star size={15} /> Favoritas
          </p>
          <div className={GRID}>{favs.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
        </>
      )}
      {recent.length > 0 && (
        <>
          <p className={`flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)] mb-3 ${favs.length ? 'mt-6' : ''}`}>
            <History size={15} /> Usadas recientemente
          </p>
          <div className={GRID}>{recent.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
        </>
      )}
    </section>
  );
}
