import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';

interface Result { blob: Blob; url: string; size: number }

export default function JpgAPngTool() {
  const upload = useImageUpload();
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
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, 'image/png');
      setResult({ blob, url: URL.createObjectURL(blob), size: blob.size });
    } catch {
      setError('Error al convertir la imagen. Prueba con otro archivo JPG.');
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
              <p className="mb-1.5">JPG original</p>
              <img src={upload.image.url} alt="Original" className="w-full rounded-lg object-contain max-h-40 bg-[var(--color-bg)]" />
              <p className="mt-1.5 font-medium text-[var(--color-text)]">{formatBytes(upload.image.file.size)}</p>
            </div>
            <div>
              <p className="mb-1.5">PNG convertido</p>
              <img src={result.url} alt="PNG" className="w-full rounded-lg object-contain max-h-40 bg-[var(--color-bg)]" />
              <p className="mt-1.5 font-medium text-[var(--color-accent)]">{formatBytes(result.size)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-2">Conversión sin pérdida</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">El PNG es un formato sin pérdida ideal para editar la imagen varias veces sin degradación o para añadir transparencia después. El archivo resultante suele ser más grande que el JPG original.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={convert} disabled={!upload.image || loading} className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Convirtiendo…' : 'Convertir a PNG'}
          </button>
          <DownloadButton onClick={() => result && download(result.blob, 'convertida', 'png')} disabled={!result} loading={loading} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
