import { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';

const PRESETS = [
  { label: '16:9', w: 1280, h: 720 },
  { label: '1:1', w: 800, h: 800 },
  { label: '4:3', w: 1024, h: 768 },
  { label: 'OG', w: 1200, h: 630 },
  { label: 'Banner', w: 1500, h: 500 },
];

export default function PlaceholderTool() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bgColor, setBgColor] = useState('#CCCCCC');
  const [textColor, setTextColor] = useState('#888888');
  const [text, setText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayText = text.trim() || `${width}×${height}`;

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = Math.min(1, 500 / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const fontSize = Math.max(12, Math.min(48, canvas.width / 10));
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
  }

  useEffect(() => { draw(); });

  function download() {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    const fontSize = Math.max(16, Math.min(96, width / 10));
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, width / 2, height / 2);
    outputCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placeholder_${width}x${height}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  const BG_PRESETS = ['#CCCCCC', '#E8E8E8', '#4A90D9', '#5CB85C', '#D9534F', '#F5A623'];
  const TEXT_PRESETS = ['#888888', '#444444', '#FFFFFF', '#000000'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => { setWidth(p.w); setHeight(p.h); }}
            className={['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border', width === p.w && height === p.h ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
          >
            {p.label} <span className="text-xs opacity-70">{p.w}×{p.h}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Ancho (px)</label>
          <input type="number" value={width} min={1} max={5000} onChange={(e) => setWidth(Math.max(1, Math.min(5000, Number(e.target.value))))} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Alto (px)</label>
          <input type="number" value={height} min={1} max={5000} onChange={(e) => setHeight(Math.max(1, Math.min(5000, Number(e.target.value))))} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Texto personalizado (opcional)</label>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={`${width}×${height}`} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Color de fondo</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-9 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
            {BG_PRESETS.map((c) => (
              <button key={c} onClick={() => setBgColor(c)} style={{ backgroundColor: c }} className={`w-7 h-7 rounded-full border-2 transition-all ${bgColor === c ? 'border-[var(--color-accent)] scale-110' : 'border-[var(--color-border)]'}`} />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Color de texto</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-9 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
            {TEXT_PRESETS.map((c) => (
              <button key={c} onClick={() => setTextColor(c)} style={{ backgroundColor: c }} className={`w-7 h-7 rounded-full border-2 transition-all ${textColor === c ? 'border-[var(--color-accent)] scale-110' : 'border-[var(--color-border)]'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg)] flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full rounded shadow-sm" />
      </div>

      <div className="flex gap-3">
        <button onClick={draw} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
          <RefreshCw size={15} /> Actualizar
        </button>
        <button onClick={download} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm">
          <Download size={16} /> Descargar PNG ({width}×{height})
        </button>
      </div>
    </div>
  );
}
