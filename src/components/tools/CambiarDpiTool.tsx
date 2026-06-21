import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';
import { Download } from 'lucide-react';

// ── CRC32 (para chunk pHYs de PNG) ──────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function setPngDpi(buf: ArrayBuffer, dpi: number): Uint8Array {
  const src = new Uint8Array(buf);
  const ppu = Math.round(dpi / 0.0254); // píxeles por metro
  const ihdrEnd = 8 + 25; // firma(8) + IHDR(4 len + 4 tipo + 13 datos + 4 crc)
  const data = new Uint8Array(9);
  const dv = new DataView(data.buffer);
  dv.setUint32(0, ppu);
  dv.setUint32(4, ppu);
  data[8] = 1; // unidad: metros
  const type = new Uint8Array([0x70, 0x48, 0x59, 0x73]); // 'pHYs'
  const chunk = new Uint8Array(12 + 9);
  const cv = new DataView(chunk.buffer);
  cv.setUint32(0, 9);
  chunk.set(type, 4);
  chunk.set(data, 8);
  const crcInput = new Uint8Array(4 + 9);
  crcInput.set(type, 0);
  crcInput.set(data, 4);
  cv.setUint32(8 + 9, crc32(crcInput));
  const out = new Uint8Array(src.length + chunk.length);
  out.set(src.slice(0, ihdrEnd), 0);
  out.set(chunk, ihdrEnd);
  out.set(src.slice(ihdrEnd), ihdrEnd + chunk.length);
  return out;
}

function setJpegDpi(buf: ArrayBuffer, dpi: number): Uint8Array {
  const src = new Uint8Array(buf);
  // Buscar APP0 JFIF justo tras SOI
  if (src[0] === 0xff && src[1] === 0xd8 && src[2] === 0xff && src[3] === 0xe0 &&
      src[4 + 0] === 0x4a && src[4 + 1] === 0x46 && src[4 + 2] === 0x49 && src[4 + 3] === 0x46 && src[4 + 4] === 0x00) {
    const out = new Uint8Array(src);
    out[13] = 1; // unidades: puntos por pulgada
    out[14] = (dpi >> 8) & 0xff;
    out[15] = dpi & 0xff;
    out[16] = (dpi >> 8) & 0xff;
    out[17] = dpi & 0xff;
    return out;
  }
  // No hay JFIF: insertar segmento APP0 tras SOI
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
    (dpi >> 8) & 0xff, dpi & 0xff, (dpi >> 8) & 0xff, dpi & 0xff, 0x00, 0x00,
  ]);
  const out = new Uint8Array(src.length + app0.length);
  out.set(src.slice(0, 2), 0);
  out.set(app0, 2);
  out.set(src.slice(2), 2 + app0.length);
  return out;
}

const PRESETS = [72, 96, 150, 300, 600];

export default function CambiarDpiTool() {
  const upload = useImageUpload();
  const [dpi, setDpi] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  async function process() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = getContext(canvas);
      const isPng = upload.image.file.type === 'image/png';
      if (!isPng) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, isPng ? 'image/png' : 'image/jpeg', 0.95);
      const buf = await blob.arrayBuffer();
      const patched = isPng ? setPngDpi(buf, dpi) : setJpegDpi(buf, dpi);
      const outBlob = new Blob([patched.buffer], { type: isPng ? 'image/png' : 'image/jpeg' });
      const url = URL.createObjectURL(outBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${upload.image.file.name.replace(/\.[^.]+$/, '')}-${dpi}dpi.${isPng ? 'png' : 'jpg'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Error al procesar la imagen. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const printCm = dims ? { w: (dims.w / dpi * 2.54).toFixed(1), h: (dims.h / dpi * 2.54).toFixed(1) } : null;

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
        onClear={() => { upload.clearImage(); setDims(null); }}
      />

      {upload.image && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Resolución de impresión (DPI/PPP)</h2>
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setDpi(p)} className={['py-2.5 rounded-xl border text-sm font-bold transition-colors', dpi === p ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{p}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[var(--color-text)]">DPI personalizado</label>
            <input type="number" min={1} max={2400} value={dpi} onChange={(e) => setDpi(Math.max(1, Math.min(2400, Number(e.target.value) || 1)))} className="w-24 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)]" />
          </div>
          {printCm && (
            <p className="text-xs text-[var(--color-text-secondary)]">A {dpi} DPI, esta imagen ({dims!.w}×{dims!.h} px) se imprime a <strong className="text-[var(--color-text)]">{printCm.w} × {printCm.h} cm</strong>. Los píxeles no cambian, solo la densidad de impresión.</p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

      <button onClick={process} disabled={!upload.image || loading} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <Download size={18} />
        {loading ? 'Procesando…' : `Aplicar ${dpi} DPI y descargar`}
      </button>
    </div>
  );
}
