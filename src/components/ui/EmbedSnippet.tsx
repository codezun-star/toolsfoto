import { useMemo, useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';

interface Props {
  slug: string;
  name: string;
  height: number;
}

const SITE = 'https://toolsfoto.com';

/**
 * «Inserta esta herramienta en tu web»: genera el código del iframe con el
 * enlace de atribución debajo (el backlink) y, opcionalmente, el script que
 * ajusta la altura del iframe a su contenido.
 */
export default function EmbedSnippet({ slug, name, height }: Props) {
  const [auto, setAuto] = useState(true);
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    const lines = [
      `<iframe src="${SITE}/embed/${slug}" title="${name} — ToolsFoto" width="100%" height="${height}" style="border:0;max-width:760px" loading="lazy"></iframe>`,
      `<p style="font:13px system-ui,sans-serif;margin:4px 0 0">${name} gratis de <a href="${SITE}/${slug}">ToolsFoto</a></p>`,
    ];
    if (auto) {
      lines.push(`<script>addEventListener('message',function(e){if(e.origin==='${SITE}'&&e.data&&e.data.type==='toolsfoto:height'){document.querySelectorAll('iframe[src="${SITE}/embed/'+e.data.slug+'"]').forEach(function(f){f.style.height=e.data.height+'px'})}})</script>`);
    }
    return lines.join('\n');
  }, [slug, name, height, auto]);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="mt-16 p-5 sm:p-6 rounded-2xl bg-white border border-[var(--color-border)]">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-[var(--color-text)]">
        <Code2 size={20} className="text-[var(--color-tools-icon)]" /> Inserta esta herramienta en tu web
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-2xl">
        Copia este código y pégalo en tu web, blog o aula virtual: tus visitantes podrán usar «{name}» sin salir de tu página. Es gratis, sin anuncios dentro del recuadro y funciona en WordPress, Blogger, Notion, Moodle o cualquier HTML.
      </p>
      <textarea
        readOnly
        value={code}
        rows={auto ? 5 : 3}
        onFocus={(e) => e.currentTarget.select()}
        className="mt-4 w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-xs bg-[var(--color-bg)] resize-none focus:outline-none"
        aria-label="Código para insertar"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--color-accent)]" />
          Ajustar la altura automáticamente
        </label>
        <div className="flex gap-2">
          <a href={`/embed/${slug}`} target="_blank" rel="noopener" className="px-3.5 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">Ver cómo queda</a>
          <button onClick={copy} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[#C93D1E]">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar código'}
          </button>
        </div>
      </div>
    </section>
  );
}
