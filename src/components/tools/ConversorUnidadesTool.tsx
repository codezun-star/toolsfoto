import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Category = 'Longitud' | 'Masa' | 'Temperatura' | 'Área' | 'Velocidad' | 'Volumen' | 'Datos' | 'Tiempo';

interface UnitDef { label: string; toBase: (v: number) => number; fromBase: (v: number) => number }

const UNITS: Record<Category, UnitDef[]> = {
  Longitud: [
    { label: 'Metros (m)', toBase: (v) => v, fromBase: (v) => v },
    { label: 'Kilómetros (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: 'Centímetros (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { label: 'Milímetros (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: 'Millas (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    { label: 'Yardas (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    { label: 'Pies (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { label: 'Pulgadas (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  ],
  Masa: [
    { label: 'Kilogramos (kg)', toBase: (v) => v, fromBase: (v) => v },
    { label: 'Gramos (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: 'Miligramos (mg)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    { label: 'Toneladas (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: 'Libras (lb)', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    { label: 'Onzas (oz)', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
  ],
  Temperatura: [
    { label: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
    { label: 'Fahrenheit (°F)', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
    { label: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  Área: [
    { label: 'Metros² (m²)', toBase: (v) => v, fromBase: (v) => v },
    { label: 'Kilómetros² (km²)', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    { label: 'Centímetros² (cm²)', toBase: (v) => v / 1e4, fromBase: (v) => v * 1e4 },
    { label: 'Hectáreas (ha)', toBase: (v) => v * 1e4, fromBase: (v) => v / 1e4 },
    { label: 'Acres (ac)', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    { label: 'Pies² (ft²)', toBase: (v) => v * 0.0929, fromBase: (v) => v / 0.0929 },
  ],
  Velocidad: [
    { label: 'Metros/seg (m/s)', toBase: (v) => v, fromBase: (v) => v },
    { label: 'Kilómetros/h (km/h)', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    { label: 'Millas/h (mph)', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    { label: 'Nudos (kn)', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
  ],
  Volumen: [
    { label: 'Litros (L)', toBase: (v) => v, fromBase: (v) => v },
    { label: 'Mililitros (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: 'Metros³ (m³)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: 'Galones US (gal)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    { label: 'Fl oz (US)', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    { label: 'Tazas (cup)', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
  ],
  Datos: [
    { label: 'Bytes (B)', toBase: (v) => v, fromBase: (v) => v },
    { label: 'Kilobytes (KB)', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    { label: 'Megabytes (MB)', toBase: (v) => v * 1024 ** 2, fromBase: (v) => v / 1024 ** 2 },
    { label: 'Gigabytes (GB)', toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
    { label: 'Terabytes (TB)', toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 },
  ],
  Tiempo: [
    { label: 'Segundos (s)', toBase: (v) => v, fromBase: (v) => v },
    { label: 'Minutos (min)', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    { label: 'Horas (h)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    { label: 'Días (d)', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    { label: 'Semanas (sem)', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    { label: 'Años (año)', toBase: (v) => v * 31557600, fromBase: (v) => v / 31557600 },
  ],
};

const CATEGORIES = Object.keys(UNITS) as Category[];

function formatResult(n: number): string {
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(6);
  return parseFloat(n.toPrecision(10)).toString();
}

export default function ConversorUnidadesTool() {
  const [category, setCategory] = useState<Category>('Longitud');
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [input, setInput] = useState('1');
  const [copied, setCopied] = useState(false);

  const units = UNITS[category];
  const numIn = parseFloat(input);
  const result = isNaN(numIn) ? '' : formatResult(units[toIdx].fromBase(units[fromIdx].toBase(numIn)));

  function swap() {
    setFromIdx(toIdx);
    setToIdx(fromIdx);
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleCategoryChange(c: Category) {
    setCategory(c);
    setFromIdx(0);
    setToIdx(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => handleCategoryChange(c)}
            className={['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', category === c ? 'bg-[var(--color-accent)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">De</label>
          <div className="flex gap-3">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)] font-mono"
              placeholder="0"
            />
            <select
              value={fromIdx}
              onChange={(e) => setFromIdx(Number(e.target.value))}
              className="flex-[2] px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)] bg-white"
            >
              {units.map((u, i) => <option key={i} value={i}>{u.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={swap}
            className="px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
          >
            ↕ Intercambiar
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">A</label>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--color-tools-border)] bg-[var(--color-tools-bg)] font-mono text-sm text-[var(--color-accent)] font-bold">
              {result || '—'}
            </div>
            <select
              value={toIdx}
              onChange={(e) => setToIdx(Number(e.target.value))}
              className="flex-[2] px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)] bg-white"
            >
              {units.map((u, i) => <option key={i} value={i}>{u.label}</option>)}
            </select>
          </div>
        </div>

        {result && (
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
            {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            {copied ? 'Copiado' : 'Copiar resultado'}
          </button>
        )}
      </div>

      {result && (
        <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)] text-sm text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text)]">{input || '0'} {units[fromIdx].label}</strong>
          {' = '}
          <strong className="text-[var(--color-accent)]">{result} {units[toIdx].label}</strong>
        </div>
      )}
    </div>
  );
}
