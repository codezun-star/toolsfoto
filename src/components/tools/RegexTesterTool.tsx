import { useState, useMemo } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [testText, setTestText] = useState('');
  const [copied, setCopied] = useState(false);

  const flagStr = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join('');

  const result = useMemo(() => {
    if (!pattern || !testText) return null;
    try {
      const regex = new RegExp(pattern, flagStr);
      const matches: Array<{ index: number; length: number; value: string; groups: Record<string, string> | null }> = [];
      if (flags.g) {
        let m: RegExpExecArray | null;
        while ((m = regex.exec(testText)) !== null) {
          matches.push({ index: m.index, length: m[0].length, value: m[0], groups: m.groups ?? null });
          if (m[0].length === 0) regex.lastIndex++;
        }
      } else {
        const m = regex.exec(testText);
        if (m) matches.push({ index: m.index, length: m[0].length, value: m[0], groups: m.groups ?? null });
      }
      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: (e as Error).message };
    }
  }, [pattern, flagStr, testText, flags.g]);

  function highlightText(): JSX.Element[] {
    if (!result || result.matches.length === 0 || result.error) return [<span key={0}>{testText}</span>];
    const parts: JSX.Element[] = [];
    let last = 0;
    result.matches.forEach((m, i) => {
      if (m.index > last) parts.push(<span key={`t${i}`}>{testText.slice(last, m.index)}</span>);
      parts.push(<mark key={`m${i}`} className="bg-yellow-200 rounded px-0.5">{testText.slice(m.index, m.index + m.length)}</mark>);
      last = m.index + m.length;
    });
    if (last < testText.length) parts.push(<span key="end">{testText.slice(last)}</span>);
    return parts;
  }

  async function copyPattern() {
    await navigator.clipboard.writeText(`/${pattern}/${flagStr}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Expresión regular</label>
            <div className="flex items-center border border-[var(--color-border)] rounded-xl bg-white overflow-hidden focus-within:border-[var(--color-accent)]">
              <span className="px-3 text-[var(--color-text-muted)] text-lg font-mono select-none">/</span>
              <input
                type="text"
                value={pattern}
                onChange={e => setPattern(e.target.value)}
                placeholder="patrón..."
                spellCheck={false}
                className="flex-1 py-2.5 font-mono text-sm focus:outline-none"
              />
              <span className="px-3 text-[var(--color-text-muted)] text-lg font-mono select-none">/</span>
              <span className="pr-3 text-sm font-mono text-[var(--color-accent)]">{flagStr || ' '}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Flags</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(flags) as Array<keyof typeof flags>).map(f => (
                <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flags[f]}
                    onChange={e => setFlags(prev => ({ ...prev, [f]: e.target.checked }))}
                    className="accent-[var(--color-accent)] w-4 h-4"
                  />
                  <span className="font-mono text-sm font-bold text-[var(--color-text)]">{f}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {f === 'g' ? '(global)' : f === 'i' ? '(sin may/min)' : f === 'm' ? '(multilínea)' : '(punto=todo)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {pattern && (
            <button
              onClick={copyPattern}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
            >
              {copied ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar regex'}
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Texto de prueba</label>
          <textarea
            value={testText}
            onChange={e => setTestText(e.target.value)}
            placeholder="Escribe el texto que quieres analizar..."
            spellCheck={false}
            className="w-full h-40 font-mono text-sm p-4 rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-y"
          />
        </div>
      </div>

      {result?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Error en la regex: {result.error}
        </p>
      )}

      {result && !result.error && testText && (
        <div className="space-y-4">
          <div className={`px-4 py-3 rounded-xl border text-sm font-medium ${result.matches.length > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
            {result.matches.length > 0
              ? `${result.matches.length} coincidencia${result.matches.length !== 1 ? 's' : ''} encontrada${result.matches.length !== 1 ? 's' : ''}`
              : 'Sin coincidencias'}
          </div>

          {result.matches.length > 0 && (
            <>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Coincidencias resaltadas</p>
                <div className="p-4 bg-white border border-[var(--color-border)] rounded-xl font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {highlightText()}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Detalle de coincidencias</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.matches.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white border border-[var(--color-border)] rounded-lg text-sm">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-white text-xs font-bold shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-[var(--color-text)]">"{m.value}"</span>
                        <span className="text-[var(--color-text-muted)] ml-2">pos. {m.index}–{m.index + m.length}</span>
                        {m.groups && Object.keys(m.groups).length > 0 && (
                          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            Grupos: {JSON.stringify(m.groups)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
