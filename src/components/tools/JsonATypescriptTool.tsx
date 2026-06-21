import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function pascalCase(key: string): string {
  const c = key.replace(/[^a-zA-Z0-9]+(.)?/g, (_, ch) => (ch ? ch.toUpperCase() : ''));
  return c.charAt(0).toUpperCase() + c.slice(1) || 'Item';
}

function safeKey(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function generate(root: Json, rootName: string): string {
  const interfaces: string[] = [];
  const seen = new Set<string>();

  function typeOf(value: Json, nameHint: string): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]';
      const itemTypes = Array.from(new Set(value.map((v) => typeOf(v, nameHint))));
      const inner = itemTypes.length === 1 ? itemTypes[0] : `(${itemTypes.join(' | ')})`;
      return `${inner}[]`;
    }
    if (typeof value === 'object') return buildInterface(value, nameHint);
    return typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string';
  }

  function buildInterface(obj: { [key: string]: Json }, nameHint: string): string {
    let name = pascalCase(nameHint);
    let n = name;
    let i = 2;
    while (seen.has(n)) { n = name + i; i++; }
    name = n;
    seen.add(name);
    const lines = Object.entries(obj).map(([k, v]) => `  ${safeKey(k)}: ${typeOf(v, k)};`);
    interfaces.push(`interface ${name} {\n${lines.join('\n')}\n}`);
    return name;
  }

  if (root === null || typeof root !== 'object' || Array.isArray(root)) {
    return `type ${pascalCase(rootName)} = ${typeOf(root, rootName)};`;
  }
  buildInterface(root, rootName);
  return interfaces.reverse().join('\n\n');
}

export default function JsonATypescriptTool() {
  const [input, setInput] = useState('');
  const [name, setName] = useState('Root');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function convert() {
    setError(null);
    if (!input.trim()) { setOutput(''); return; }
    try {
      const parsed = JSON.parse(input) as Json;
      setOutput(generate(parsed, name.trim() || 'Root'));
    } catch {
      setOutput('');
      setError('El JSON no es válido. Revisa la sintaxis.');
    }
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">JSON de entrada</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{ "id": 1, "nombre": "Ana", "activo": true }'
            rows={8}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Nombre raíz</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono"
          />
          <button
            onClick={convert}
            className="w-full mt-3 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm"
          >
            Convertir
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

      {output && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--color-text)]">Interfaces TypeScript</label>
            <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <pre className="px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] font-mono text-[var(--color-text)] overflow-x-auto whitespace-pre">{output}</pre>
        </div>
      )}
    </div>
  );
}
