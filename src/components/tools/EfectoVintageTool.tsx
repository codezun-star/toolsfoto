import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext, revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useState } from 'react';

type Effect = 'sepia' | 'vintage' | 'cine' | 'polaroid' | 'noir';

const EFFECTS: { id: Effect; name: string; desc: string }[] = [
  { id: 'sepia', name: 'Sepia', desc: 'Tono marrón cálido clásico' },
  { id: 'vintage', name: 'Vintage', desc: 'Faded + viñeta + tonos cálidos' },
  { id: 'cine', name: 'Cine', desc: 'Grano de película + alto contraste' },
  { id: 'polaroid', name: 'Polaroid', desc: 'Sobreexpuesto + saturación elevada' },
  { id: 'noir', name: 'Noir', desc: 'Blanco y negro + alto contraste' },
];

function applySepia(data: Uint8ClampedArray, strength: number) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const sr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    const sg = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    const sb = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    data[i] = r + (sr - r) * strength;
    data[i + 1] = g + (sg - g) * strength;
    data[i + 2] = b + (sb - b) * strength;
  }
}

function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${0.6 * strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function applyGrain(data: Uint8ClampedArray, strength: number) {
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 40 * strength;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
}

function applyBrightnessContrast(data: Uint8ClampedArray, brightness: number, contrast: number) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128 + brightness));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128 + brightness));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128 + brightness));
  }
}

export default function EfectoVintageTool() {
  const upload = useImageUpload();
  const { download } = useDownload(upload.image?.file.name);
  const [effect, setEffect] = useState<Effect>('sepia');
  const [intensity, setIntensity] = useState(80);
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
      ctx.drawImage(img, 0, 0);
      const s = intensity / 100;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;

      if (effect === 'sepia') {
        applySepia(d, s);
      } else if (effect === 'vintage') {
        applySepia(d, s * 0.5);
        applyBrightnessContrast(d, -20 * s, -30 * s);
        ctx.putImageData(imageData, 0, 0);
        applyVignette(ctx, canvas.width, canvas.height, s);
      } else if (effect === 'cine') {
        applyBrightnessContrast(d, -10 * s, 60 * s);
        applyGrain(d, s * 0.6);
      } else if (effect === 'polaroid') {
        applyBrightnessContrast(d, 30 * s, -20 * s);
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, d[i] + 15 * s);
          d[i + 2] = Math.min(255, d[i + 2] - 10 * s);
        }
      } else if (effect === 'noir') {
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const mixed = d[i] * (1 - s) + gray * s;
          const mixed2 = d[i + 1] * (1 - s) + gray * s;
          const mixed3 = d[i + 2] * (1 - s) + gray * s;
          d[i] = mixed; d[i + 1] = mixed2; d[i + 2] = mixed3;
        }
        applyBrightnessContrast(d, -10 * s, 50 * s);
      }

      if (effect !== 'vintage') ctx.putImageData(imageData, 0, 0);

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      setResultSize(blob.size);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al aplicar el efecto. Por favor, inténtalo de nuevo.');
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
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Efecto</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {EFFECTS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEffect(e.id)}
                  className={[
                    'flex flex-col px-3 py-2.5 rounded-xl border text-left transition-colors',
                    effect === e.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)]',
                  ].join(' ')}
                >
                  <span className={`text-sm font-bold ${effect === e.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{e.name}</span>
                  <span className="text-xs text-[var(--color-text-muted)] mt-0.5">{e.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <Slider label="Intensidad" value={intensity} onChange={setIntensity} min={10} max={100} step={5} unit="%" />
          <button
            onClick={process}
            disabled={processing}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-60"
          >
            {processing ? 'Aplicando efecto…' : 'Aplicar efecto'}
          </button>
        </div>
      )}

      {resultUrl && upload.image && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1 text-center">Original</p>
              <img src={upload.image.url} alt="Original" className="w-full rounded-xl border border-[var(--color-border)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1 text-center">Con efecto</p>
              <img src={resultUrl} alt="Con efecto" className="w-full rounded-xl border border-[var(--color-border)]" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
            <span>Original: <strong className="text-[var(--color-text)]">{formatBytes(upload.image.file.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <DownloadButton
            onClick={() => { if (resultBlob) download(resultBlob, 'vintage', 'jpg'); }}
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
