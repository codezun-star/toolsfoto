import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

const SIZES = [200, 400, 600, 800];
const CORRECTION_LEVELS = [
  { id: 'L', label: 'L — Bajo (7%)' },
  { id: 'M', label: 'M — Medio (15%)' },
  { id: 'Q', label: 'Q — Alto (25%)' },
  { id: 'H', label: 'H — Máximo (30%)' },
];

export default function GenerarQRTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('https://toolsfoto.com');
  const [size, setSize] = useState(400);
  const [correction, setCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, size, correction, fgColor, bgColor]);

  async function generate() {
    if (!text.trim() || !canvasRef.current) return;
    setError(null);
    try {
      const QRCode = (await import('qrcode')).default;
      await QRCode.toCanvas(canvasRef.current, text, {
        width: size,
        margin: 2,
        errorCorrectionLevel: correction,
        color: { dark: fgColor, light: bgColor },
      });
    } catch {
      setError('No se pudo generar el código QR. El texto puede ser demasiado largo.');
    }
  }

  function download() {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = 'qrcode.png';
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">URL o texto</label>
            <textarea
              className="w-full h-28 px-4 py-3 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://ejemplo.com o cualquier texto…"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Tamaño</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                    size === s
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-tools-border)]',
                  ].join(' ')}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Corrección de errores</p>
            <div className="space-y-1.5">
              {CORRECTION_LEVELS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCorrection(c.id as 'L' | 'M' | 'Q' | 'H')}
                  className={[
                    'w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors',
                    correction === c.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-medium'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-tools-border)]',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Color QR</label>
              <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-12 h-10 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Fondo</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-10 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            className="rounded-xl border border-[var(--color-border)] max-w-full"
            style={{ width: Math.min(size, 320), height: Math.min(size, 320) }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={download}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-40"
          >
            <Download size={18} />
            Descargar PNG
          </button>
        </div>
      </div>
    </div>
  );
}
