import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';
import { Lock, Unlock } from 'lucide-react';

type Mode = 'pixels' | 'percent';

export default function ResizerTool() {
  const upload = useImageUpload();
  const [mode, setMode] = useState<Mode>('pixels');
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [percent, setPercent] = useState<number>(100);
  const [locked, setLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  useEffect(() => {
    if (upload.image) {
      setWidth(upload.image.width);
      setHeight(upload.image.height);
    }
  }, [upload.image]);

  function handleWidthChange(val: number) {
    setWidth(val);
    if (locked && upload.image) {
      setHeight(Math.round(val * (upload.image.height / upload.image.width)));
    }
  }

  function handleHeightChange(val: number) {
    setHeight(val);
    if (locked && upload.image) {
      setWidth(Math.round(val * (upload.image.width / upload.image.height)));
    }
  }

  async function handleResize() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      let targetW: number, targetH: number;
      if (mode === 'percent') {
        targetW = Math.round(upload.image.width * (percent / 100));
        targetH = Math.round(upload.image.height * (percent / 100));
      } else {
        targetW = width;
        targetH = height;
      }
      if (targetW < 1 || targetH < 1) throw new Error('Las dimensiones deben ser mayores a 0.');

      const img = await loadImage(upload.image.url);
      const canvas = createCanvas(targetW, targetH);
      const ctx = getContext(canvas);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const blob = await canvasToBlob(canvas, upload.image.file.type);
      const ext = upload.image.file.name.split('.').pop() ?? 'png';
      download(blob, 'redimensionada', ext);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al redimensionar la imagen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">Configuración</h2>

          <div className="flex gap-2 mb-5">
            {(['pixels', 'percent'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={[
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                  mode === m
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]',
                ].join(' ')}
              >
                {m === 'pixels' ? 'Píxeles' : 'Porcentaje'}
              </button>
            ))}
          </div>

          {mode === 'pixels' ? (
            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium text-[var(--color-text)]">Ancho (px)</label>
                  <input
                    type="number"
                    value={width}
                    min={1}
                    onChange={e => handleWidthChange(Number(e.target.value))}
                    disabled={!upload.image}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-white focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-40"
                  />
                </div>
                <button
                  onClick={() => setLocked(l => !l)}
                  className="mb-0.5 p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
                  title={locked ? 'Desbloquear proporción' : 'Bloquear proporción'}
                >
                  {locked ? <Lock size={16} className="text-[var(--color-accent)]" /> : <Unlock size={16} className="text-[var(--color-text-muted)]" />}
                </button>
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium text-[var(--color-text)]">Alto (px)</label>
                  <input
                    type="number"
                    value={height}
                    min={1}
                    onChange={e => handleHeightChange(Number(e.target.value))}
                    disabled={!upload.image}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-white focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">Escala: {percent}%</label>
              <input
                type="range"
                min={1}
                max={400}
                value={percent}
                onChange={e => setPercent(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
              {upload.image && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Resultado: {Math.round(upload.image.width * percent / 100)} × {Math.round(upload.image.height * percent / 100)} px
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleResize}
          loading={loading}
          disabled={!upload.image}
          label="Redimensionar y descargar"
          className="w-full"
        />
      </div>
    </div>
  );
}
