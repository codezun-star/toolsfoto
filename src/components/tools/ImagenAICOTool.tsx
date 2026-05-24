import { useState } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { loadImage, revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';

const SIZES = [16, 32, 48, 64, 128, 256];

function uint32LE(n: number, buf: Uint8Array, off: number) {
  buf[off] = n & 0xff;
  buf[off + 1] = (n >> 8) & 0xff;
  buf[off + 2] = (n >> 16) & 0xff;
  buf[off + 3] = (n >> 24) & 0xff;
}
function uint16LE(n: number, buf: Uint8Array, off: number) {
  buf[off] = n & 0xff;
  buf[off + 1] = (n >> 8) & 0xff;
}

async function canvasToPngBytes(img: HTMLImageElement, size: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      blob!.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)));
    }, 'image/png');
  });
}

function buildICO(pngList: { size: number; data: Uint8Array }[]): Uint8Array {
  const n = pngList.length;
  const HEADER = 6;
  const ENTRY = 16;
  const dirSize = HEADER + ENTRY * n;
  const dataBlocks = pngList.map((p) => p.data);
  const totalSize = dirSize + dataBlocks.reduce((s, d) => s + d.length, 0);
  const buf = new Uint8Array(totalSize);
  // ICONDIR header
  buf[0] = 0; buf[1] = 0;   // reserved
  buf[2] = 1; buf[3] = 0;   // type: 1 = icon
  uint16LE(n, buf, 4);        // count
  let offset = dirSize;
  for (let i = 0; i < n; i++) {
    const { size, data } = pngList[i];
    const eOff = HEADER + i * ENTRY;
    buf[eOff] = size === 256 ? 0 : size;  // width (0 means 256)
    buf[eOff + 1] = size === 256 ? 0 : size; // height
    buf[eOff + 2] = 0;  // color count
    buf[eOff + 3] = 0;  // reserved
    uint16LE(1, buf, eOff + 4);  // planes
    uint16LE(32, buf, eOff + 6); // bit count
    uint32LE(data.length, buf, eOff + 8); // bytes in res
    uint32LE(offset, buf, eOff + 12);     // image offset
    buf.set(data, offset);
    offset += data.length;
  }
  return buf;
}

export default function ImagenAICOTool() {
  const { file, preview, getRootProps, getInputProps, isDragActive, clearFile } = useImageUpload();
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 48, 64]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    clearFile();
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  function toggleSize(s: number) {
    setSelectedSizes((prev) =>
      prev.includes(s) ? (prev.length > 1 ? prev.filter((x) => x !== s) : prev) : [...prev, s].sort((a, b) => a - b)
    );
  }

  async function process() {
    if (!file || !selectedSizes.length) return;
    setProcessing(true);
    setError(null);
    if (resultUrl) revokeURL(resultUrl);
    try {
      const img = await loadImage(file);
      const pngList = await Promise.all(
        selectedSizes.map(async (size) => ({ size, data: await canvasToPngBytes(img, size) }))
      );
      const ico = buildICO(pngList);
      const blob = new Blob([ico], { type: 'image/x-icon' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al generar el archivo ICO. Comprueba el formato de la imagen.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, '.ico');
    a.click();
  }

  return (
    <div className="space-y-6">
      <ImageUploader getRootProps={getRootProps} getInputProps={getInputProps} isDragActive={isDragActive} preview={preview} onClear={handleClear} />

      {file && !resultUrl && !processing && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Tamaños a incluir en el ICO</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={['px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors', selectedSizes.includes(s) ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
                >
                  {s}×{s}px
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5">Se incluirán {selectedSizes.length} tamaño{selectedSizes.length !== 1 ? 's' : ''} en un único archivo .ico</p>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Generar archivo ICO
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Generando ICO con {selectedSizes.length} tamaños…</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Tamaños: <strong>{selectedSizes.join(', ')}px</strong></span>
            <span>Tamaño: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <div className="flex gap-2">
            {selectedSizes.filter((s) => s <= 64).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <img src={resultUrl} alt={`${s}px`} width={s} height={s} className="border border-[var(--color-border)] rounded" />
                <span className="text-xs text-[var(--color-text-muted)]">{s}px</span>
              </div>
            ))}
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar .ico
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Convertir otra imagen</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
