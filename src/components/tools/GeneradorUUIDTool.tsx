import { useState } from 'react';
import { Copy, CheckCircle2, RefreshCw } from 'lucide-react';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function GeneradorUUIDTool() {
  const [uuids, setUuids] = useState<string[]>(() => [generateUUID()]);
  const [count, setCount] = useState(5);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);

  function format(uuid: string): string {
    let u = uuid;
    if (!hyphens) u = u.replace(/-/g, '');
    if (uppercase) u = u.toUpperCase();
    return u;
  }

  function generate() {
    setUuids(Array.from({ length: count }, generateUUID));
  }

  async function copyOne(i: number) {
    await navigator.clipboard.writeText(format(uuids[i]));
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(uuids.map(format).join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
        <h2 className="font-bold text-[var(--color-text)]">Opciones</h2>

        <div>
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">
            Cantidad a generar
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={e => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} className="accent-[var(--color-accent)] w-4 h-4" />
            <span className="text-sm text-[var(--color-text)]">Mayúsculas</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hyphens} onChange={e => setHyphens(e.target.checked)} className="accent-[var(--color-accent)] w-4 h-4" />
            <span className="text-sm text-[var(--color-text)]">Con guiones</span>
          </label>
        </div>

        <button
          onClick={generate}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
        >
          <RefreshCw size={16} />
          Generar {count} UUID{count !== 1 ? 's' : ''}
        </button>
      </div>

      {uuids.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text)]">{uuids.length} UUID{uuids.length !== 1 ? 's' : ''}</p>
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
            >
              {copiedAll ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
              {copiedAll ? 'Copiados' : 'Copiar todos'}
            </button>
          </div>
          <div className="space-y-2">
            {uuids.map((uuid, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-white border border-[var(--color-border)] rounded-xl group">
                <code className="flex-1 font-mono text-sm text-[var(--color-text)] truncate">{format(uuid)}</code>
                <button
                  onClick={() => copyOne(i)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-bg)]"
                >
                  {copiedIdx === i ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} className="text-[var(--color-text-muted)]" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
