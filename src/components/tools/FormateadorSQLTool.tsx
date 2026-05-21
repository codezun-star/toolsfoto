import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

const KEYWORDS = [
  'SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN',
  'FULL JOIN','CROSS JOIN','ON','AND','OR','NOT','IN','EXISTS','BETWEEN','LIKE',
  'IS NULL','IS NOT NULL','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','UNION',
  'UNION ALL','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE',
  'ALTER TABLE','DROP TABLE','AS','DISTINCT','COUNT','SUM','AVG','MIN','MAX',
  'CASE','WHEN','THEN','ELSE','END','WITH','RETURNING','PRIMARY KEY','FOREIGN KEY',
  'REFERENCES','DEFAULT','NOT NULL','UNIQUE','INDEX','ASC','DESC',
];

function formatSQL(sql: string): string {
  let s = sql.replace(/\s+/g, ' ').trim();

  // Uppercase keywords
  KEYWORDS.forEach((kw) => {
    const re = new RegExp(`\\b${kw}\\b`, 'gi');
    s = s.replace(re, kw);
  });

  // Line breaks before major clauses
  const clauses = [
    'SELECT','FROM','WHERE','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN',
    'FULL JOIN','CROSS JOIN','JOIN','ORDER BY','GROUP BY','HAVING','LIMIT',
    'OFFSET','UNION ALL','UNION','INSERT INTO','VALUES','UPDATE','SET',
    'DELETE FROM','WITH','ON',
  ];
  clauses.forEach((c) => {
    s = s.replace(new RegExp(`\\b(${c})\\b`, 'g'), `\n${c}`);
  });

  // Indent AND / OR inside WHERE / HAVING / ON
  s = s.replace(/\n(AND|OR)\b/g, '\n  $1');

  // Commas in SELECT: add newline + indent
  const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
  const result: string[] = [];
  let inSelect = false;

  for (const line of lines) {
    if (line.startsWith('SELECT')) {
      inSelect = true;
      result.push(line);
    } else if (/^(FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ORDER|GROUP|HAVING|LIMIT|OFFSET|UNION|INSERT|VALUES|UPDATE|SET|DELETE|WITH)/.test(line)) {
      inSelect = false;
      result.push(line);
    } else {
      result.push(inSelect ? '  ' + line : line);
    }
  }

  return result.join('\n');
}

function minifySQL(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

export default function FormateadorSQLTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [copied, setCopied] = useState(false);

  function process() {
    const result = mode === 'format' ? formatSQL(input) : minifySQL(input);
    setOutput(result);
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query.sql';
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputLines = input.trim() ? input.trim().split('\n').length : 0;
  const outputLines = output.trim() ? output.trim().split('\n').length : 0;
  const reduction = input.length > 0 ? Math.round((1 - output.length / input.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        {(['format', 'minify'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
              mode === m
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
            }`}
          >
            {m === 'format' ? 'Formatear SQL' : 'Minificar SQL'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text)]">SQL de entrada</label>
            {inputLines > 0 && (
              <span className="text-xs text-[var(--color-text-muted)]">{inputLines} líneas · {input.length} chars</span>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="SELECT u.id, u.name FROM users u WHERE u.active = 1 AND u.role = 'admin' ORDER BY u.name ASC"
            className="w-full h-64 px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text)]">Resultado</label>
            {output && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {outputLines} líneas · {output.length} chars
                {mode === 'minify' && reduction > 0 && ` · ${reduction}% menos`}
              </span>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="El SQL formateado aparecerá aquí…"
            className="w-full h-64 px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm font-mono resize-none bg-[var(--color-bg)] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={process}
          disabled={!input.trim()}
          className="flex-1 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mode === 'format' ? 'Formatear' : 'Minificar'}
        </button>
        <button
          onClick={copy}
          disabled={!output}
          className="flex items-center gap-2 px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] disabled:opacity-40 transition-colors"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button
          onClick={downloadTxt}
          disabled={!output}
          className="flex items-center gap-2 px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] disabled:opacity-40 transition-colors"
        >
          <Download size={16} />
          .sql
        </button>
      </div>
    </div>
  );
}
