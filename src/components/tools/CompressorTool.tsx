import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { formatBytes, formatReduction } from '@/lib/utils/format';
import { TrendingDown } from 'lucide-react';

interface Result {
  blob: Blob;
  url: string;
  size: number;
}

export default function CompressorTool() {
  const upload = useImageUpload();
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  function clearResult() {
    setResult((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  async function handleCompress() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const compressed = await imageCompression(upload.image.file, {
        maxSizeMB: 50,
        initialQuality: quality / 100,
        useWebWorker: true,
        preserveExif: false,
      });
      setResult((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { blob: compressed, url: URL.createObjectURL(compressed), size: compressed.size };
      });
    } catch {
      setError('Error al comprimir la imagen. Intenta con otra imagen.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    download(result.blob, 'comprimida');
  }

  const reduction = upload.image && result
    ? formatReduction(upload.image.file.size, result.size)
    : null;

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
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">Configuración</h2>
          <Slider
            label="Calidad"
            value={quality}
            min={10}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => { setQuality(v); clearResult(); }}
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Valores entre 70-85% ofrecen el mejor balance calidad/tamaño.
          </p>
        </div>

        {upload.image && (
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
            <h2 className="font-bold text-[var(--color-text)]">Comparativa</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-[var(--color-bg)] rounded-lg">
                <p className="text-[var(--color-text-muted)]">Original</p>
                <p className="font-bold text-[var(--color-text)] mt-1">{formatBytes(upload.image.file.size)}</p>
              </div>
              <div className={['p-3 rounded-lg', result ? 'bg-green-50' : 'bg-[var(--color-bg)]'].join(' ')}>
                <p className="text-[var(--color-text-muted)]">Comprimida</p>
                <p className={['font-bold mt-1', result ? 'text-green-700' : 'text-[var(--color-text-muted)]'].join(' ')}>
                  {result ? formatBytes(result.size) : '—'}
                </p>
              </div>
            </div>
            {reduction && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                <TrendingDown size={16} className="text-green-600 shrink-0" />
                <span className="text-sm text-green-700 font-medium">Ahorro: {reduction} menos</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCompress}
            disabled={!upload.image || loading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Comprimiendo…' : 'Comprimir'}
          </button>
          <DownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={loading}
            className="flex-1"
          />
        </div>
      </div>

      {/* Comparativa visual — ocupa ambas columnas */}
      {result && upload.image && (
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">Vista previa</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">
                Original · <span className="font-medium">{formatBytes(upload.image.file.size)}</span>
              </p>
              <img
                src={upload.image.url}
                alt="Original"
                className="w-full rounded-lg object-contain max-h-72 bg-[var(--color-bg)]"
              />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">
                Comprimida · <span className="font-medium text-green-700">{formatBytes(result.size)}</span>
                {reduction && <span className="text-green-600"> ({reduction} menos)</span>}
              </p>
              <img
                src={result.url}
                alt="Comprimida"
                className="w-full rounded-lg object-contain max-h-72 bg-[var(--color-bg)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
