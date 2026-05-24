import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const COMMON_ENTITIES = [
  { char: '&', entity: '&amp;', name: 'Ampersand' },
  { char: '<', entity: '&lt;', name: 'Less than' },
  { char: '>', entity: '&gt;', name: 'Greater than' },
  { char: '"', entity: '&quot;', name: 'Quotation mark' },
  { char: "'", entity: '&apos;', name: 'Apostrophe' },
  { char: '©', entity: '&copy;', name: 'Copyright' },
  { char: '®', entity: '&reg;', name: 'Registered' },
  { char: '™', entity: '&trade;', name: 'Trademark' },
  { char: '€', entity: '&euro;', name: 'Euro' },
  { char: '£', entity: '&pound;', name: 'Pound' },
  { char: '¥', entity: '&yen;', name: 'Yen' },
  { char: '°', entity: '&deg;', name: 'Degree' },
  { char: '±', entity: '&plusmn;', name: 'Plus-minus' },
  { char: '×', entity: '&times;', name: 'Multiply' },
  { char: '÷', entity: '&divide;', name: 'Divide' },
  { char: '…', entity: '&hellip;', name: 'Ellipsis' },
  { char: '–', entity: '&ndash;', name: 'En dash' },
  { char: '—', entity: '&mdash;', name: 'Em dash' },
  { char: ' ', entity: '&nbsp;', name: 'Non-breaking space' },
  { char: '←', entity: '&larr;', name: 'Left arrow' },
  { char: '→', entity: '&rarr;', name: 'Right arrow' },
  { char: '↑', entity: '&uarr;', name: 'Up arrow' },
  { char: '↓', entity: '&darr;', name: 'Down arrow' },
];

function encodeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function decodeHTML(str: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

export default function EntidadesHTMLTool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState('');

  const output = mode === 'encode' ? encodeHTML(input) : decodeHTML(input);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  }

  function insertEntity(entity: string) {
    setInput((prev) => prev + entity);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-[var(--color-bg)] rounded-xl">
            {(['encode', 'decode'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setInput(''); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === m ? 'bg-white shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                }`}>
                {m === 'encode' ? 'Codificar' : 'Decodificar'}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {mode === 'encode' ? 'Texto → entidades HTML' : 'Entidades HTML → texto'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-[var(--color-text)]">
                {mode === 'encode' ? 'Texto de entrada' : 'HTML con entidades'}
              </label>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              placeholder={mode === 'encode' ? 'Escribe texto con <, >, &, " ...' : 'Pega HTML con &lt;, &gt;, &amp; ...'}
              className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {output && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[var(--color-text)]">Resultado</label>
                <button onClick={() => copy(output, 'result')}
                  className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                  {copied === 'result' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  Copiar
                </button>
              </div>
              <div className="px-3 py-2.5 border border-[var(--color-tools-border)] bg-[var(--color-tools-bg)] rounded-xl text-sm font-mono break-all whitespace-pre-wrap min-h-[80px]">
                {output}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
        <p className="text-sm font-bold text-[var(--color-text)] mb-3">Entidades frecuentes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COMMON_ENTITIES.map((e) => (
            <div
              key={e.entity}
              className="flex items-center justify-between p-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer group transition-colors"
              onClick={() => insertEntity(e.entity)}
            >
              <div className="min-w-0">
                <p className="text-sm font-mono font-semibold text-[var(--color-text)] truncate">{e.entity}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{e.char !== ' ' ? e.char : '·'} {e.name}</p>
              </div>
              <button
                onClick={(ev) => { ev.stopPropagation(); copy(e.entity, e.entity); }}
                className="ml-2 flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied === e.entity ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-[var(--color-text-muted)]" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
