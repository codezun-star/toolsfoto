import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function SombraCssTool() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(8);
  const [blur, setBlur] = useState(24);
  const [spread, setSpread] = useState(-4);
  const [color, setColor] = useState('#111110');
  const [opacity, setOpacity] = useState(20);
  const [inset, setInset] = useState(false);
  const [copied, setCopied] = useState(false);

  const shadow = `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity / 100)}`;
  const css = `box-shadow: ${shadow};`;

  async function copy() {
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const sliders: { label: string; value: number; set: (n: number) => void; min: number; max: number; unit: string }[] = [
    { label: 'Desplazamiento X', value: x, set: setX, min: -50, max: 50, unit: 'px' },
    { label: 'Desplazamiento Y', value: y, set: setY, min: -50, max: 50, unit: 'px' },
    { label: 'Desenfoque', value: blur, set: setBlur, min: 0, max: 100, unit: 'px' },
    { label: 'Expansión', value: spread, set: setSpread, min: -50, max: 50, unit: 'px' },
    { label: 'Opacidad', value: opacity, set: setOpacity, min: 0, max: 100, unit: '%' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-10 min-h-[280px]">
        <div className="w-40 h-40 rounded-2xl bg-white" style={{ boxShadow: shadow }} />
      </div>

      <div className="space-y-4">
        {sliders.map((s) => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <label className="font-medium text-[var(--color-text)]">{s.label}</label>
              <span className="text-[var(--color-text-secondary)]">{s.value}{s.unit}</span>
            </div>
            <input type="range" min={s.min} max={s.max} value={s.value} onChange={(e) => s.set(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
        ))}

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--color-text)]">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 rounded border border-[var(--color-border)] cursor-pointer" />
          </div>
          <button
            onClick={() => setInset((v) => !v)}
            className={['px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors', inset ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
          >
            Sombra interior (inset)
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--color-text)]">Código CSS</label>
            <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <pre className="px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] font-mono text-[var(--color-text)] overflow-x-auto">{css}</pre>
        </div>
      </div>
    </div>
  );
}
