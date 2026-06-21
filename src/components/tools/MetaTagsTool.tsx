import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function MetaTagsTool() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');
  const [twitter, setTwitter] = useState('');
  const [copied, setCopied] = useState(false);

  const lines: string[] = [];
  if (title) {
    lines.push(`<title>${esc(title)}</title>`);
    lines.push(`<meta name="title" content="${esc(title)}">`);
  }
  if (desc) lines.push(`<meta name="description" content="${esc(desc)}">`);
  lines.push('');
  lines.push('<!-- Open Graph / Facebook -->');
  lines.push('<meta property="og:type" content="website">');
  if (url) lines.push(`<meta property="og:url" content="${esc(url)}">`);
  if (title) lines.push(`<meta property="og:title" content="${esc(title)}">`);
  if (desc) lines.push(`<meta property="og:description" content="${esc(desc)}">`);
  if (image) lines.push(`<meta property="og:image" content="${esc(image)}">`);
  lines.push('');
  lines.push('<!-- Twitter -->');
  lines.push('<meta name="twitter:card" content="summary_large_image">');
  if (url) lines.push(`<meta name="twitter:url" content="${esc(url)}">`);
  if (title) lines.push(`<meta name="twitter:title" content="${esc(title)}">`);
  if (desc) lines.push(`<meta name="twitter:description" content="${esc(desc)}">`);
  if (image) lines.push(`<meta name="twitter:image" content="${esc(image)}">`);
  if (twitter) lines.push(`<meta name="twitter:site" content="${esc(twitter.startsWith('@') ? twitter : '@' + twitter)}">`);

  const output = lines.join('\n');

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const fields: { label: string; value: string; set: (s: string) => void; placeholder: string; area?: boolean }[] = [
    { label: 'Título de la página', value: title, set: setTitle, placeholder: 'Mi página increíble' },
    { label: 'Descripción', value: desc, set: setDesc, placeholder: 'Una descripción de 150-160 caracteres…', area: true },
    { label: 'URL canónica', value: url, set: setUrl, placeholder: 'https://ejemplo.com/pagina' },
    { label: 'URL de la imagen (1200×630)', value: image, set: setImage, placeholder: 'https://ejemplo.com/og.png' },
    { label: 'Usuario de Twitter/X', value: twitter, set: setTwitter, placeholder: '@usuario' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">{f.label}</label>
            {f.area ? (
              <textarea value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} rows={3} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-y" />
            ) : (
              <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)]" />
            )}
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[var(--color-text)]">Etiquetas generadas</label>
          <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <pre className="px-3 py-2.5 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] font-mono text-[var(--color-text)] overflow-x-auto h-full min-h-[300px] whitespace-pre-wrap">{output}</pre>
      </div>
    </div>
  );
}
