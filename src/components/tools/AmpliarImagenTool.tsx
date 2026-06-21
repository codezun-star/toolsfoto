import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';
import { formatBytes, formatDimensions } from '@/lib/utils/format';

interface Result { blob: Blob; url: string; size: number; w: number; h: number }

export default function AmpliarImagenTool() {
  const upload = useImageUpload();
  const [factor, setFactor] = useState(2);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  function clearResult() {
    setResult((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return null; });
  }

  async function upscale() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    clearResult();
    try {
      const img = await loadImage(upload.image.url);
      const w = Math.round(img.naturalWidth * factor);
      const h = Math.round(img.naturalHeight * factor);
      if (w * h > 60_000_000) { setError('La imagen resultante es demasiado grande. Reduce el factor de ampliación.'); setLoading(false); return; }
      const canvas = createCanvas(w, h);
      const ctx = getContext(canvas);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      const isPng = upload.image.file.type === 'image/png';
      const blob = await canvasToBlob(canvas, isPng ? 'image/png' : 'image/jpeg', 0.95);
      setResult({ blob, url: URL.createObjectURL(blob), size: blob.size, w, h });
    } catch {
      setError('Error al ampliar la imagen. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ImageUploader
          image={upload.image}
          error={upload.error}
          isDragging={upload.isDragging}
          onDrop={upload.onDrop}
          onDragOver={upload.onDragOver}
          onDragLeave={upload.onDragLeave}
          onFileChange={upload.onFileChange}
          onClear={() => { upload.clearImage(); clearResult(); }}
        />
        {result && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-tools-border)] text-sm space-y-1">
            <p className="text-[var(--color-text-secondary)]">Nuevo tamaño: <strong className="text-[var(--color-accent)]">{formatDimensions(result.w, result.h)}</strong></p>
            <p className="text-[var(--color-text-secondary)]">Peso: <strong className="text-[var(--color-text)]">{formatBytes(result.size)}</strong></p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Factor de ampliación</h2>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4].map((f) => (
              <button key={f} onClick={() => { setFactor(f); clearResult(); }} className={['py-2.5 rounded-xl border text-sm font-bold transition-colors', factor === f ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{f}×</button>
            ))}
          </div>
          {upload.image && (
            <p className="text-xs text-[var(--color-text-muted)]">El reescalado usa interpolación bicúbica de alta calidad para suavizar el aumento de tamaño. Para fotos pequeñas, 2× ofrece el mejor equilibrio.</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={upscale} disabled={!upload.image || loading} className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Ampliando…' : `Ampliar ${factor}×`}
          </button>
          <DownloadButton onClick={() => result && download(result.blob, `ampliada-${factor}x`, upload.image?.file.type === 'image/png' ? 'png' : 'jpg')} disabled={!result} loading={loading} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
