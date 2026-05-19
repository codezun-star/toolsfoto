import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext, revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useState } from 'react';
import { FlipHorizontal, FlipVertical } from 'lucide-react';

type FlipMode = 'horizontal' | 'vertical' | 'ambos';

const FLIP_MODES: { id: FlipMode; label: string; icon: React.ReactNode }[] = [
  { id: 'horizontal', label: 'Horizontal (espejo)', icon: <FlipHorizontal size={18} /> },
  { id: 'vertical', label: 'Vertical (boca abajo)', icon: <FlipVertical size={18} /> },
  { id: 'ambos', label: 'Ambos ejes', icon: <FlipHorizontal size={18} /> },
];

export default function EspejoTool() {
  const upload = useImageUpload();
  const { download } = useDownload(upload.image?.file.name);
  const [mode, setMode] = useState<FlipMode>('horizontal');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setResultSize(0);
    upload.clearImage();
    setError(null);
  }

  async function process() {
    if (!upload.image) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = getContext(canvas);
      ctx.save();
      const flipX = mode === 'horizontal' || mode === 'ambos';
      const flipY = mode === 'vertical' || mode === 'ambos';
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.drawImage(img, flipX ? -canvas.width : 0, flipY ? -canvas.height : 0);
      ctx.restore();
      const blob = await canvasToBlob(canvas, 'image/png');
      setResultSize(blob.size);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al procesar la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <ImageUploader
        image={upload.image}
        error={upload.error}
        isDragging={upload.isDragging}
        onDrop={upload.onDrop}
        onDragOver={upload.onDragOver}
        onDragLeave={upload.onDragLeave}
        onFileChange={upload.onFileChange}
        onClear={handleClear}
      />

      {upload.image && !resultUrl && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">Tipo de volteo</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FLIP_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={[
                  'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors',
                  mode === m.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)] text-[var(--color-text-secondary)]',
                ].join(' ')}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
          <button
            onClick={process}
            disabled={processing}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-60"
          >
            {processing ? 'Procesando…' : 'Voltear imagen'}
          </button>
        </div>
      )}

      {resultUrl && upload.image && (
        <div className="space-y-4">
          <img src={resultUrl} alt="Resultado" className="max-w-full rounded-xl border border-[var(--color-border)]" />
          <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
            <span>Original: <strong className="text-[var(--color-text)]">{formatBytes(upload.image.file.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <DownloadButton
            onClick={() => { if (resultBlob) download(resultBlob, 'espejo', 'png'); }}
            disabled={!resultBlob}
            label="Descargar imagen"
            className="w-full"
          />
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otra imagen
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
