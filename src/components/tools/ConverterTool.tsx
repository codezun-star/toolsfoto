import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Info } from 'lucide-react';

type Format = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

const FORMATS: { mime: Format; label: string; ext: string; note: string }[] = [
  { mime: 'image/jpeg', label: 'JPG', ext: 'jpg', note: 'Mejor para fotos. Sin transparencia.' },
  { mime: 'image/png', label: 'PNG', ext: 'png', note: 'Sin pérdida. Soporta transparencia.' },
  { mime: 'image/webp', label: 'WebP', ext: 'webp', note: 'Moderno. Excelente compresión.' },
  { mime: 'image/avif', label: 'AVIF', ext: 'avif', note: 'Muy eficiente. Soporte parcial.' },
];

interface Result {
  blob: Blob;
  url: string;
  size: number;
  ext: string;
}

export default function ConverterTool() {
  const upload = useImageUpload();
  const [format, setFormat] = useState<Format>('image/webp');
  const [quality, setQuality] = useState(90);
  const [bgColor, setBgColor] = useState('#ffffff');
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

  async function handleConvert() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    clearResult();
    try {
      const img = await loadImage(upload.image.url);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = getContext(canvas);
      if (format === 'image/jpeg' || format === 'image/avif') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const ext = FORMATS.find((f) => f.mime === format)?.ext ?? 'png';
      const blob = await canvasToBlob(canvas, format, quality / 100);
      setResult({ blob, url: URL.createObjectURL(blob), size: blob.size, ext });
    } catch {
      setError('Error al convertir la imagen. Intenta con otro formato.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    download(result.blob, 'convertida', result.ext);
  }

  const selectedFormat = FORMATS.find((f) => f.mime === format);
  const showQuality = format === 'image/jpeg' || format === 'image/webp' || format === 'image/avif';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Columna izquierda: imagen original + resultado */}
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
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-text-muted)]">
              <div>
                <p className="mb-1.5">Original</p>
                <img
                  src={upload.image.url}
                  alt="Original"
                  className="w-full rounded-lg object-contain max-h-40 bg-[var(--color-bg)]"
                />
                <p className="mt-1.5 font-medium text-[var(--color-text)]">{formatBytes(upload.image.file.size)}</p>
              </div>
              <div>
                <p className="mb-1.5">
                  Convertida · <span className="font-semibold text-[var(--color-accent)] uppercase">{selectedFormat?.label}</span>
                </p>
                <img
                  src={result.url}
                  alt="Convertida"
                  className="w-full rounded-lg object-contain max-h-40 bg-[var(--color-bg)]"
                  style={format === 'image/jpeg' ? { background: bgColor } : undefined}
                />
                <p className="mt-1.5 font-medium text-[var(--color-text)]">{formatBytes(result.size)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Columna derecha: controles */}
      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">Formato de salida</h2>
          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.mime}
                onClick={() => { setFormat(f.mime); clearResult(); }}
                className={[
                  'px-3 py-3 rounded-lg text-sm font-bold border transition-colors text-left',
                  format === f.mime
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-white text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-bg)]',
                ].join(' ')}
              >
                <span className="text-base">{f.label}</span>
                <span className={['block text-xs font-normal mt-0.5', format === f.mime ? 'text-white/80' : 'text-[var(--color-text-muted)]'].join(' ')}>
                  .{f.ext}
                </span>
              </button>
            ))}
          </div>

          {selectedFormat && (
            <div className="flex items-start gap-2 mt-3 p-2.5 bg-[var(--color-bg)] rounded-lg">
              <Info size={14} className="text-[var(--color-text-muted)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-text-secondary)]">{selectedFormat.note}</p>
            </div>
          )}

          {showQuality && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <label className="font-medium text-[var(--color-text)]">Calidad</label>
                <span className="text-[var(--color-text-secondary)]">{quality}%</span>
              </div>
              <input
                type="range" min={10} max={100} step={5} value={quality}
                onChange={(e) => { setQuality(Number(e.target.value)); clearResult(); }}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          )}

          {format === 'image/jpeg' && (
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm font-medium text-[var(--color-text)]">Fondo (opaco)</label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => { setBgColor(e.target.value); clearResult(); }}
                className="h-8 w-14 rounded border border-[var(--color-border)] cursor-pointer"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConvert}
            disabled={!upload.image || loading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Convirtiendo…' : `Convertir a ${selectedFormat?.label}`}
          </button>
          <DownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={loading}
            className="flex-1"
          />
        </div>
        {!result && upload.image && (
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            Haz clic en "Convertir" para ver la previsualización y el tamaño real.
          </p>
        )}
      </div>
    </div>
  );
}
