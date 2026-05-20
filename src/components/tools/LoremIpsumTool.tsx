import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum at vero eos accusamus iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque corrupti quos dolores quas molestias excepturi similique occaecati impedit minus facilis distinctio nam libero tempore soluta nobis eligendi cumque nihil impedit quo minus placeat facere possimus omnis assumenda repellendus temporibus autem quibusdam et aut officiis debitis rerum necessitatibus saepe eveniet ut voluptates repudiandae molestiae non recusandae itaque earum rerum tenetur sapiente delectus reiciendis voluptatibus maiores alias perferendis doloribus asperiores repellat'.split(' ');

type Mode = 'paragraphs' | 'words' | 'sentences';

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sentence() {
  const len = 8 + Math.floor(Math.random() * 10);
  return capitalize(Array.from({ length: len }, randomWord).join(' ')) + '.';
}

function paragraph() {
  const count = 4 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, sentence).join(' ');
}

function generate(mode: Mode, amount: number, startLorem: boolean): string {
  if (mode === 'words') {
    const words = Array.from({ length: amount }, randomWord);
    if (startLorem) { words[0] = 'Lorem'; words[1] = 'ipsum'; }
    return words.join(' ');
  }
  if (mode === 'sentences') {
    const sents = Array.from({ length: amount }, sentence);
    if (startLorem) sents[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    return sents.join(' ');
  }
  const paras = Array.from({ length: amount }, paragraph);
  if (startLorem) paras[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
  return paras.join('\n\n');
}

export default function LoremIpsumTool() {
  const [mode, setMode] = useState<Mode>('paragraphs');
  const [amount, setAmount] = useState(3);
  const [startLorem, setStartLorem] = useState(true);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    setText(generate(mode, amount, startLorem));
  }

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lorem-ipsum.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const maxAmount = mode === 'paragraphs' ? 20 : mode === 'sentences' ? 50 : 200;

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Tipo de contenido</p>
          <div className="grid grid-cols-3 gap-2">
            {(['paragraphs', 'sentences', 'words'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setAmount(Math.min(amount, m === 'paragraphs' ? 20 : m === 'sentences' ? 50 : 200)); }}
                className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', mode === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-tools-border)]'].join(' ')}
              >
                {m === 'paragraphs' ? 'Párrafos' : m === 'sentences' ? 'Frases' : 'Palabras'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-[var(--color-text)]">
              Cantidad de {mode === 'paragraphs' ? 'párrafos' : mode === 'sentences' ? 'frases' : 'palabras'}
            </label>
            <span className="text-sm font-mono font-bold text-[var(--color-accent)]">{amount}</span>
          </div>
          <input
            type="range" min={1} max={maxAmount} value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
            <span>1</span><span>{maxAmount}</span>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" checked={startLorem}
            onChange={(e) => setStartLorem(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
          <span className="text-sm text-[var(--color-text)]">Empezar con «Lorem ipsum…»</span>
        </label>
      </div>

      <button
        onClick={handleGenerate}
        className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
      >
        Generar texto
      </button>

      {text && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={copy} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
              {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button onClick={download} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
              <Download size={15} />
              Descargar .txt
            </button>
          </div>
          <textarea
            readOnly
            value={text}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)] leading-relaxed resize-y focus:outline-none bg-white"
          />
        </div>
      )}
    </div>
  );
}
