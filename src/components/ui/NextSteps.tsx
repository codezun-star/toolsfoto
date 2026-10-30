import { useEffect, useState } from 'react';
import { CircleCheck, ArrowRight, X } from 'lucide-react';
import { RESULT_EVENT, type ResultDetail } from '@/lib/utils/results';
import { stashFiles } from '@/lib/utils/inbox';
import { fileKind, type FileKind } from '@/lib/constants/next-steps';
import { formatBytes } from '@/lib/utils/format';
import { translate, type Lang } from '@/i18n';

interface Step { slug: string; name: string }

interface Props {
  /** Sugerencias por tipo de archivo, ya sin la herramienta actual (las calcula `ToolLayout`). */
  steps: Record<FileKind, Step[]>;
  lang?: Lang;
}

type Gtag = (...args: unknown[]) => void;

/**
 * "¿Y ahora?": tras descargar un resultado, ofrece seguir con ese mismo
 * archivo en otra herramienta sin volver a subirlo. El archivo viaja por el
 * buzón (`inbox.ts`) y lo recoge el uploader de la página de destino.
 */
export default function NextSteps({ steps, lang = 'es' }: Props) {
  const t = (es: string) => translate(lang, es);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<FileKind | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onResult = (e: Event) => {
      const { file: f } = (e as CustomEvent<ResultDetail>).detail;
      const k = fileKind(f);
      if (!k || steps[k].length === 0) return;
      setFile(f);
      setKind(k);
      setError(null);
    };
    window.addEventListener(RESULT_EVENT, onResult);
    return () => window.removeEventListener(RESULT_EVENT, onResult);
  }, [steps]);

  if (!file || !kind) return null;

  async function go(slug: string) {
    if (!file) return;
    setBusy(slug);
    setError(null);
    try {
      await stashFiles([file], `/${slug}`);
      (window as Window & { gtag?: Gtag }).gtag?.('event', 'next_step', { to: slug });
      location.href = `/${slug}`;
    } catch {
      setBusy(null);
      setError(t('No se ha podido pasar el archivo. Descárgalo y súbelo en la otra herramienta.'));
    }
  }

  return (
    <section className="mt-8 p-5 rounded-2xl bg-white border border-[var(--color-tools-border)]" aria-live="polite">
      <div className="flex items-start gap-3">
        <CircleCheck size={22} className="text-[var(--color-tools-icon)] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--color-text)]">{t('¿Y ahora? Sigue con este archivo')}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 truncate">
            {file.name} · {formatBytes(file.size)} · {t('sin volver a subirlo')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFile(null)}
          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
          aria-label={t('Cerrar sugerencias')}
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {steps[kind].map((s) => (
          <button
            key={s.slug}
            type="button"
            disabled={busy !== null}
            onClick={() => go(s.slug)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50 transition-colors"
          >
            {busy === s.slug ? t('Abriendo…') : s.name}
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
