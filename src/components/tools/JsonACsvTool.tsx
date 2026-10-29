import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import CopyDownload from '@/components/ui/CopyDownload';

const SAMPLE = `[
  { "id": 1, "nombre": "Ana", "email": "ana@ejemplo.com", "direccion": { "ciudad": "Madrid", "cp": "28001" }, "etiquetas": ["admin", "ventas"] },
  { "id": 2, "nombre": "Luis", "email": "luis@ejemplo.com", "direccion": { "ciudad": "Sevilla", "cp": "41001" }, "activo": false }
]`;

type Delim = ',' | ';' | '\t';
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Aplana objetos anidados con notación de puntos: { a: { b: 1 } } → { "a.b": 1 }. */
function flatten(obj: Json, prefix = '', out: Record<string, string> = {}, joinArrays = true): Record<string, string> {
  if (obj === null || typeof obj !== 'object') {
    out[prefix || 'valor'] = obj === null ? '' : String(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    if (joinArrays && obj.every((v) => v === null || typeof v !== 'object')) {
      out[prefix || 'valor'] = obj.map((v) => (v === null ? '' : String(v))).join(', ');
      return out;
    }
    obj.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out, joinArrays));
    return out;
  }
  for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out, joinArrays);
  return out;
}

function cell(v: string, delim: Delim): string {
  return /["\n\r]/.test(v) || v.includes(delim) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * JSON a CSV: convierte un array de objetos (también un objeto suelto o un
 * objeto con un array dentro) en una tabla CSV. Los objetos anidados se
 * aplanan en columnas con notación de puntos y las listas de valores simples
 * se unen en una celda. Las columnas son la unión de las claves de todas las filas.
 */
export default function JsonACsvTool() {
  const [input, setInput] = useState(SAMPLE);
  const [delim, setDelim] = useState<Delim>(',');
  const [bom, setBom] = useState(true);

  const { csv, error, rows, cols } = useMemo(() => {
    if (!input.trim()) return { csv: '', error: '', rows: 0, cols: 0 };
    try {
      let data = JSON.parse(input) as Json;
      // Un objeto que envuelve un único array ({ "items": [...] }) se trata como ese array.
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const arrays = Object.values(data).filter(Array.isArray);
        data = arrays.length === 1 ? arrays[0] : [data];
      }
      const list = Array.isArray(data) ? data : [data];
      const flat = list.map((item) => flatten(item));
      const headers: string[] = [];
      for (const r of flat) for (const k of Object.keys(r)) if (!headers.includes(k)) headers.push(k);
      const lines = [headers.map((h) => cell(h, delim)).join(delim), ...flat.map((r) => headers.map((h) => cell(r[h] ?? '', delim)).join(delim))];
      return { csv: lines.join('\r\n'), error: '', rows: flat.length, cols: headers.length };
    } catch (e) {
      return { csv: '', error: `JSON inválido: ${(e as Error).message}`, rows: 0, cols: 0 };
    }
  }, [input, delim]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label htmlFor="jc-in" className="text-sm font-semibold text-[var(--color-text)]">JSON</label>
        <textarea id="jc-in" value={input} onChange={(e) => setInput(e.target.value)} rows={20} spellCheck={false}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-white resize-y focus:outline-none focus:border-[var(--color-accent)]" />
        {error && <p className="flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            Separador
            {([[',', 'Coma'], [';', 'Punto y coma'], ['\t', 'Tabulador']] as const).map(([d, l]) => (
              <button key={l} onClick={() => setDelim(d)} className={`px-2 py-1 rounded-lg border ${delim === d ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold' : 'border-[var(--color-border)]'}`}>{l}</button>
            ))}
          </div>
          <CopyDownload text={(bom ? '﻿' : '') + csv} filename="datos.csv" mime="text/csv" />
        </div>
        <textarea readOnly value={csv} rows={18} className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-[var(--color-bg)] resize-y focus:outline-none whitespace-pre" />
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>{rows} filas · {cols} columnas</span>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={bom} onChange={(e) => setBom(e.target.checked)} className="accent-[var(--color-accent)]" />
            Compatible con Excel (UTF-8 con BOM)
          </label>
        </div>
      </div>
    </div>
  );
}
