import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';
import { loadImage, createCanvas, getContext, canvasToBlob, revokeURL } from '@/lib/utils/canvas';
import { Download } from 'lucide-react';

interface Tile { url: string; blob: Blob; row: number; col: number }

const PRESETS: { label: string; rows: number; cols: number }[] = [
  { label: '1×3 (carrusel)', rows: 1, cols: 3 },
  { label: '3×1 (vertical)', rows: 3, cols: 1 },
  { label: '3×3 (feed)', rows: 3, cols: 3 },
  { label: '2×2', rows: 2, cols: 2 },
];

export default function DividirImagenTool() {
  const upload = useImageUpload();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearTiles() {
    setTiles((prev) => { prev.forEach((t) => revokeURL(t.url)); return []; });
  }

  async function split() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    clearTiles();
    try {
      const img = await loadImage(upload.image.url);
      const tw = Math.floor(img.naturalWidth / cols);
      const th = Math.floor(img.naturalHeight / rows);
      const out: Tile[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = createCanvas(tw, th);
          const ctx = getContext(canvas);
          ctx.drawImage(img, c * tw, r * th, tw, th, 0, 0, tw, th);
          const blob = await canvasToBlob(canvas, 'image/png');
          out.push({ url: URL.createObjectURL(blob), blob, row: r, col: c });
        }
      }
      setTiles(out);
    } catch {
      setError('Error al dividir la imagen. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function downloadTile(t: Tile) {
    const a = document.createElement('a');
    a.href = t.url;
    a.download = `parte_${t.row + 1}_${t.col + 1}.png`;
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
        onClear={() => { upload.clearImage(); clearTiles(); }}
      />

      {upload.image && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setRows(p.rows); setCols(p.cols); clearTiles(); }}
                className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', rows === p.rows && cols === p.cols ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Filas: {rows}</label>
              <input type="range" min={1} max={6} value={rows} onChange={(e) => { setRows(Number(e.target.value)); clearTiles(); }} className="w-full accent-[var(--color-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Columnas: {cols}</label>
              <input type="range" min={1} max={6} value={cols} onChange={(e) => { setCols(Number(e.target.value)); clearTiles(); }} className="w-full accent-[var(--color-accent)]" />
            </div>
          </div>
          <button onClick={split} disabled={loading} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] disabled:opacity-40 transition-colors">
            {loading ? 'Dividiendo…' : `Dividir en ${rows * cols} partes`}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

      {tiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text)]">{tiles.length} partes</p>
            <button onClick={() => tiles.forEach(downloadTile)} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
              <Download size={15} /> Descargar todas
            </button>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {tiles.map((t) => (
              <button key={`${t.row}-${t.col}`} onClick={() => downloadTile(t)} className="group relative rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]">
                <img src={t.url} alt={`Parte ${t.row + 1}-${t.col + 1}`} className="w-full h-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all">
                  <Download size={18} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
