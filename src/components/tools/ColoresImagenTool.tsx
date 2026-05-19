import { useState, useCallback } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';
import { loadImage, revokeURL } from '@/lib/utils/canvas';
import { Copy, Check, Download } from 'lucide-react';

interface ColorEntry {
  hex: string;
  rgb: [number, number, number];
  count: number;
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rf) h = (gf - bf) / d + (gf < bf ? 6 : 0);
  else if (max === gf) h = (bf - rf) / d + 2;
  else h = (rf - gf) / d + 4;
  return [Math.round((h / 6) * 360), Math.round(s * 100), Math.round(l * 100)];
}

function quantize(r: number, g: number, b: number, bits: number): string {
  const q = 1 << (8 - bits);
  return `${Math.round(r / q) * q},${Math.round(g / q) * q},${Math.round(b / q) * q}`;
}

export default function ColoresImagenTool() {
  const upload = useImageUpload();
  const [colors, setColors] = useState<ColorEntry[]>([]);
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedFmt, setCopiedFmt] = useState<string>('');

  const analyzeColors = useCallback(async () => {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const freq: Record<string, [number, number, number, number]> = {};
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue;
        const key = quantize(data[i], data[i + 1], data[i + 2], 4);
        if (freq[key]) { freq[key][3]++; } else {
          const [r, g, b] = key.split(',').map(Number);
          freq[key] = [r, g, b, 1];
        }
      }
      const sorted = Object.values(freq).sort((a, b) => b[3] - a[3]).slice(0, count);
      setColors(sorted.map(([r, g, b, c]) => ({
        hex: rgbToHex(r, g, b),
        rgb: [r, g, b],
        count: c,
      })));
    } catch {
      setError('Error al analizar los colores de la imagen.');
    } finally {
      setLoading(false);
    }
  }, [upload.image, count]);

  function copyValue(idx: number, fmt: string, value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedIdx(idx); setCopiedFmt(fmt);
      setTimeout(() => { setCopiedIdx(null); setCopiedFmt(''); }, 1500);
    });
  }

  function downloadPalette() {
    if (colors.length === 0) return;
    const canvas = document.createElement('canvas');
    const sw = 120; const sh = 80;
    canvas.width = sw * colors.length; canvas.height = sh + 30;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#F5F3EF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    colors.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * sw, 0, sw, sh);
      ctx.fillStyle = '#111110';
      ctx.font = '11px monospace';
      ctx.fillText(c.hex, i * sw + 8, sh + 18);
    });
    canvas.toBlob(b => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement('a'); a.href = url; a.download = 'paleta.png'; a.click();
      revokeURL(url);
    }, 'image/png');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ImageUploader image={upload.image} error={upload.error} isDragging={upload.isDragging}
          onDrop={upload.onDrop} onDragOver={upload.onDragOver} onDragLeave={upload.onDragLeave}
          onFileChange={upload.onFileChange} onClear={() => { upload.clearImage(); setColors([]); }} />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Configuración</h2>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Número de colores a extraer</p>
            <div className="grid grid-cols-3 gap-2">
              {[5, 8, 12].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className={['py-2 rounded-lg text-sm font-medium border transition-colors', count === n ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}>
                  {n} colores
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button onClick={analyzeColors} disabled={!upload.image || loading}
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {loading ? 'Analizando…' : 'Extraer colores'}
        </button>
      </div>

      {colors.length > 0 && (
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-text)]">Paleta extraída ({colors.length} colores)</h2>
            <button onClick={downloadPalette} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors">
              <Download size={13} /> Descargar paleta
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {colors.map((c, i) => {
              const [h, s, l] = rgbToHsl(c.rgb[0], c.rgb[1], c.rgb[2]);
              return (
                <div key={c.hex} className="rounded-xl overflow-hidden border border-[var(--color-border)]">
                  <div className="h-20" style={{ background: c.hex }} />
                  <div className="p-3 space-y-1.5 bg-white">
                    {([
                      ['HEX', c.hex],
                      ['RGB', `rgb(${c.rgb.join(', ')})`],
                      ['HSL', `hsl(${h}, ${s}%, ${l}%)`],
                      ['CSS var', `--color-${i + 1}: ${c.hex};`],
                    ] as [string, string][]).map(([fmt, val]) => (
                      <button key={fmt} onClick={() => copyValue(i, fmt, val)}
                        className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-[var(--color-bg)] transition-colors group">
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">{fmt}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono text-[var(--color-text)] group-hover:text-[var(--color-accent)] truncate max-w-[100px]">{val}</span>
                          {copiedIdx === i && copiedFmt === fmt ? <Check size={11} className="text-green-600 shrink-0" /> : <Copy size={11} className="text-[var(--color-text-muted)] shrink-0 opacity-0 group-hover:opacity-100" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
