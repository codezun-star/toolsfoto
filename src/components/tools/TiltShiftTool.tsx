import { useState } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { loadImage, canvasToBlob, revokeURL } from '@/lib/utils/canvas';
import { triggerDownload } from '@/lib/utils/download';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';

export default function TiltShiftTool() {
  const upload = useImageUpload();
  const [blurAmount, setBlurAmount] = useState(12);
  const [focusCenter, setFocusCenter] = useState(50);
  const [focusSize, setFocusSize] = useState(30);
  const [saturation, setSaturation] = useState(140);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    upload.clearImage();
    setResultUrl(null);
    setResultBlob(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!upload.image) return;
    setProcessing(true);
    setError(null);
    if (resultUrl) revokeURL(resultUrl);
    try {
      const img = await loadImage(upload.image.url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // Step 1: apply saturation boost to base
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = w;
      baseCanvas.height = h;
      const baseCtx = baseCanvas.getContext('2d')!;
      baseCtx.filter = `saturate(${saturation}%)`;
      baseCtx.drawImage(img, 0, 0);
      baseCtx.filter = 'none';

      // Step 2: blurred version with padding to avoid dark edges
      const pad = blurAmount * 3;
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = w + pad * 2;
      blurCanvas.height = h + pad * 2;
      const blurCtx = blurCanvas.getContext('2d')!;
      blurCtx.filter = `saturate(${saturation}%) blur(${blurAmount}px)`;
      blurCtx.drawImage(img, pad, pad);
      blurCtx.filter = 'none';

      // Step 3: composite — blurred base, sharp band on top
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d')!;

      ctx.drawImage(blurCanvas, -pad, -pad, w + pad * 2, h + pad * 2, 0, 0, w, h);

      const focusY = (focusCenter / 100) * h;
      const halfBand = (focusSize / 100) * h * 0.5;
      const topEdge = focusY - halfBand;
      const botEdge = focusY + halfBand;
      const feather = Math.max(20, halfBand * 0.6);

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = w;
      maskCanvas.height = h;
      const maskCtx = maskCanvas.getContext('2d')!;
      const maskGrad = maskCtx.createLinearGradient(0, topEdge - feather, 0, botEdge + feather);
      maskGrad.addColorStop(0, 'rgba(0,0,0,0)');
      maskGrad.addColorStop(0.3, 'rgba(0,0,0,1)');
      maskGrad.addColorStop(0.7, 'rgba(0,0,0,1)');
      maskGrad.addColorStop(1, 'rgba(0,0,0,0)');
      maskCtx.fillStyle = maskGrad;
      maskCtx.fillRect(0, 0, w, h);

      const sharpCanvas = document.createElement('canvas');
      sharpCanvas.width = w;
      sharpCanvas.height = h;
      const sharpCtx = sharpCanvas.getContext('2d')!;
      sharpCtx.drawImage(baseCanvas, 0, 0);
      sharpCtx.globalCompositeOperation = 'destination-in';
      sharpCtx.drawImage(maskCanvas, 0, 0);

      ctx.drawImage(sharpCanvas, 0, 0);

      const blob = await canvasToBlob(out, 'image/jpeg', 0.92);
      setResultBlob(blob);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al aplicar el efecto tilt-shift. Comprueba el formato de la imagen.');
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!resultBlob || !upload.image) return;
    triggerDownload(resultBlob, upload.image.file.name.replace(/\.[^.]+$/, '_tiltshift.jpg'));
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
              <label className="text-sm font-semibold text-[var(--color-text)]">Intensidad del desenfoque</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{blurAmount}px</span>
            </div>
            <input type="range" min={4} max={30} value={blurAmount} onChange={(e) => setBlurAmount(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Centro del foco</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{focusCenter}%</span>
            </div>
            <input type="range" min={10} max={90} value={focusCenter} onChange={(e) => setFocusCenter(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Tamaño de la banda nítida</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{focusSize}%</span>
            </div>
            <input type="range" min={5} max={60} value={focusSize} onChange={(e) => setFocusSize(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Saturación (efecto miniatura)</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{saturation}%</span>
            </div>
            <input type="range" min={80} max={200} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Aplicar tilt-shift
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Aplicando efecto miniatura…</p>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <img src={resultUrl} alt="Tilt-shift" className="w-full rounded-xl border border-[var(--color-border)]" />
          <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-3">
            <p className="text-sm">Tamaño: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
            <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
              <Download size={18} /> Descargar JPG
            </button>
            <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otra imagen</button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
