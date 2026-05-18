import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { createCanvas, getContext, canvasToBlob, loadImage } from '@/lib/utils/canvas';
import { Loader2, CheckCircle } from 'lucide-react';

const STEPS = [
  'Cargando modelo de IA...',
  'Analizando la imagen...',
  'Eliminando el fondo...',
  'Aplicando acabados...',
];

export default function BackgroundRemoverTool() {
  const upload = useImageUpload();
  const [result, setResult] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  async function handleRemove() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    setStepIdx(0);

    try {
      setStepIdx(0);
      const { removeBackground } = await import('@imgly/background-removal');
      setStepIdx(1);
      const blob = await removeBackground(upload.image.file, {
        progress: (key: string, cur: number, total: number) => {
          if (cur < total * 0.5) setStepIdx(2);
          else setStepIdx(3);
        },
      });
      if (result) URL.revokeObjectURL(result);
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch {
      setError('Error al eliminar el fondo. Intenta con otra imagen o comprueba tu conexión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result) return;
    try {
      const img = await loadImage(result);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = getContext(canvas);

      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      const mime = bgColor === 'transparent' ? 'image/png' : 'image/jpeg';
      const ext = bgColor === 'transparent' ? 'png' : 'jpg';
      const blob = await canvasToBlob(canvas, mime, 0.92);
      download(blob, 'sin-fondo', ext);
    } catch {
      setError('Error al descargar la imagen.');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {!result ? (
          <ImageUploader
            image={upload.image} error={upload.error} isDragging={upload.isDragging}
            onDrop={upload.onDrop} onDragOver={upload.onDragOver} onDragLeave={upload.onDragLeave}
            onFileChange={upload.onFileChange} onClear={upload.clearImage}
          />
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div
              className="relative flex items-center justify-center min-h-48 p-4"
              style={{
                background: bgColor === 'transparent'
                  ? 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 20px 20px'
                  : bgColor,
              }}
            >
              <img src={result} alt="Sin fondo" className="max-w-full max-h-72 object-contain" />
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                <CheckCircle size={12} />
                Fondo eliminado
              </div>
            </div>
            <div className="px-4 py-2 border-t border-[var(--color-border)] flex justify-between items-center">
              <button onClick={() => { URL.revokeObjectURL(result); setResult(null); upload.clearImage(); }}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                Nueva imagen
              </button>
              <button onClick={() => setResult(null)}
                className="text-xs text-[var(--color-accent)] hover:underline">
                Repetir
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {!result ? (
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
            <h2 className="font-bold text-[var(--color-text)] mb-2">Eliminación con IA</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Usa el modelo ISNet para detectar y eliminar el fondo automáticamente. El primer uso descarga el modelo (~50 MB), los siguientes son instantáneos.
            </p>
            {loading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Loader2 size={14} className="animate-spin text-[var(--color-accent)]" />
                  {STEPS[stepIdx]}
                </div>
                <div className="h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-700"
                    style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
            <h2 className="font-bold text-[var(--color-text)]">Fondo de reemplazo</h2>
            <div className="flex flex-wrap gap-2">
              {['transparent', '#ffffff', '#000000', '#ff0000', '#0000ff', '#00ff00'].map(c => (
                <button key={c} onClick={() => setBgColor(c)}
                  className={['w-9 h-9 rounded-lg border-2 transition-all',
                    bgColor === c ? 'border-[var(--color-accent)] scale-110' : 'border-[var(--color-border)]'].join(' ')}
                  style={c === 'transparent'
                    ? { background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px' }
                    : { background: c }}
                  title={c === 'transparent' ? 'Transparente (PNG)' : c}
                />
              ))}
              <input type="color" value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="h-9 w-9 rounded-lg border border-[var(--color-border)] cursor-pointer"
                title="Color personalizado" />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {bgColor === 'transparent' ? 'Se descargará como PNG con transparencia.' : 'Se descargará como JPG con el fondo seleccionado.'}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {!result ? (
          <button
            onClick={handleRemove}
            disabled={!upload.image || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-[var(--color-accent)] text-white hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Procesando...</> : 'Eliminar fondo con IA'}
          </button>
        ) : (
          <DownloadButton onClick={handleDownload} label="Descargar imagen" className="w-full" />
        )}
      </div>
    </div>
  );
}
