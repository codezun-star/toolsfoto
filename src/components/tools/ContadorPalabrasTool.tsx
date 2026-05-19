import { useState, useMemo } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

interface Stats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTime: number;
}

function analyze(text: string): Stats {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const sentences = text.trim() === '' ? 0 : (text.match(/[.!?]+(\s|$)/g) || []).length;
  const paragraphs = text.trim() === '' ? 0 : text.trim().split(/\n\s*\n/).filter(p => p.trim() !== '').length;
  const lines = text.trim() === '' ? 0 : text.split('\n').filter(l => l.trim() !== '').length;
  const readingTime = Math.ceil(words / 200);
  return { chars, charsNoSpaces, words, sentences, paragraphs, lines, readingTime };
}

export default function ContadorPalabrasTool() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const stats = useMemo(() => analyze(text), [text]);

  async function copyStats() {
    const lines = [
      `Caracteres (con espacios): ${stats.chars}`,
      `Caracteres (sin espacios): ${stats.charsNoSpaces}`,
      `Palabras: ${stats.words}`,
      `Frases: ${stats.sentences}`,
      `Párrafos: ${stats.paragraphs}`,
      `Líneas: ${stats.lines}`,
      `Tiempo de lectura: ~${stats.readingTime} min`,
    ].join('\n');
    await navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statItems = [
    { label: 'Caracteres', value: stats.chars, sub: 'con espacios' },
    { label: 'Caracteres', value: stats.charsNoSpaces, sub: 'sin espacios' },
    { label: 'Palabras', value: stats.words, sub: '' },
    { label: 'Frases', value: stats.sentences, sub: '' },
    { label: 'Párrafos', value: stats.paragraphs, sub: '' },
    { label: 'Líneas', value: stats.lines, sub: '' },
    { label: 'Tiempo lectura', value: `~${stats.readingTime} min`, sub: '200 pal/min' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Texto a analizar</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Pega o escribe tu texto aquí..."
          className="w-full h-56 text-sm p-4 rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Estadísticas</h2>
        {text && (
          <button
            onClick={copyStats}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
          >
            {copied ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
            {copied ? 'Copiado' : 'Copiar stats'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((s, i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-[var(--color-border)] text-center">
            <p className="text-2xl font-extrabold text-[var(--color-accent)]">{s.value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-[var(--color-text)] mt-1">{s.label}</p>
            {s.sub && <p className="text-xs text-[var(--color-text-muted)]">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
