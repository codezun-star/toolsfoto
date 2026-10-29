import { useMemo, useState } from 'react';
import { ArrowLeftRight, AlertCircle } from 'lucide-react';
import { parse, stringify } from 'yaml';
import CopyDownload from '@/components/ui/CopyDownload';
import { yamlErrorText } from '@/lib/utils/yaml-errors';

type Direction = 'json-yaml' | 'yaml-json';

const SAMPLES: Record<Direction, string> = {
  'json-yaml': '{\n  "nombre": "toolsfoto",\n  "version": "2.0.0",\n  "scripts": { "dev": "astro dev", "build": "astro build" },\n  "privado": true,\n  "etiquetas": ["imagen", "pdf", "video"]\n}',
  'yaml-json': 'nombre: toolsfoto\nversion: 2.0.0\nscripts:\n  dev: astro dev\n  build: astro build\nprivado: true\netiquetas:\n  - imagen\n  - pdf\n  - video\n',
};

interface Props { initial: Direction }

/**
 * Conversor JSON ⇄ YAML con la librería `yaml`. Lo usan `/json-a-yaml` y
 * `/yaml-a-json` (prop `initial`); el botón de intercambio invierte el
 * sentido y pasa el resultado a la entrada.
 */
export default function JsonYamlTool({ initial }: Props) {
  const [dir, setDir] = useState<Direction>(initial);
  const [input, setInput] = useState(SAMPLES[initial]);
  const [indent, setIndent] = useState(2);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' };
    try {
      // Se escribe con las reglas de YAML 1.1, que entrecomillan "yes", "on",
      // fechas, etc.: así el resultado se lee igual con parsers 1.1 y 1.2.
      if (dir === 'json-yaml') return { output: stringify(JSON.parse(input), { indent, lineWidth: 0, version: '1.1' }), error: '' };
      return { output: JSON.stringify(parse(input), null, indent), error: '' };
    } catch (e) {
      return { output: '', error: dir === 'json-yaml' ? `JSON inválido: ${(e as Error).message}` : `YAML inválido. ${yamlErrorText(e)}` };
    }
  }, [input, dir, indent]);

  function swap() {
    const next: Direction = dir === 'json-yaml' ? 'yaml-json' : 'json-yaml';
    setDir(next);
    setInput(output || SAMPLES[next]);
  }

  const from = dir === 'json-yaml' ? 'JSON' : 'YAML';
  const to = dir === 'json-yaml' ? 'YAML' : 'JSON';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={swap} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)]">
          {from} <ArrowLeftRight size={15} className="text-[var(--color-accent)]" /> {to}
        </button>
        <label className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
          Sangría
          <select value={indent} onChange={(e) => setIndent(Number(e.target.value))} className="px-2 py-1 rounded-lg border border-[var(--color-border)] bg-white text-sm">
            <option value={2}>2 espacios</option>
            <option value={4}>4 espacios</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="jy-in" className="text-sm font-semibold text-[var(--color-text)]">{from}</label>
          <textarea
            id="jy-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={20}
            spellCheck={false}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-white resize-y focus:outline-none focus:border-[var(--color-accent)]"
          />
          {error && <p className="flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--color-text)]">{to}</span>
            <CopyDownload text={output} filename={dir === 'json-yaml' ? 'resultado.yaml' : 'resultado.json'} mime={dir === 'json-yaml' ? 'application/yaml' : 'application/json'} />
          </div>
          <textarea readOnly value={output} rows={20} className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-[var(--color-bg)] resize-y focus:outline-none" />
        </div>
      </div>
    </div>
  );
}
