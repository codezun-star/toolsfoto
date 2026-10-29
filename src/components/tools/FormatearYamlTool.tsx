import { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { parseDocument, stringify } from 'yaml';
import CopyDownload from '@/components/ui/CopyDownload';
import { yamlErrorText } from '@/lib/utils/yaml-errors';

const SAMPLE = `# Configuración de ejemplo
servidor:
  host: localhost
  puerto: 8080
  tls: false
usuarios:
  - nombre: Ana
    roles: [admin, editor]
  - nombre: Luis
    roles: [lector]
`;

type Indent = 2 | 4;

/** Ordena alfabéticamente las claves de los objetos, en profundidad. */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v as Record<string, unknown>).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  }
  return v;
}

/**
 * Validador y formateador de YAML con la librería `yaml` (YAML 1.2). Muestra
 * los errores con línea y columna, y reescribe el documento con sangría
 * uniforme conservando los comentarios (salvo al ordenar claves).
 */
export default function FormatearYamlTool() {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState<Indent>(2);
  const [sorted, setSorted] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return { ok: false as const, error: '', output: '' };
    const doc = parseDocument(input, { prettyErrors: true });
    if (doc.errors.length) {
      return { ok: false as const, error: yamlErrorText(doc.errors[0]), output: '' };
    }
    const output = sorted
      ? stringify(sortKeys(doc.toJS()), { indent })
      : doc.toString({ indent, lineWidth: 0 });
    return { ok: true as const, error: '', output, warnings: doc.warnings.length };
  }, [input, indent, sorted]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="yaml-in" className="text-sm font-semibold text-[var(--color-text)]">YAML de entrada</label>
          <button onClick={() => setInput('')} className="text-xs text-[var(--color-accent)] hover:underline">Vaciar</button>
        </div>
        <textarea
          id="yaml-in"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={20}
          spellCheck={false}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-white resize-y focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="Pega aquí tu YAML…"
        />
        {result.ok && (
          <p className="flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 size={15} /> YAML válido</p>
        )}
        {result.error && (
          <p className="flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {result.error}</p>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span>Sangría</span>
            {([2, 4] as const).map((n) => (
              <button key={n} onClick={() => setIndent(n)} className={`px-2.5 py-1 rounded-lg border text-xs ${indent === n ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold' : 'border-[var(--color-border)]'}`}>{n} espacios</button>
            ))}
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} className="accent-[var(--color-accent)]" />
              Ordenar claves
            </label>
          </div>
          <CopyDownload text={result.output} filename="formateado.yaml" mime="application/yaml" />
        </div>
        <textarea
          readOnly
          value={result.output}
          rows={20}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-[var(--color-bg)] resize-y focus:outline-none"
          placeholder="Aquí aparecerá el YAML formateado"
        />
        {sorted && <p className="text-xs text-[var(--color-text-muted)]">Al ordenar las claves se pierden los comentarios del documento.</p>}
      </div>
    </div>
  );
}
