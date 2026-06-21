import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';

interface Result { blob: Blob; url: string; size: number }

export default function WebpAJpgTool() {
  const upload = useImageUpload();
  const [quality, setQuality] = useState(92);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  function clearResult() {
    setResult((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return null; });
  }

  async function convert() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    clearResult();
    try {
      const img = await loadImage(upload.image.url);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = getContext(canvas);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality / 100);
      setResult({ blob, url: URL.createObjectURL(blob), size: blob.size });
    } catch {
      setError('Error al convertir. Asegúrate de subir un WebP válido.');
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
        {result && upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] grid grid-cols-2 gap-3 text-xs text-[var(--color-text-muted)]">
            <div>
              <p className="mb-1.5">WebP original</p>
              <img src={upload.image.url} alt="Original" className="w-full rounded-lg object-contain max-h-40 bg-[var(--color-bg)]" />
              <p className="mt-1.5 font-medium text-[var(--color-text)]">{formatBytes(upload.image.file.size)}</p>
            </div>
            <div>
              <p className="mb-1.5">JPG convertido</p>
              <img src={result.url} alt="JPG" className="w-full rounded-lg object-contain max-h-40 bg-[var(--color-bg)]" />
              <p className="mt-1.5 font-medium text-[var(--color-accent)]">{formatBytes(result.size)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <label className="font-medium text-[var(--color-text)]">Calidad JPG</label>
              <span className="text-[var(--color-text-secondary)]">{quality}%</span>
            </div>
            <input type="range" min={10} max={100} step={5} value={quality} onChange={(e) => { setQuality(Number(e.target.value)); clearResult(); }} className="w-full accent-[var(--color-accent)]" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[var(--color-text)]">Fondo (sustituye transparencia)</label>
            <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); clearResult(); }} className="h-8 w-14 rounded border border-[var(--color-border)] cursor-pointer" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={convert} disabled={!upload.image || loading} className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Convirtiendo…' : 'Convertir a JPG'}
          </button>
          <DownloadButton onClick={() => result && download(result.blob, 'convertida', 'jpg')} disabled={!result} loading={loading} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
