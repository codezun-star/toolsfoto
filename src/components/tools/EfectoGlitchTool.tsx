import { useState, useCallback } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { loadImage, canvasToBlob, revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';

export default function EfectoGlitchTool() {
  const upload = useImageUpload();
  const [intensity, setIntensity] = useState(10);
  const [slices, setSlices] = useState(8);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    upload.clearImage();
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  const applyGlitch = useCallback(async (seed: number) => {
    if (!upload.image) return;
    setProcessing(true);
    setError(null);
    if (resultUrl) revokeURL(resultUrl);
    try {
      const img = await loadImage(upload.image.url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const src = ctx.getImageData(0, 0, w, h);
      const dst = ctx.createImageData(w, h);
      dst.data.set(src.data);

      const shift = Math.round(w * intensity / 100);
      const rng = (n: number) => Math.abs(Math.sin(seed * 9301 + n * 49297 + 233) * 0.5 + 0.5);

      // RGB channel shift
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const rx = ((x + shift) % w + w) % w;
          const bx = ((x - shift) % w + w) % w;
          const ri = (y * w + rx) * 4;
          const bi = (y * w + bx) * 4;
          dst.data[i] = src.data[ri];         // R shifted right
          dst.data[i + 2] = src.data[bi + 2]; // B shifted left
        }
      }

      // Horizontal slice glitch
      for (let s = 0; s < slices; s++) {
        const sliceY = Math.floor(rng(s * 3) * h);
        const sliceH = Math.max(1, Math.floor(rng(s * 3 + 1) * (h / 10)));
        const sliceShift = Math.floor((rng(s * 3 + 2) - 0.5) * shift * 2);
        for (let y = sliceY; y < Math.min(h, sliceY + sliceH); y++) {
          for (let x = 0; x < w; x++) {
            const srcX = ((x - sliceShift) % w + w) % w;
            const i = (y * w + x) * 4;
            const si = (y * w + srcX) * 4;
            dst.data[i] = src.data[si];
            dst.data[i + 1] = src.data[si + 1];
            dst.data[i + 2] = src.data[si + 2];
            dst.data[i + 3] = src.data[si + 3];
          }
        }
      }

      ctx.putImageData(dst, 0, 0);
      const blob = await canvasToBlob(canvas, 'image/png');
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al aplicar el efecto glitch. Comprueba el formato de la imagen.');
    } finally {
      setProcessing(false);
    }
  }, [upload.image, intensity, slices, resultUrl]);

  async function process() { await applyGlitch(Date.now()); }

  function handleDownload() {
    if (!resultUrl || !upload.image) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = upload.image.file.name.replace(/\.[^.]+$/, '_glitch.png');
    a.click();
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

      {upload.image && !resultUrl && !processing && (
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Intensidad del desplazamiento</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{intensity}%</span>
            </div>
            <input type="range" min={2} max={30} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Cortes horizontales</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{slices}</span>
            </div>
            <input type="range" min={0} max={20} value={slices} onChange={(e) => setSlices(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Aplicar efecto glitch
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Aplicando distorsión…</p>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <img src={resultUrl} alt="Efecto glitch" className="w-full rounded-xl border border-[var(--color-border)]" />
          <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-3">
            <p className="text-sm">Tamaño: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
            <div className="flex gap-3">
              <button onClick={() => applyGlitch(Date.now())} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
                <RefreshCw size={15} /> Nueva variación
              </button>
              <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm">
                <Download size={16} /> Descargar PNG
              </button>
            </div>
            <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otra imagen</button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
