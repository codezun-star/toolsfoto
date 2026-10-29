import { useEffect, useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Video, Music, ArrowRight, X } from 'lucide-react';
import { peekStashedFiles, stashFiles } from '@/lib/utils/inbox';
import { fileKind, type FileKind } from '@/lib/constants/next-steps';
import { formatBytes } from '@/lib/utils/format';
import { useFileReceiver } from '@/hooks/useFileReceiver';

interface Option { slug: string; name: string; description: string }

interface Props {
  /** Herramientas por tipo de archivo (las calcula `compartir.astro`). */
  options: Record<FileKind, Option[]>;
}

const KIND_LABEL: Record<FileKind, string> = { image: 'Imagen', pdf: 'PDF', video: 'Vídeo', audio: 'Audio' };
const KIND_ICON: Record<FileKind, typeof ImageIcon> = { image: ImageIcon, pdf: FileText, video: Video, audio: Music };

/** Lo que expone Chrome cuando la app instalada abre un archivo ("Abrir con ToolsFoto"). */
interface LaunchParams { files: Array<{ getFile(): Promise<File> }> }
interface LaunchQueue { setConsumer(cb: (params: LaunchParams) => void): void }

/**
 * Entrada universal de archivos: recibe lo que se comparte desde otra app
 * (share target de la PWA, vía el service worker y el buzón), lo que se abre
 * con "Abrir con ToolsFoto" (file handlers) y lo que se suelta o pega aquí.
 * Propone las herramientas que encajan con cada tipo de archivo.
 */
export default function CompartirTool({ options }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function add(list: ArrayLike<File>) {
    const incoming = Array.from(list);
    const valid = incoming.filter((f) => fileKind(f) !== null);
    setError(valid.length < incoming.length
      ? 'Algún archivo no es una imagen, un PDF, un vídeo ni un audio, y se ha descartado.'
      : null);
    if (valid.length) setFiles((prev) => [...prev, ...valid]);
  }

  useEffect(() => {
    peekStashedFiles().then((stashed) => { if (stashed.length) setFiles(stashed); });
    const lq = (window as Window & { launchQueue?: LaunchQueue }).launchQueue;
    lq?.setConsumer(async (params) => {
      if (!params.files.length) return;
      const opened = await Promise.all(params.files.map((h) => h.getFile()));
      setFiles(opened.filter((f) => fileKind(f) !== null));
    });
  }, []);

  useFileReceiver((f) => fileKind(f) !== null, (f) => add([f]), () => true, true);

  async function open(slug: string, kind: FileKind) {
    setBusy(slug);
    setError(null);
    try {
      await stashFiles(files.filter((f) => fileKind(f) === kind), `/${slug}`);
      location.href = `/${slug}`;
    } catch {
      setBusy(null);
      setError('No se ha podido abrir el archivo en esa herramienta. Inténtalo de nuevo.');
    }
  }

  const kinds = (Object.keys(KIND_LABEL) as FileKind[]).filter((k) => files.some((f) => fileKind(f) === k));

  return (
    <div className="space-y-6">
      <label
        className={[
          'flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center',
          dragging
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
            : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)]',
        ].join(' ')}
        onDrop={(e) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
      >
        <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">
          <Upload size={24} />
        </div>
        <div>
          <p className="font-semibold text-[var(--color-text)]">{files.length ? 'Añadir más archivos' : 'Elige cualquier archivo'}</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Imagen, PDF, vídeo o audio · Te decimos qué puedes hacer con él</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,video/*,audio/*"
          className="hidden"
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ''; }}
        />
      </label>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {files.length > 0 && (
        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-white">
          {files.map((f, i) => {
            const k = fileKind(f);
            const Icon = k ? KIND_ICON[k] : FileText;
            return (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
                <Icon size={18} className="text-[var(--color-tools-icon)] shrink-0" />
                <span className="text-sm text-[var(--color-text)] truncate flex-1">{f.name}</span>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, n) => n !== i))}
                  className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                  aria-label={`Quitar ${f.name}`}
                >
                  <X size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {kinds.map((k) => (
        <section key={k}>
          <h2 className="text-lg font-extrabold text-[var(--color-text)] mb-3">
            Qué hacer con {files.filter((f) => fileKind(f) === k).length > 1 ? 'estos archivos' : 'este archivo'} ({KIND_LABEL[k]})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {options[k].map((o) => (
              <button
                key={o.slug}
                type="button"
                disabled={busy !== null}
                onClick={() => open(o.slug, k)}
                className="group text-left p-4 rounded-xl bg-white border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-50 transition-colors"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[15px] text-[var(--color-text)]">{busy === o.slug ? 'Abriendo…' : o.name}</span>
                  <ArrowRight size={15} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" />
                </span>
                <span className="block text-sm text-[var(--color-text-secondary)] mt-1">{o.description}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
