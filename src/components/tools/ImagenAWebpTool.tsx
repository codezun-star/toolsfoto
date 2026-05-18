import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export default function ImagenAWebpTool() {
  const { file, preview, isDragging, inputRef, handleDrop, handleDragOver, handleDragLeave, handleFileChange, handleClear } = useImageUpload();
  const { download } = useDownload();
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleReset() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
    handleClear();
  }

  async function process() {
    if (!file) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const img = await loadImage(file);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, 'image/webp', quality / 100);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al convertir la imagen. El formato WebP puede no estar soportado en este navegador.');
    } finally {
      setProcessing(false);
    }
  }

  function doDownload() {
    if (!resultUrl || !file) return;
    download(resultUrl, file.name.replace(/\.[^.]+$/, '.webp'));
  }

  return (
    <div className="space-y-6">
      <div
        className={['relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer', isDragging ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'].join(' ')}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
        ) : (
          <div className="py-4">
            <Download size={28} className="mx-auto text-[var(--color-text-muted)] mb-2" />
            <p className="text-sm font-semibold text-[var(--color-text)]">Arrastra una imagen o haz clic</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">JPG, PNG, GIF · cualquier tamaño</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {file && !processing && !resultUrl && (
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--color-text)]">Calidad WebP</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{quality}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
              <span>Menor tamaño</span>
              <span>Mayor calidad</span>
            </div>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Convertir a WebP
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Convirtiendo…</p>
        </div>
      )}

      {resultUrl && file && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(file.size)}</strong></span>
            <span>WebP: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          {file.size > 0 && (
            <p className="text-xs text-center text-[var(--color-text-muted)]">
              {resultSize < file.size
                ? `${Math.round((1 - resultSize / file.size) * 100)}% más ligera`
                : 'Imagen ya muy optimizada'}
            </p>
          )}
          <button onClick={doDownload} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar WebP
          </button>
          <button onClick={handleReset} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Convertir otra imagen
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
