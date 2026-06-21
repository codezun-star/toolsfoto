import { useState } from 'react';

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace('#', '');
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(m)) return null;
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function ratio(c1: string, c2: string): number | null {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  if (!a || !b) return null;
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function Badge({ pass }: { pass: boolean }) {
  return (
    <span className={['inline-block px-2 py-0.5 rounded-md text-xs font-bold', pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'].join(' ')}>
      {pass ? 'Pasa' : 'Falla'}
    </span>
  );
}

export default function ContrasteColorTool() {
  const [fg, setFg] = useState('#111110');
  const [bg, setBg] = useState('#F5F3EF');

  const r = ratio(fg, bg);
  const valid = r !== null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Color del texto</label>
          <div className="flex gap-2">
            <input type="color" value={hexToRgb(fg) ? fg : '#000000'} onChange={(e) => setFg(e.target.value)} className="h-10 w-12 rounded-lg border border-[var(--color-border)] cursor-pointer" />
            <input value={fg} onChange={(e) => setFg(e.target.value)} className="flex-1 px-3 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Color de fondo</label>
          <div className="flex gap-2">
            <input type="color" value={hexToRgb(bg) ? bg : '#ffffff'} onChange={(e) => setBg(e.target.value)} className="h-10 w-12 rounded-lg border border-[var(--color-border)] cursor-pointer" />
            <input value={bg} onChange={(e) => setBg(e.target.value)} className="flex-1 px-3 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono" />
          </div>
        </div>
      </div>

      {valid ? (
        <>
          <div className="rounded-xl border border-[var(--color-border)] p-6 text-center" style={{ background: bg, color: fg }}>
            <p className="text-2xl font-extrabold">Texto de ejemplo grande</p>
            <p className="text-sm mt-1">Este es un texto normal de muestra para evaluar la legibilidad.</p>
          </div>

          <div className="text-center">
            <p className="text-4xl font-extrabold text-[var(--color-text)]">{r.toFixed(2)}:1</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Ratio de contraste</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--color-border)] p-4 space-y-2">
              <p className="text-sm font-bold text-[var(--color-text)]">Texto normal</p>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">AA (4.5:1)</span><Badge pass={r >= 4.5} /></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">AAA (7:1)</span><Badge pass={r >= 7} /></div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] p-4 space-y-2">
              <p className="text-sm font-bold text-[var(--color-text)]">Texto grande</p>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">AA (3:1)</span><Badge pass={r >= 3} /></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">AAA (4.5:1)</span><Badge pass={r >= 4.5} /></div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">Introduce dos colores HEX válidos (ej: #1a1a1a o #abc).</p>
      )}
    </div>
  );
}
