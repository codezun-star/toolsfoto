import { useMemo, useState } from 'react';
import { Plus, Minus, PenLine, CheckCircle2, AlertCircle } from 'lucide-react';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
interface Change { kind: 'added' | 'removed' | 'changed' | 'type'; path: string; before?: Json; after?: Json }

const A = '{\n  "nombre": "toolsfoto",\n  "version": "1.4.0",\n  "dependencias": { "astro": "5.0.0", "react": "19.0.0" },\n  "autores": ["Ana", "Luis"],\n  "privado": true\n}';
const B = '{\n  "nombre": "toolsfoto",\n  "version": "2.0.0",\n  "dependencias": { "astro": "6.3.3", "react": "19.0.0", "pdf-lib": "1.17.1" },\n  "autores": ["Ana", "Luis", "Marta"],\n  "licencia": "MIT"\n}';

const kindOf = (v: Json) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
const fmt = (v: Json | undefined) => (v === undefined ? '' : JSON.stringify(v));
const key = (path: string, k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? `${path}.${k}` : `${path}[${JSON.stringify(k)}]`);

/** Diferencias estructurales entre dos valores JSON, con la ruta de cada cambio. */
function diff(a: Json, b: Json, path: string, out: Change[], ignoreOrder: boolean) {
  const ka = kindOf(a);
  const kb = kindOf(b);
  if (ka !== kb) { out.push({ kind: 'type', path, before: a, after: b }); return; }
  if (ka === 'array') {
    const aa = a as Json[];
    const bb = b as Json[];
    if (ignoreOrder) {
      const sa = aa.map((v) => JSON.stringify(v));
      const sb = bb.map((v) => JSON.stringify(v));
      sa.forEach((s, i) => { if (!sb.includes(s)) out.push({ kind: 'removed', path: `${path}[${i}]`, before: aa[i] }); });
      sb.forEach((s, i) => { if (!sa.includes(s)) out.push({ kind: 'added', path: `${path}[${i}]`, after: bb[i] }); });
      return;
    }
    const n = Math.max(aa.length, bb.length);
    for (let i = 0; i < n; i++) {
      if (i >= aa.length) out.push({ kind: 'added', path: `${path}[${i}]`, after: bb[i] });
      else if (i >= bb.length) out.push({ kind: 'removed', path: `${path}[${i}]`, before: aa[i] });
      else diff(aa[i], bb[i], `${path}[${i}]`, out, ignoreOrder);
    }
    return;
  }
  if (ka === 'object') {
    const oa = a as Record<string, Json>;
    const ob = b as Record<string, Json>;
    for (const k of Object.keys(oa)) {
      if (!(k in ob)) out.push({ kind: 'removed', path: key(path, k), before: oa[k] });
      else diff(oa[k], ob[k], key(path, k), out, ignoreOrder);
    }
    for (const k of Object.keys(ob)) if (!(k in oa)) out.push({ kind: 'added', path: key(path, k), after: ob[k] });
    return;
  }
  if (a !== b) out.push({ kind: 'changed', path, before: a, after: b });
}

const STYLE: Record<Change['kind'], { label: string; cls: string; Icon: typeof Plus }> = {
  added: { label: 'Añadido', cls: 'text-green-700 bg-green-50 border-green-200', Icon: Plus },
  removed: { label: 'Eliminado', cls: 'text-red-700 bg-red-50 border-red-200', Icon: Minus },
  changed: { label: 'Modificado', cls: 'text-amber-800 bg-amber-50 border-amber-200', Icon: PenLine },
  type: { label: 'Cambio de tipo', cls: 'text-purple-800 bg-purple-50 border-purple-200', Icon: PenLine },
};

/**
 * Compara dos JSON por estructura, no por texto: da igual el orden de las
 * claves o los espacios. Lista cada diferencia con su ruta ($.a.b[2]).
 */
export default function CompararJsonTool() {
  const [left, setLeft] = useState(A);
  const [right, setRight] = useState(B);
  const [ignoreOrder, setIgnoreOrder] = useState(false);

  const result = useMemo(() => {
    let a: Json;
    let b: Json;
    try { a = JSON.parse(left) as Json; } catch (e) { return { error: `JSON original inválido: ${(e as Error).message}` }; }
    try { b = JSON.parse(right) as Json; } catch (e) { return { error: `JSON nuevo inválido: ${(e as Error).message}` }; }
    const changes: Change[] = [];
    diff(a, b, '$', changes, ignoreOrder);
    return { changes };
  }, [left, right, ignoreOrder]);

  const area = 'w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-white resize-y focus:outline-none focus:border-[var(--color-accent)]';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="cj-a" className="text-sm font-semibold text-[var(--color-text)]">JSON original</label>
          <textarea id="cj-a" value={left} onChange={(e) => setLeft(e.target.value)} rows={14} spellCheck={false} className={area} />
        </div>
        <div className="space-y-2">
          <label htmlFor="cj-b" className="text-sm font-semibold text-[var(--color-text)]">JSON nuevo</label>
          <textarea id="cj-b" value={right} onChange={(e) => setRight(e.target.value)} rows={14} spellCheck={false} className={area} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
        <input type="checkbox" checked={ignoreOrder} onChange={(e) => setIgnoreOrder(e.target.checked)} className="accent-[var(--color-accent)]" />
        Ignorar el orden de los elementos en los arrays
      </label>

      {'error' in result && result.error && (
        <p className="flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {result.error}</p>
      )}
      {'changes' in result && result.changes && (
        result.changes.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"><CheckCircle2 size={16} /> Los dos JSON son equivalentes.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {result.changes.length} {result.changes.length === 1 ? 'diferencia' : 'diferencias'}
              <span className="font-normal text-[var(--color-text-muted)]">
                {' '}· {(['added', 'removed', 'changed', 'type'] as const).map((k) => `${result.changes.filter((c) => c.kind === k).length} ${STYLE[k].label.toLowerCase()}`).join(' · ')}
              </span>
            </p>
            <ul className="space-y-1.5">
              {result.changes.map((c, i) => {
                const { label, cls, Icon } = STYLE[c.kind];
                return (
                  <li key={i} className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 rounded-lg border text-sm ${cls}`}>
                    <span className="flex items-center gap-1 font-semibold shrink-0"><Icon size={13} /> {label}</span>
                    <code className="font-mono text-xs">{c.path}</code>
                    <span className="font-mono text-xs break-all text-[var(--color-text)]">
                      {c.kind === 'added' && fmt(c.after)}
                      {c.kind === 'removed' && fmt(c.before)}
                      {(c.kind === 'changed' || c.kind === 'type') && <>{fmt(c.before)} → {fmt(c.after)}</>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      )}
    </div>
  );
}
