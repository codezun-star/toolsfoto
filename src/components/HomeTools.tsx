import { useState, useEffect } from 'react';
import { TOOLS, type ToolDomain } from '@/lib/constants/tools';
import ToolCard from '@/components/ui/ToolCard';
import { Image, FileText, Code2, Video, Music, ArrowRight } from 'lucide-react';

const IMAGEN_FEATURED = [
  'comprimir', 'redimensionar', 'recortar', 'convertir',
  'girar', 'eliminar-fondo', 'editor', 'marca-de-agua',
  'blancoynegro', 'recorte-circular', 'collage', 'redimensionar-redes',
];

const PDF_FEATURED = [
  'comprimir-pdf', 'unir-pdfs', 'dividir-pdf', 'pdf-a-jpg',
  'jpg-a-pdf', 'rotar-pdf', 'extraer-paginas-pdf', 'extraer-texto-pdf',
  'proteger-pdf', 'firmar-pdf', 'marca-agua-pdf', 'reordenar-paginas-pdf',
];

const VIDEO_FEATURED = [
  'comprimir-video', 'convertir-video', 'recortar-video', 'extraer-audio',
  'video-a-gif', 'cambiar-velocidad', 'rotar-video', 'silenciar-video',
  'anadir-audio-video', 'marca-agua-video', 'unir-videos', 'capturar-fotograma',
];

const AUDIO_FEATURED = [
  'comprimir-audio', 'convertir-audio', 'cortar-audio', 'cambiar-volumen',
  'unir-audios', 'mezclar-audios', 'normalizar-audio', 'cambiar-tono',
  'velocidad-audio', 'reducir-ruido-audio', 'ecualizador-audio', 'transcribir-audio',
];

const DEV_FEATURED = [
  'formatear-json', 'generar-qr', 'convertir-color', 'codificar-url',
  'imagen-a-base64', 'generar-favicon', 'calcular-hash', 'base64-texto',
  'generador-contrasenas', 'generador-uuid', 'regex-tester', 'svg-a-png',
];

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

function featured(slugs: string[], pool: typeof TOOLS) {
  return slugs
    .map(slug => pool.find(t => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);
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

  const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

  function VerTodas({ href, count, label }: { href: string; count: number; label: string }) {
    return (
      <div className="mt-8 flex justify-center">
        <a
          href={href}
          className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[var(--color-text)] text-[var(--color-text)] font-semibold text-sm hover:bg-[var(--color-text)] hover:text-white transition-colors rounded-xl"
        >
          Ver todas las herramientas de {label} ({count})
          <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-20 z-40 bg-white border-b border-[var(--color-border)] shadow-sm">
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
            <>
              <div className={GRID}>
                {featured(IMAGEN_FEATURED, imageTools).map(t => <ToolCard key={t.slug} tool={t} />)}
              </div>
              <VerTodas href="/imagen" count={imageTools.length} label="imágenes" />
            </>
          )}

          {active === 'pdf' && (
            <>
              <div className={GRID}>
                {featured(PDF_FEATURED, pdfTools).map(t => <ToolCard key={t.slug} tool={t} />)}
              </div>
              <VerTodas href="/pdf" count={pdfTools.length} label="PDF" />
            </>
          )}

          {active === 'video' && (
            <>
              <div className={GRID}>
                {featured(VIDEO_FEATURED, videoTools).map(t => <ToolCard key={t.slug} tool={t} />)}
              </div>
              <VerTodas href="/video" count={videoTools.length} label="vídeo" />
            </>
          )}

          {active === 'audio' && (
            <>
              <div className={GRID}>
                {featured(AUDIO_FEATURED, audioTools).map(t => <ToolCard key={t.slug} tool={t} />)}
              </div>
              <VerTodas href="/audio" count={audioTools.length} label="audio" />
            </>
          )}

          {active === 'developer' && (
            <>
              <div className={GRID}>
                {featured(DEV_FEATURED, devTools).map(t => <ToolCard key={t.slug} tool={t} />)}
              </div>
              <VerTodas href="/developer" count={devTools.length} label="developers" />
            </>
          )}

        </div>
      </div>
    </div>
  );
}
