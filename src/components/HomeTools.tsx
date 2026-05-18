import { useState, useEffect } from 'react';
import { TOOLS, type ToolDomain } from '@/lib/constants/tools';
import ToolCard from '@/components/ui/ToolCard';
import { Image, FileText, Code2, Video, Music } from 'lucide-react';

const TABS: { id: ToolDomain; label: string; Icon: typeof Image }[] = [
  { id: 'imagen', label: 'Imágenes', Icon: Image },
  { id: 'pdf', label: 'PDF', Icon: FileText },
  { id: 'video', label: 'Vídeo', Icon: Video },
  { id: 'audio', label: 'Audio', Icon: Music },
  { id: 'developer', label: 'Developers', Icon: Code2 },
];

const VALID_TABS = TABS.map(t => t.id);

function getTabFromHash(): ToolDomain {
  if (typeof window === 'undefined') return 'imagen';
  const hash = window.location.hash.slice(1) as ToolDomain;
  return VALID_TABS.includes(hash) ? hash : 'imagen';
}

export default function HomeTools() {
  const [active, setActive] = useState<ToolDomain>(getTabFromHash);

  useEffect(() => {
    const onHash = () => setActive(getTabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function selectTab(tab: ToolDomain) {
    setActive(tab);
    history.replaceState(null, '', `#${tab}`);
  }

  const imageTools = TOOLS.filter(t => t.domain === 'imagen');
  const pdfTools = TOOLS.filter(t => t.domain === 'pdf');
  const videoTools = TOOLS.filter(t => t.domain === 'video');
  const audioTools = TOOLS.filter(t => t.domain === 'audio');
  const devTools = TOOLS.filter(t => t.domain === 'developer');

  const counts: Record<ToolDomain, number> = {
    imagen: imageTools.length,
    pdf: pdfTools.length,
    video: videoTools.length,
    audio: audioTools.length,
    developer: devTools.length,
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-14 z-40 bg-white border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-none">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => selectTab(id)}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0',
                  active === id
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
                <span
                  className={[
                    'text-xs px-1.5 py-0.5 rounded-full font-medium',
                    active === id
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  {counts[id]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[var(--color-tools-bg)] border-b border-[var(--color-tools-border)] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {active === 'imagen' && (
            <div className="space-y-10">
              <Section label="Básicas" tools={imageTools.filter(t => t.category === 'Básicas')} cols={3} />
              <Section label="Creativas" tools={imageTools.filter(t => t.category === 'Creativas')} cols={3} />
              <Section label="Avanzadas" tools={imageTools.filter(t => t.category === 'Avanzadas')} cols={4} />
            </div>
          )}

          {active === 'pdf' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pdfTools.map(t => <ToolCard key={t.slug} tool={t} />)}
            </div>
          )}

          {active === 'video' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {videoTools.map(t => <ToolCard key={t.slug} tool={t} />)}
            </div>
          )}

          {active === 'audio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {audioTools.map(t => <ToolCard key={t.slug} tool={t} />)}
            </div>
          )}

          {active === 'developer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {devTools.map(t => <ToolCard key={t.slug} tool={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, tools, cols }: { label: string; tools: typeof TOOLS; cols: 3 | 4 }) {
  const gridClass = cols === 4
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4">{label}</h3>
      <div className={gridClass}>
        {tools.map(t => <ToolCard key={t.slug} tool={t} />)}
      </div>
    </div>
  );
}
