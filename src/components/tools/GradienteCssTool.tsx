import { useState } from 'react';
import { Copy, Check, Plus, Trash2 } from 'lucide-react';

type GradType = 'linear' | 'radial';
interface Stop { color: string; position: number }

const PRESETS: { name: string; type: GradType; angle: number; stops: Stop[] }[] = [
  { name: 'Atardecer', type: 'linear', angle: 135, stops: [{ color: '#FF6B6B', position: 0 }, { color: '#FFE66D', position: 100 }] },
  { name: 'Océano', type: 'linear', angle: 90, stops: [{ color: '#2196F3', position: 0 }, { color: '#00BCD4', position: 100 }] },
  { name: 'Bosque', type: 'linear', angle: 180, stops: [{ color: '#4CAF50', position: 0 }, { color: '#1B5E20', position: 100 }] },
  { name: 'Morado', type: 'linear', angle: 135, stops: [{ color: '#9C27B0', position: 0 }, { color: '#E91E63', position: 100 }] },
  { name: 'Noche', type: 'radial', angle: 0, stops: [{ color: '#1A237E', position: 0 }, { color: '#000000', position: 100 }] },
];

function buildCSS(type: GradType, angle: number, stops: Stop[]): string {
  const stopsStr = stops.map((s) => `${s.color} ${s.position}%`).join(', ');
  if (type === 'linear') return `linear-gradient(${angle}deg, ${stopsStr})`;
  return `radial-gradient(circle, ${stopsStr})`;
}

export default function GradienteCssTool() {
  const [type, setType] = useState<GradType>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<Stop[]>([{ color: '#E84827', position: 0 }, { color: '#FFB347', position: 100 }]);
  const [copied, setCopied] = useState(false);

  const gradient = buildCSS(type, angle, stops);
  const cssOutput = `background: ${gradient};`;

  function updateStop(i: number, partial: Partial<Stop>) {
    setStops((prev) => prev.map((s, j) => j === i ? { ...s, ...partial } : s));
  }

  function addStop() {
    if (stops.length >= 5) return;
    const mid = Math.round((stops[stops.length - 2].position + stops[stops.length - 1].position) / 2);
    const newStop: Stop = { color: '#888888', position: mid };
    setStops((prev) => [...prev.slice(0, -1), newStop, prev[prev.length - 1]]);
  }

  function removeStop(i: number) {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, j) => j !== i));
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setType(p.type);
    setAngle(p.angle);
    setStops([...p.stops]);
  }

  async function copy() {
    await navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="h-40 rounded-xl border border-[var(--color-border)]" style={{ background: gradient }} />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {(['linear', 'radial'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', type === t ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
            >
              {t === 'linear' ? 'Lineal' : 'Radial'}
            </button>
          ))}
        </div>

        {type === 'linear' && (
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--color-text)]">Ángulo</label>
              <span className="text-sm font-mono font-bold text-[var(--color-accent)]">{angle}°</span>
            </div>
            <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--color-text)]">Colores ({stops.length}/5)</p>
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <label className="w-9 h-9 rounded-lg border border-[var(--color-border)] overflow-hidden cursor-pointer shrink-0">
                <input type="color" value={s.color} onChange={(e) => updateStop(i, { color: e.target.value })} className="w-full h-full border-none p-0 cursor-pointer" />
              </label>
              <span className="text-xs font-mono w-16 text-[var(--color-text-secondary)]">{s.color}</span>
              <input type="range" min={0} max={100} value={s.position} onChange={(e) => updateStop(i, { position: Number(e.target.value) })} className="flex-1 accent-[var(--color-accent)]" />
              <span className="text-xs font-mono w-8 text-[var(--color-text-muted)]">{s.position}%</span>
              {stops.length > 2 && (
                <button onClick={() => removeStop(i)} className="p-1 text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {stops.length < 5 && (
            <button onClick={addStop} className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] hover:underline">
              <Plus size={13} /> Añadir color
            </button>
          )}
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">CSS</p>
          <button onClick={copy} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <code className="text-sm font-mono text-[var(--color-text)] break-all">{cssOutput}</code>
      </div>
    </div>
  );
}
