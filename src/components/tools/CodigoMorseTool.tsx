import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '@': '.--.-.', 'Ñ': '--.--',
};
const REVERSE: Record<string, string> = Object.fromEntries(Object.entries(MAP).map(([k, v]) => [v, k]));

type Mode = 'encode' | 'decode';

function textToMorse(text: string): string {
  return text.toUpperCase().split('\n').map((line) =>
    line.split(' ').map((word) =>
      Array.from(word).map((c) => MAP[c] ?? '').filter(Boolean).join(' ')
    ).join(' / ')
  ).join('\n');
}

function morseToText(morse: string): string {
  return morse.trim().split('\n').map((line) =>
    line.split('/').map((word) =>
      word.trim().split(/\s+/).map((code) => REVERSE[code] ?? '').join('')
    ).join(' ')
  ).join('\n');
}

export default function CodigoMorseTool() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const output = input.trim() ? (mode === 'encode' ? textToMorse(input) : morseToText(input)) : '';

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {(['encode', 'decode'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setInput(''); }}
            className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', mode === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
          >
            {m === 'encode' ? 'Texto → Morse' : 'Morse → Texto'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">{mode === 'encode' ? 'Texto' : 'Código morse'}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? 'Escribe el texto a traducir…' : 'Pega el morse. Usa espacio entre letras y / entre palabras.'}
          rows={5}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono resize-y"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[var(--color-text)]">Resultado</label>
          {output && (
            <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          )}
        </div>
        <textarea readOnly value={output} rows={5} placeholder="El resultado aparecerá aquí…" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] focus:outline-none font-mono resize-y text-[var(--color-text)]" />
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">Convención: un espacio separa letras, una barra ( / ) separa palabras.</p>
    </div>
  );
}
