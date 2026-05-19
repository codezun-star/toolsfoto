import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

export default function MosaicoTool() {
  const upload = useImageUpload();
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  async function handleApply() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const tileW = img.naturalWidth;
      const tileH = img.naturalHeight;
      const canvas = createCanvas(tileW * cols, tileH * rows);
      const ctx = getContext(canvas);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.drawImage(img, c * tileW, r * tileH);
        }
      }
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'mosaico', 'jpg');
    } catch {
      setError('Error al procesar la imagen. Inténtalo de nuevo.');
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
          onClear={upload.clearImage}
        />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Configuración del mosaico</h2>
          <Slider label="Columnas" value={cols} min={1} max={6} step={1} onChange={setCols} />
          <Slider label="Filas" value={rows} min={1} max={6} step={1} onChange={setRows} />
          {upload.image && (
            <p className="text-xs text-[var(--color-text-muted)]">
              El resultado tendrá {cols * rows} copias ({cols} × {rows}). La imagen final medirá{' '}
              {cols} veces el ancho original por {rows} veces el alto original.
            </p>
          )}
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Vista previa ({cols}×{rows})</p>
            <div
              className="overflow-hidden rounded-lg"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '1px',
                backgroundColor: 'var(--color-border)',
                maxHeight: '200px',
              }}
            >
              {Array.from({ length: cols * rows }).map((_, i) => (
                <img
                  key={i}
                  src={upload.image!.url}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ maxHeight: `${200 / rows}px` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleApply}
          disabled={!upload.image || loading}
          loading={loading}
          className="w-full"
        />
      </div>
    </div>
  );
}
