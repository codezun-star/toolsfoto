import { useEffect, useRef, useState } from 'react';
import { Sparkles, Download } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import ImageUploader from '@/components/ui/ImageUploader';
import { loadImage, canvasToBlob, createCanvas, getContext, revokeURL } from '@/lib/utils/canvas';
import { triggerDownload, getOutputFilename } from '@/lib/utils/download';
import { loadOrt, fetchModel, createSession, hasWebGpu } from '@/lib/utils/onnx';
import { formatDimensions } from '@/lib/utils/format';

/** Real-ESRGAN general v3 (SRVGGNetCompact, ×4, BSD-3), alojado en el propio sitio. */
const MODEL_URL = '/models/realesr-general-x4v3.onnx';
const TILE = 128;
const PAD = 10;
/** Límite de entrada en megapíxeles: con WebGPU va rápido; en CPU cada megapíxel tarda minutos. */
const MAX_MP_GPU = 2;
const MAX_MP_CPU = 0.6;

type Scale = 2 | 4;

/**
 * Mejora la calidad y la resolución de una foto con Real-ESRGAN en el
 * navegador (ONNX Runtime, WebGPU o WASM). La imagen se procesa por teselas
 * de 128 px con 10 px de solape para no disparar la memoria y para poder
 * mostrar el progreso; el solape se descarta al pegar para que no se vean
 * las costuras. El canal alfa se escala aparte con el canvas.
 */
export default function MejorarCalidadImagenTool() {
  const { image, error: uploadError, isDragging, clearImage, onDrop, onDragOver, onDragLeave, onFileChange } = useImageUpload();
  const [scale, setScale] = useState<Scale>(4);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; blob: Blob; w: number; h: number } | null>(null);
  const [split, setSplit] = useState(50);
  const resultRef = useRef<string | null>(null);

  useEffect(() => () => { if (resultRef.current) revokeURL(resultRef.current); }, []);
  useEffect(() => { setResult(null); setNotice(null); }, [image]);

  async function handleEnhance() {
    if (!image) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    setProgress(0);
    try {
      setStatus('Descargando el modelo de IA…');
      const ort = await loadOrt();
      const model = await fetchModel(MODEL_URL, (p) => setStatus(`Descargando el modelo de IA… ${Math.round(p * 100)}%`));
      setStatus('Preparando la IA…');
      const session = await createSession(model, { gpu: true });

      // Tamaño de entrada: se reduce si supera el límite para el dispositivo.
      const img = await loadImage(image.url);
      const gpu = await hasWebGpu();
      const maxPx = (gpu ? MAX_MP_GPU : MAX_MP_CPU) * 1e6;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w * h > maxPx) {
        const k = Math.sqrt(maxPx / (w * h));
        w = Math.round(w * k);
        h = Math.round(h * k);
        setNotice(`La imagen es grande: se ha procesado a ${formatDimensions(w, h)} para que tu dispositivo pueda con ella. El resultado sigue siendo ${scale} veces más grande que eso.`);
      }
      const src = createCanvas(w, h);
      const sctx = getContext(src);
      sctx.drawImage(img, 0, 0, w, h);
      const srcData = sctx.getImageData(0, 0, w, h).data;

      const out = createCanvas(w * 4, h * 4);
      const octx = getContext(out);
      const tilesX = Math.ceil(w / TILE);
      const tilesY = Math.ceil(h / TILE);
      const total = tilesX * tilesY;
      let done = 0;
      setStatus('Mejorando la imagen…');

      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          // Tesela con solape alrededor (recortado al borde de la imagen).
          const x0 = tx * TILE;
          const y0 = ty * TILE;
          const x1 = Math.min(w, x0 + TILE);
          const y1 = Math.min(h, y0 + TILE);
          const px0 = Math.max(0, x0 - PAD);
          const py0 = Math.max(0, y0 - PAD);
          const px1 = Math.min(w, x1 + PAD);
          const py1 = Math.min(h, y1 + PAD);
          const tw = px1 - px0;
          const th = py1 - py0;

          const input = new Float32Array(3 * tw * th);
          const plane = tw * th;
          for (let y = 0; y < th; y++) {
            for (let x = 0; x < tw; x++) {
              const si = ((py0 + y) * w + (px0 + x)) * 4;
              const di = y * tw + x;
              input[di] = srcData[si] / 255;
              input[plane + di] = srcData[si + 1] / 255;
              input[2 * plane + di] = srcData[si + 2] / 255;
            }
          }
          const feeds = { [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, th, tw]) };
          const res = await session.run(feeds);
          const data = res[session.outputNames[0]].data as Float32Array;
          const ow = tw * 4;
          const oplane = ow * th * 4;

          // Solo la parte interior (sin solape) va al resultado.
          const cx = (x0 - px0) * 4;
          const cy = (y0 - py0) * 4;
          const cw = (x1 - x0) * 4;
          const ch = (y1 - y0) * 4;
          const tile = octx.createImageData(cw, ch);
          for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
              const si = (cy + y) * ow + (cx + x);
              const di = (y * cw + x) * 4;
              tile.data[di] = Math.max(0, Math.min(255, data[si] * 255));
              tile.data[di + 1] = Math.max(0, Math.min(255, data[oplane + si] * 255));
              tile.data[di + 2] = Math.max(0, Math.min(255, data[2 * oplane + si] * 255));
              tile.data[di + 3] = 255;
            }
          }
          octx.putImageData(tile, x0 * 4, y0 * 4);
          done++;
          setProgress(Math.round((done / total) * 100));
        }
      }
      await session.release();

      // Transparencia: el modelo solo ve RGB; el alfa se escala con el canvas.
      const hasAlpha = srcData.some((v, i) => i % 4 === 3 && v < 255);
      if (hasAlpha) {
        const alpha = createCanvas(w * 4, h * 4);
        const actx = getContext(alpha);
        actx.imageSmoothingQuality = 'high';
        actx.drawImage(src, 0, 0, w * 4, h * 4);
        const a = actx.getImageData(0, 0, w * 4, h * 4).data;
        const o = octx.getImageData(0, 0, w * 4, h * 4);
        for (let i = 3; i < o.data.length; i += 4) o.data[i] = a[i];
        octx.putImageData(o, 0, 0);
      }

      let final = out;
      if (scale === 2) {
        final = createCanvas(w * 2, h * 2);
        const fctx = getContext(final);
        fctx.imageSmoothingQuality = 'high';
        fctx.drawImage(out, 0, 0, w * 2, h * 2);
      }
      const blob = await canvasToBlob(final, 'image/png');
      if (resultRef.current) revokeURL(resultRef.current);
      const url = URL.createObjectURL(blob);
      resultRef.current = url;
      setResult({ url, blob, w: final.width, h: final.height });
    } catch (err) {
      console.error('[MejorarCalidadImagenTool] Error:', err);
      setError('No se ha podido mejorar la imagen. Si es muy grande, prueba con una más pequeña; si es la primera vez, comprueba tu conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImageUploader
          image={image}
          error={uploadError}
          isDragging={isDragging}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onFileChange={onFileChange}
          onClear={clearImage}
        />
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Aumento</p>
            <div className="flex gap-2">
              {([2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`flex-1 px-3 py-2.5 rounded-lg border text-sm ${scale === s ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-semibold' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                >
                  ×{s}{image ? ` · ${formatDimensions(image.width * s, image.height * s)}` : ''}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              La IA reconstruye detalle, quita el desenfoque, el ruido y los bloques de compresión del JPG.
            </p>
          </div>
          <button
            onClick={handleEnhance}
            disabled={!image || loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles size={16} />
            {loading ? status : 'Mejorar con IA'}
          </button>
          {loading && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                La primera vez descarga el modelo (5 MB). Con tarjeta gráfica compatible tarda segundos; sin ella, hasta un par de minutos.
              </p>
            </div>
          )}
          {notice && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{notice}</p>}
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>

      {result && image && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#F8F8F8] select-none">
            <img src={result.url} alt="Imagen mejorada" className="block w-full h-auto" />
            <img
              src={image.url}
              alt="Imagen original"
              className="absolute inset-0 w-full h-full object-fill"
              style={{ clipPath: `inset(0 ${100 - split}% 0 0)`, imageRendering: 'auto' }}
            />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }} />
            <span className="absolute top-2 left-2 text-xs font-semibold bg-black/60 text-white px-2 py-0.5 rounded">Original</span>
            <span className="absolute top-2 right-2 text-xs font-semibold bg-[var(--color-accent)] text-white px-2 py-0.5 rounded">Mejorada</span>
            <input
              type="range" min={0} max={100} value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              aria-label="Comparar original y mejorada"
            />
          </div>
          <button
            onClick={() => triggerDownload(result.blob, getOutputFilename(image.file.name, `mejorada-x${scale}`, 'png'))}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-text)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Download size={16} />
            Descargar PNG · {formatDimensions(result.w, result.h)}
          </button>
        </div>
      )}
    </div>
  );
}
