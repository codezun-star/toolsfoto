import { useState, useEffect, useRef } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';

export default function RotatorTool() {
  const upload = useImageUpload();
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const { download } = useDownload(upload.image?.file.name);

  useEffect(() => {
    if (!upload.image || !previewRef.current) return;
    const canvas = previewRef.current;
    async function render() {
      const img = await loadImage(upload.image!.url);
      const ctx = getContext(canvas);
      const rad = (rotation * Math.PI) / 180;
      const rotated90 = rotation % 180 !== 0;
      const w = rotated90 ? img.naturalHeight : img.naturalWidth;
      const h = rotated90 ? img.naturalWidth : img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();
    }
    render().catch(() => {});
  }, [upload.image, rotation, flipH, flipV]);

  async function handleApply() {
    if (!upload.image || !previewRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const blob = await canvasToBlob(previewRef.current, upload.image.file.type);
      const ext = upload.image.file.name.split('.').pop() ?? 'png';
      download(blob, 'girada', ext);
    } catch {
      setError('Error al aplicar la rotación.');
    } finally {
      setLoading(false);
    }
  }

  function rotate(deg: number) {
    setRotation(r => (r + deg + 360) % 360);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        {!upload.image ? (
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
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="bg-[#F8F8F8] p-4 flex items-center justify-center min-h-48">
              <canvas
                ref={previewRef}
                className="max-w-full max-h-64 object-contain"
              />
            </div>
            <div className="px-4 py-2 border-t border-[var(--color-border)] flex justify-between items-center">
              <span className="text-xs text-[var(--color-text-muted)]">Rotación: {rotation}°</span>
              <button onClick={upload.clearImage} className="text-xs text-[var(--color-accent)] hover:underline">Cambiar imagen</button>
            </div>
          </div>
        )}
        {upload.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{upload.error}</p>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">Rotación</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => rotate(-90)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg)] transition-colors"
            >
              <RotateCcw size={16} />
              90° izquierda
            </button>
            <button
              onClick={() => rotate(90)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg)] transition-colors"
            >
              <RotateCw size={16} />
              90° derecha
            </button>
            <button
              onClick={() => rotate(180)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg)] transition-colors col-span-2"
            >
              <RotateCw size={16} />
              180°
            </button>
          </div>

          <h2 className="font-bold text-[var(--color-text)] mb-3">Voltear</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFlipH(v => !v)}
              className={[
                'flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                flipH ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]',
              ].join(' ')}
            >
              <FlipHorizontal size={16} />
              Horizontal
            </button>
            <button
              onClick={() => setFlipV(v => !v)}
              className={[
                'flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                flipV ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]',
              ].join(' ')}
            >
              <FlipVertical size={16} />
              Vertical
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleApply}
          loading={loading}
          disabled={!upload.image}
          label="Aplicar y descargar"
          className="w-full"
        />
      </div>
    </div>
  );
}
