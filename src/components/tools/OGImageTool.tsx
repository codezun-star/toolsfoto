import { useState, useRef, useEffect } from 'react';
import { Download, Upload, RefreshCw } from 'lucide-react';

const OG_W = 1200;
const OG_H = 630;

const BG_PRESETS = ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483', '#2d6a4f', '#1b4332', '#6b2d8b'];
const TEXT_COLORS = ['#FFFFFF', '#F0F0F0', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];

interface Props {
  width?: number;
  height?: number;
}

export default function OGImageTool({ width = OG_W, height = OG_H }: Props) {
  const [title, setTitle] = useState('Tu Título Aquí');
  const [subtitle, setSubtitle] = useState('subtítulo o descripción breve');
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [accentColor, setAccentColor] = useState('#e94560');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [format, setFormat] = useState<'jpg' | 'png'>('jpg');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = Math.min(1, 600 / OG_W);
    canvas.width = Math.round(OG_W * scale);
    canvas.height = Math.round(OG_H * scale);
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const s = scale;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Accent bar
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, h - 6 * s, w, 6 * s);

    // Logo
    const logoY = 50 * s;
    const logoSize = 60 * s;
    if (logoSrc) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 60 * s, logoY, logoSize, logoSize);
        drawText(ctx, w, h, s, logoY + logoSize + 10 * s);
      };
      img.src = logoSrc;
    } else {
      drawText(ctx, w, h, s, logoY);
    }
  }

  function drawText(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, startY: number) {
    ctx.fillStyle = textColor;
    const padding = 60 * s;

    // Title
    const titleSize = Math.min(72 * s, (w - padding * 2) / (Math.max(1, title.length) * 0.6));
    ctx.font = `800 ${Math.max(24 * s, titleSize)}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Word-wrap title
    const words = title.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > w - padding * 2) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);

    const titleLineH = Math.max(28 * s, titleSize * 1.2);
    const titleTotalH = lines.length * titleLineH;
    const midY = (h - titleTotalH - 40 * s) / 2;
    const titleY = Math.max(startY, midY);

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], padding, titleY + i * titleLineH);
    }

    // Subtitle
    if (subtitle) {
      ctx.font = `400 ${22 * s}px system-ui, sans-serif`;
      ctx.fillStyle = textColor + 'CC';
      ctx.fillText(subtitle.slice(0, 80), padding, titleY + titleTotalH + 24 * s);
    }
  }

  useEffect(() => { draw(); });

  function handleLogo(f: File) {
    const url = URL.createObjectURL(f);
    setLogoSrc(url);
  }

  function download() {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = OG_W;
    outputCanvas.height = OG_H;
    const ctx = outputCanvas.getContext('2d')!;
    const s = 1;
    const w = OG_W;
    const h = OG_H;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, h - 6, w, 6);

    const finalize = () => {
      ctx.fillStyle = textColor;
      const padding = 60;
      const titleSize = 72;
      ctx.font = `800 ${titleSize}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const words = title.split(' ');
      const lines: string[] = [];
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > w - padding * 2) { lines.push(line); line = word; }
        else line = test;
      }
      if (line) lines.push(line);
      const titleLineH = titleSize * 1.2;
      const titleTotalH = lines.length * titleLineH;
      const titleY = Math.max(180, (h - titleTotalH - 40) / 2);
      for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], padding, titleY + i * titleLineH);
      if (subtitle) {
        ctx.font = `400 ${28}px system-ui, sans-serif`;
        ctx.fillStyle = textColor + 'CC';
        ctx.fillText(subtitle.slice(0, 80), padding, titleY + titleTotalH + 30);
      }
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpg' ? 0.92 : undefined;
      outputCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `og-image.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }, mime, quality);
    };

    if (logoSrc) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 60, 50, 60, 60); finalize(); };
      img.src = logoSrc;
    } else {
      finalize();
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Título principal</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Subtítulo / descripción</label>
          <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={100} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Fondo</label>
          <div className="flex flex-wrap gap-1.5">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded border border-[var(--color-border)] cursor-pointer p-0.5" />
            {BG_PRESETS.map((c) => <button key={c} onClick={() => setBgColor(c)} style={{ backgroundColor: c }} className={`w-6 h-6 rounded-full border-2 ${bgColor === c ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`} />)}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Texto</label>
          <div className="flex flex-wrap gap-1.5">
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 rounded border border-[var(--color-border)] cursor-pointer p-0.5" />
            {TEXT_COLORS.map((c) => <button key={c} onClick={() => setTextColor(c)} style={{ backgroundColor: c }} className={`w-6 h-6 rounded-full border-2 ${textColor === c ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`} />)}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Acento</label>
          <div className="flex items-center gap-1.5">
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-8 h-8 rounded border border-[var(--color-border)] cursor-pointer p-0.5" />
            {['#e94560', '#00B4D8', '#06D6A0', '#FFB703', '#E040FB'].map((c) => <button key={c} onClick={() => setAccentColor(c)} style={{ backgroundColor: c }} className={`w-6 h-6 rounded-full border-2 ${accentColor === c ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`} />)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] cursor-pointer transition-colors"
          onClick={() => logoRef.current?.click()}
        >
          <Upload size={15} /> {logoSrc ? 'Cambiar logo' : 'Subir logo (opcional)'}
        </label>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleLogo(e.target.files[0]); }} />
        {logoSrc && <button onClick={() => setLogoSrc(null)} className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors">Quitar logo</button>}
        <div className="ml-auto flex gap-2">
          {(['jpg', 'png'] as const).map((f) => (
            <button key={f} onClick={() => setFormat(f)} className={['px-3 py-1.5 rounded-lg text-xs font-medium border uppercase transition-colors', format === f ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{f}</button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg)] p-2">
        <canvas ref={canvasRef} className="w-full rounded" />
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-1">Preview (escala reducida) — El archivo descargado es {OG_W}×{OG_H}px</p>
      </div>

      <div className="flex gap-3">
        <button onClick={draw} className="flex items-center gap-2 px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
          <RefreshCw size={15} /> Actualizar
        </button>
        <button onClick={download} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm">
          <Download size={16} /> Descargar {OG_W}×{OG_H} {format.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
