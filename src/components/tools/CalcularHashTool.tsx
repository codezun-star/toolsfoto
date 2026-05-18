import { useState } from 'react';
import { Copy, Check, Upload } from 'lucide-react';

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
type Algorithm = typeof ALGORITHMS[number];

async function computeHash(data: ArrayBuffer, algo: Algorithm): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface HashResult { algo: Algorithm; hash: string }

export default function CalcularHashTool() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<HashResult[]>([]);
  const [computing, setComputing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function computeFromData(data: ArrayBuffer) {
    setComputing(true);
    setResults([]);
    setError(null);
    try {
      const hashes = await Promise.all(ALGORITHMS.map(async (algo) => ({ algo, hash: await computeHash(data, algo) })));
      setResults(hashes);
    } catch {
      setError('Error al calcular el hash.');
    } finally {
      setComputing(false);
    }
  }

  async function hashText() {
    if (!text.trim()) return;
    setFileName(null);
    const encoded = new TextEncoder().encode(text);
    await computeFromData(encoded.buffer);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setText('');
    const buf = await file.arrayBuffer();
    await computeFromData(buf);
  }

  async function copy(hash: string, algo: string) {
    await navigator.clipboard.writeText(hash);
    setCopied(algo);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Texto a hashear</label>
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setResults([]); setFileName(null); }}
            placeholder="Escribe el texto aquí…"
            rows={3}
            className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono resize-none"
          />
        </div>
        <button
          onClick={hashText}
          disabled={!text.trim() || computing}
          className="mt-2 w-full py-2.5 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-40"
        >
          Calcular hash del texto
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-text-muted)]">o</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      <label className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors cursor-pointer">
        <Upload size={16} />
        {fileName ? fileName : 'Subir archivo para hashear'}
        <input type="file" className="hidden" onChange={handleFile} />
      </label>

      {computing && <p className="text-sm text-center text-[var(--color-text-secondary)]">Calculando hashes…</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(({ algo, hash }) => (
            <div key={algo} className="p-3 bg-white rounded-xl border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">{algo}</span>
                <button onClick={() => copy(hash, algo)} className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                  {copied === algo ? <Check size={12} /> : <Copy size={12} />}
                  {copied === algo ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs font-mono break-all text-[var(--color-text)]">{hash}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
    </div>
  );
}
