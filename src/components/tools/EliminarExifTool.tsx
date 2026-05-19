import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, canvasToBlob, revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { ShieldOff, Check } from 'lucide-react';

const STRIPPED_ITEMS = [
  'Ubicación GPS (latitud, longitud)',
  'Modelo y marca de la cámara',
  'Fecha y hora de captura',
  'Configuración de la cámara (ISO, apertura, obturador)',
  'Software de edición utilizado',
  'Datos del propietario y copyright',
];

export default function EliminarExifTool() {
  const upload = useImageUpload();
  const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  function clearResult() {
    setResult(prev => { if (prev?.url) revokeURL(prev.url); return null; });
  }

  async function handleStrip() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    clearResult();
    try {
      const img = await loadImage(upload.image.url);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      // Re-exporting via canvas strips all metadata
      const mimeType = upload.image.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(canvas, mimeType, 0.95);
      setResult({ blob, url: URL.createObjectURL(blob), size: blob.size });
    } catch {
      setError('Error al procesar la imagen.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const ext = upload.image?.file.type === 'image/png' ? 'png' : 'jpg';
    download(result.blob, 'sin_exif', ext);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ImageUploader image={upload.image} error={upload.error} isDragging={upload.isDragging}
          onDrop={upload.onDrop} onDragOver={upload.onDragOver} onDragLeave={upload.onDragLeave}
          onFileChange={upload.onFileChange} onClear={() => { upload.clearImage(); clearResult(); }} />

        {upload.image && result && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-[var(--color-bg)] rounded-lg">
              <p className="text-[var(--color-text-muted)]">Original</p>
              <p className="font-bold text-[var(--color-text)] mt-1">{formatBytes(upload.image.file.size)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-[var(--color-text-muted)]">Sin EXIF</p>
              <p className="font-bold text-green-700 mt-1">{formatBytes(result.size)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-3">
            <ShieldOff size={18} className="text-[var(--color-tools-icon)]" />
            <h2 className="font-bold text-[var(--color-text)]">Datos que se eliminarán</h2>
          </div>
          <ul className="space-y-2">
            {STRIPPED_ITEMS.map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Check size={14} className="text-green-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            El proceso usa la Canvas API: la imagen se redibuja limpia, sin ningún metadato.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={handleStrip} disabled={!upload.image || loading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Procesando…' : 'Eliminar EXIF'}
          </button>
          <DownloadButton onClick={handleDownload} disabled={!result} loading={loading} className="flex-1" />
        </div>

        {result && upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <img src={result.url} alt="Sin EXIF" className="w-full rounded-lg object-contain max-h-48 bg-[var(--color-bg)]" />
          </div>
        )}
      </div>
    </div>
  );
}
