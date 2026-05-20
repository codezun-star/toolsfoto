import { useState, useCallback } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob } from '@/lib/utils/canvas';
import { Upload, Download } from 'lucide-react';

type GradType = 'linear' | 'radial';
type Direction = 'to bottom' | 'to right' | 'to bottom right' | 'to bottom left' | '45deg' | '135deg';

const DIRECTIONS: { label: string; value: Direction }[] = [
  { label: '↓', value: 'to bottom' },
  { label: '→', value: 'to right' },
  { label: '↘', value: 'to bottom right' },
  { label: '↙', value: 'to bottom left' },
  { label: '↗ 45°', value: '45deg' },
  { label: '↖ 135°', value: '135deg' },
];

const PRESETS: { name: string; c1: string; c2: string }[] = [
  { name: 'Amanecer', c1: '#FF6B6B', c2: '#FFE66D' },
  { name: 'Océano', c1: '#2193b0', c2: '#6dd5ed' },
  { name: 'Bosque', c1: '#56ab2f', c2: '#a8e063' },
  { name: 'Morado', c1: '#8E2DE2', c2: '#4A00E0' },
  { name: 'Noche', c1: '#0F2027', c2: '#203A43' },
];

export default function FondoDegradadoTool() {
  const { file, previewUrl, isDragging, inputRef, handleDrop, handleDragOver, handleDragLeave, handleFileChange, reset: resetUpload } = useImageUpload();
  const { download } = useDownload();
  const [gradType, setGradType] = useState<GradType>('linear');
  const [color1, setColor1] = useState('#E84827');
  const [color2, setColor2] = useState('#FFB347');
  const [direction, setDirection] = useState<Direction>('to bottom');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async () => {
    if (!file) return;
    setError(null);
    setResultUrl(null);
    setResultBlob(null);
    try {
      const img = await loadImage(file);
      const w = img.naturalWidth, h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      let grad: CanvasGradient;
      if (gradType === 'linear') {
        const angle = direction === '45deg' ? 45 : direction === '135deg' ? 135 : direction === 'to right' ? 90 : direction === 'to bottom right' ? 135 : direction === 'to bottom left' ? 225 : 180;
        const rad = (angle * Math.PI) / 180;
        const cx = w / 2, cy = h / 2;
        const len = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2;
        grad = ctx.createLinearGradient(cx - Math.sin(rad) * len, cy - Math.cos(rad) * len, cx + Math.sin(rad) * len, cy + Math.cos(rad) * len);
      } else {
        const r = Math.sqrt(w * w + h * h) / 2;
        grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
      }
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);

      const blob = await canvasToBlob(canvas, 'image/png');
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[FondoDegradado] Error:', err);
      setError('Error al aplicar el fondo degradado. Asegúrate de que el archivo es una imagen válida.');
    }
  }, [file, gradType, color1, color2, direction]);

  function handleDownload() {
    if (!resultBlob || !file) return;
    download(resultBlob, file.name.replace(/\.[^.]+$/, '_degradado.png'));
  }

  function reset() {
    resetUpload();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {!file && (
        <label
          className={['flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors', isDragging ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)]'].join(' ')}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        >
          <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><Upload size={24} /></div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">Sube una imagen</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">PNG, JPG, WebP — ideal para imágenes con transparencia</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}

      {previewUrl && file && !resultUrl && (
        <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
          <img src={previewUrl} alt="Preview" className="w-full max-h-56 object-contain bg-[var(--color-bg)]" />
          <button onClick={reset} className="absolute top-2 right-2 px-3 py-1.5 bg-white rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-red-600 transition-colors">Quitar</button>
        </div>
      )}

      {file && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {(['linear', 'radial'] as const).map((t) => (
              <button key={t} onClick={() => setGradType(t)} className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', gradType === t ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>
                {t === 'linear' ? 'Lineal' : 'Radial'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => { setColor1(p.c1); setColor2(p.c2); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Color 1</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="w-9 h-9 rounded-lg border border-[var(--color-border)] overflow-hidden">
                  <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-full h-full border-none p-0 cursor-pointer" />
                </span>
                <span className="text-sm font-mono text-[var(--color-text-secondary)]">{color1}</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Color 2</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="w-9 h-9 rounded-lg border border-[var(--color-border)] overflow-hidden">
                  <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-full h-full border-none p-0 cursor-pointer" />
                </span>
                <span className="text-sm font-mono text-[var(--color-text-secondary)]">{color2}</span>
              </label>
            </div>
          </div>

          {gradType === 'linear' && (
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Dirección</p>
              <div className="flex flex-wrap gap-2">
                {DIRECTIONS.map((d) => (
                  <button key={d.value} onClick={() => setDirection(d.value)} className={['px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors', direction === d.value ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {file && !resultUrl && (
        <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
          Aplicar fondo degradado
        </button>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <img src={resultUrl} alt="Resultado" className="w-full rounded-xl border border-[var(--color-border)]" />
          <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar PNG con degradado
          </button>
          <button onClick={() => { if (resultUrl) URL.revokeObjectURL(resultUrl); setResultUrl(null); setResultBlob(null); }} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Cambiar ajustes
          </button>
          <button onClick={reset} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Nueva imagen
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
