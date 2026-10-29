import { useState, useCallback } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import ImageUploader from '@/components/ui/ImageUploader';
import { Download, Loader2 } from 'lucide-react';

const PRESETS = [
  { label: '100 KB', value: 100 },
  { label: '200 KB', value: 200 },
  { label: '500 KB', value: 500 },
  { label: '1 MB', value: 1024 },
];

const kbLabel = (kb: number) => (kb < 1024 ? `${kb} KB` : `${+(kb / 1024).toFixed(1)} MB`);

interface Props {
  /** Objetivo inicial en KB. Lo usan las páginas "comprimir imagen a X KB". */
  initialKB?: number;
}

/** Lado mínimo al que se reduce la imagen para alcanzar objetivos muy pequeños. */
const MIN_SIDE = 160;

export default function ComprimirObjetivoTool({ initialKB = 200 }: Props) {
  const upload = useImageUpload();
  const { download } = useDownload(upload.image?.file.name);
  const [targetKB, setTargetKB] = useState(initialKB);
  const [resized, setResized] = useState<{ w: number; h: number } | null>(null);
  const presets = PRESETS.some((p) => p.value === initialKB)
    ? PRESETS
    : [{ label: kbLabel(initialKB), value: initialKB }, ...PRESETS.slice(0, 3)];
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [finalQuality, setFinalQuality] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async () => {
    if (!upload.image) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setFinalQuality(null);
    setResized(null);
    try {
      const img = await loadImage(upload.image.url);
      const targetBytes = targetKB * 1024;
      const ITERS = 15;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      let best: Blob | null = null;
      let bestQ = 1.0;

      // Búsqueda binaria de la calidad JPEG. Si ni con la calidad mínima útil
      // (30 %) se alcanza el objetivo, se reduce la imagen un 20 % y se repite:
      // con objetivos de 20-50 KB una foto de móvil no cabe a tamaño completo.
      for (let round = 0; round < 12; round++) {
        const canvas = createCanvas(w, h);
        const ctx = getContext(canvas);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        // Por debajo del 30 % de calidad compensa más reducir píxeles que seguir
        // comprimiendo; solo al llegar al tamaño mínimo se acepta hasta el 10 %.
        const floorQ = Math.min(w, h) * 0.8 < MIN_SIDE ? 0.1 : 0.3;
        let lo = floorQ, hi = 1.0;
        best = null;
        for (let i = 0; i < ITERS; i++) {
          setProgress(Math.min(99, Math.round(((round * ITERS + i) / (ITERS * 3)) * 100)));
          const mid = (lo + hi) / 2;
          const blob = await canvasToBlob(canvas, 'image/jpeg', mid);
          if (blob.size <= targetBytes) {
            best = blob;
            bestQ = mid;
            lo = mid;
          } else {
            hi = mid;
          }
          if (hi - lo < 0.005) break;
        }
        if (!best) {
          const floor = await canvasToBlob(canvas, 'image/jpeg', floorQ);
          if (floor.size <= targetBytes) { best = floor; bestQ = floorQ; }
        }
        if (best || Math.min(w, h) <= MIN_SIDE) {
          if (!best) { best = await canvasToBlob(canvas, 'image/jpeg', 0.1); bestQ = 0.1; }
          break;
        }
        w = Math.round(w * 0.8);
        h = Math.round(h * 0.8);
      }
      if (w !== img.naturalWidth) setResized({ w, h });

      setResultBlob(best);
      setFinalQuality(Math.round(bestQ * 100));
      setProgress(100);
    } catch (err) {
      console.error('[ComprimirObjetivo] Error:', err);
      setError('Error al comprimir la imagen. Asegúrate de que el archivo es una imagen válida.');
    } finally {
      setProcessing(false);
    }
  }, [upload.image, targetKB]);

  function handleDownload() {
    if (!resultBlob) return;
    download(resultBlob, 'comprimida', 'jpg');
  }

  function reset() {
    upload.clearImage();
    setResultBlob(null);
    setFinalQuality(null);
    setResized(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className="space-y-6">
      {!upload.image && (
        <ImageUploader
          image={upload.image}
          error={upload.error}
          isDragging={upload.isDragging}
          onDrop={upload.onDrop}
          onDragOver={upload.onDragOver}
          onDragLeave={upload.onDragLeave}
          onFileChange={upload.onFileChange}
          onClear={upload.clearImage}
        />
      )}

      {upload.image && (
        <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
          <img src={upload.image.url} alt="Preview" className="w-full max-h-64 object-contain bg-[var(--color-bg)]" />
          <div className="absolute top-2 right-2">
            <button onClick={reset} className="px-3 py-1.5 bg-white rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-red-600 transition-colors">
              Quitar
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
            {formatBytes(upload.image.file.size)}
          </div>
        </div>
      )}

      {upload.image && !processing && !resultBlob && (
        <div className="space-y-5">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Tamaño objetivo</h2>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setTargetKB(p.value)}
                  className={['py-2 rounded-xl border text-sm font-semibold transition-colors', targetKB === p.value ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-[var(--color-text)]">Tamaño personalizado</label>
                <span className="text-sm font-mono font-bold text-[var(--color-accent)]">{targetKB} KB</span>
              </div>
              <input type="range" min={10} max={5000} step={10} value={targetKB} onChange={(e) => setTargetKB(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1"><span>10 KB</span><span>5 MB</span></div>
            </div>
            {upload.image.file.size <= targetKB * 1024 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">La imagen ya es más pequeña que el objetivo ({formatBytes(upload.image.file.size)}). Se aplicará la mínima compresión posible.</p>
            )}
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Comprimir a {kbLabel(targetKB)}
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress < 100 ? `Buscando calidad óptima… ${progress}%` : 'Finalizado'}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {resultBlob && upload.image && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[var(--color-bg)] rounded-xl">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Original</p>
              <p className="text-sm font-bold text-[var(--color-text)]">{formatBytes(upload.image.file.size)}</p>
            </div>
            <div className="p-3 bg-[var(--color-tools-bg)] rounded-xl">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Resultado</p>
              <p className="text-sm font-bold text-[var(--color-accent)]">{formatBytes(resultBlob.size)}</p>
            </div>
            <div className="p-3 bg-[var(--color-bg)] rounded-xl">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Calidad JPEG</p>
              <p className="text-sm font-bold text-[var(--color-text)]">{finalQuality}%</p>
            </div>
          </div>
          {resized && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Para llegar a {kbLabel(targetKB)} la imagen se ha reducido a {resized.w} × {resized.h} px: a su tamaño original solo cabía con una calidad demasiado baja.
            </p>
          )}
          <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar imagen comprimida
          </button>
          <button onClick={reset} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Comprimir otra imagen
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
