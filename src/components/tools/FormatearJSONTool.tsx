import { useState } from 'react';
import { Copy, Download, CheckCircle2 } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

export default function FormatearJSONTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function format(spaces: number) {
    setError(null);
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, spaces));
    } catch (e) {
      setError(`JSON inválido: ${(e as Error).message}`);
      setOutput('');
    }
  }

  function minify() {
    setError(null);
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (e) {
      setError(`JSON inválido: ${(e as Error).message}`);
      setOutput('');
    }
  }

  function validate() {
    setError(null);
    try {
      JSON.parse(input);
      setError('✓ JSON válido');
      setOutput('');
    } catch (e) {
      setError(`JSON inválido: ${(e as Error).message}`);
      setOutput('');
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultado.json';
    a.click();
    revokeURL(url);
  }

  const isValid = error?.startsWith('✓');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">JSON de entrada</label>
        <textarea
          className="w-full h-56 font-mono text-sm p-4 rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-y"
          placeholder={'{\n  "clave": "valor"\n}'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => format(2)}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] transition-colors disabled:opacity-40"
        >
          Formatear (2 espacios)
        </button>
        <button
          onClick={() => format(4)}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium text-sm hover:border-[var(--color-accent)] transition-colors disabled:opacity-40"
        >
          Formatear (4 espacios)
        </button>
        <button
          onClick={minify}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium text-sm hover:border-[var(--color-accent)] transition-colors disabled:opacity-40"
        >
          Minificar
        </button>
        <button
          onClick={validate}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium text-sm hover:border-[var(--color-accent)] transition-colors disabled:opacity-40"
        >
          Validar
        </button>
      </div>

      {error && (
        <p className={`text-sm px-4 py-3 rounded-xl border ${isValid ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
          {error}
        </p>
      )}

      {output && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--color-text)]">Resultado</label>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
              >
                {copied ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={download}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
              >
                <Download size={13} />
                .json
              </button>
            </div>
          </div>
          <textarea
            readOnly
            className="w-full h-56 font-mono text-sm p-4 rounded-xl border border-[var(--color-tools-border)] bg-[var(--color-bg)] resize-y focus:outline-none"
            value={output}
          />
        </div>
      )}
    </div>
  );
}
