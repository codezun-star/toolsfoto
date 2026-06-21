import { useState } from 'react';

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
type Unit = (typeof UNITS)[number];

function toBytes(value: number, unit: Unit): number {
  return value * Math.pow(1024, UNITS.indexOf(unit));
}

function fromBytes(bytes: number, unit: Unit): number {
  return bytes / Math.pow(1024, UNITS.indexOf(unit));
}

function fmt(n: number): string {
  if (!isFinite(n)) return '—';
  if (n !== 0 && (Math.abs(n) >= 1e15 || Math.abs(n) < 1e-6)) return n.toExponential(4);
  return parseFloat(n.toFixed(6)).toString();
}

export default function ConvertirBytesTool() {
  const [value, setValue] = useState('1');
  const [unit, setUnit] = useState<Unit>('MB');

  const num = parseFloat(value);
  const valid = !isNaN(num);
  const bytes = valid ? toBytes(num, unit) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Cantidad</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Unidad</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)]"
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {valid ? (
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          {UNITS.map((u, i) => (
            <div key={u} className={['flex items-center justify-between px-4 py-3 text-sm', i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-tools-bg)]', u === unit ? 'font-bold text-[var(--color-accent)]' : 'text-[var(--color-text)]'].join(' ')}>
              <span className="text-[var(--color-text-secondary)]">{u}</span>
              <span className="font-mono">{fmt(fromBytes(bytes, u))}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 text-sm bg-white border-t border-[var(--color-border)] text-[var(--color-text)]">
            <span className="text-[var(--color-text-secondary)]">bits</span>
            <span className="font-mono">{fmt(bytes * 8)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">Introduce un número válido.</p>
      )}

      <p className="text-xs text-[var(--color-text-muted)]">Se usa el sistema binario (1 KB = 1024 B), el estándar habitual en sistemas operativos y almacenamiento.</p>
    </div>
  );
}
