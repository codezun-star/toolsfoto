import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

type Mode = 'csv-json' | 'json-csv';

function csvToJson(csv: string): string {
  const lines = csv.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('El CSV debe tener al menos una fila de cabecera y una de datos.');
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] ?? '').trim(); });
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function jsonToCsv(json: string): string {
  const data = JSON.parse(json);
  if (!Array.isArray(data) || data.length === 0) throw new Error('El JSON debe ser un array de objetos.');
  const headers = Object.keys(data[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = data.map((row: Record<string, unknown>) => headers.map((h) => escape(row[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function compute(text: string, m: Mode): { output: string; error: string | null } {
  if (!text.trim()) return { output: '', error: null };
  try {
    return { output: m === 'csv-json' ? csvToJson(text) : jsonToCsv(text), error: null };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : 'Error al convertir.' };
  }
}

export default function CsvAJsonTool() {
  const [mode, setMode] = useState<Mode>('csv-json');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const { output, error } = compute(input, mode);
  const ext = mode === 'csv-json' ? '.json' : '.csv';

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!output) return;
    const type = mode === 'csv-json' ? 'application/json' : 'text/csv';
    const blob = new Blob([output], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultado${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {(['csv-json', 'json-csv'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setInput(''); }}
            className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', mode === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
          >
            {m === 'csv-json' ? 'CSV → JSON' : 'JSON → CSV'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
          {mode === 'csv-json' ? 'CSV de entrada (primera fila = cabecera)' : 'JSON de entrada (array de objetos)'}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'csv-json' ? 'nombre,edad,ciudad\nAna,30,Madrid\nLuis,25,Barcelona' : '[{"nombre":"Ana","edad":"30"},{"nombre":"Luis","edad":"25"}]'}
          rows={7}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono resize-y"
        />
      </div>

      {output && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--color-text)]">Resultado</label>
            <div className="flex gap-3">
              <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button onClick={download} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                <Download size={13} />
                {ext}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            rows={7}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] focus:outline-none font-mono resize-y text-[var(--color-text)]"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
    </div>
  );
}
