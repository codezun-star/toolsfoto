import { useMemo, useState } from 'react';
import { marked } from 'marked';
import CopyDownload from '@/components/ui/CopyDownload';

const SAMPLE = `# Título del documento

Un párrafo con **negrita**, *cursiva*, \`código\` y un [enlace](https://toolsfoto.com).

## Lista de tareas

- [x] Escribir el borrador
- [ ] Revisar la ortografía
- [ ] Publicar

## Tabla

| Formato | Uso |
|---|---|
| JPG | Fotos |
| PNG | Logotipos |

> Una cita destacada.

\`\`\`js
console.log('Hola, mundo');
\`\`\`
`;

/** Estilos mínimos para la vista previa y para el HTML completo descargable. */
const PREVIEW_CSS = `body{font:16px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif;color:#111110;max-width:760px;margin:0 auto;padding:16px}
h1,h2,h3{line-height:1.25}a{color:#E84827}code{background:#F5F3EF;padding:2px 5px;border-radius:4px;font-size:.9em}
pre{background:#111110;color:#F5F3EF;padding:12px;border-radius:8px;overflow:auto}pre code{background:none;padding:0}
blockquote{border-left:4px solid #E8E4DE;margin:0;padding-left:16px;color:#706C66}table{border-collapse:collapse}
th,td{border:1px solid #E8E4DE;padding:6px 10px;text-align:left}img{max-width:100%}`;

type View = 'preview' | 'html';

/**
 * Markdown a HTML con `marked` (GitHub Flavored Markdown: tablas, listas de
 * tareas, bloques de código). La vista previa va en un iframe con `sandbox`
 * sin permisos: aunque el Markdown traiga HTML con scripts, no se ejecuta.
 */
export default function MarkdownAHtmlTool() {
  const [md, setMd] = useState(SAMPLE);
  const [view, setView] = useState<View>('preview');
  const [full, setFull] = useState(false);

  const html = useMemo(() => marked.parse(md, { gfm: true, breaks: false, async: false }), [md]);
  const document = useMemo(() => {
    const title = /^#\s+(.+)$/m.exec(md)?.[1]?.trim() ?? 'Documento';
    return `<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title.replace(/</g, '&lt;')}</title>\n<style>${PREVIEW_CSS}</style>\n</head>\n<body>\n${html}</body>\n</html>\n`;
  }, [html, md]);

  const output = full ? document : html;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label htmlFor="md-in" className="text-sm font-semibold text-[var(--color-text)]">Markdown</label>
        <textarea id="md-in" value={md} onChange={(e) => setMd(e.target.value)} rows={24} spellCheck={false}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-white resize-y focus:outline-none focus:border-[var(--color-accent)]" />
        <p className="text-xs text-[var(--color-text-muted)]">{md.length.toLocaleString('es-ES')} caracteres · {md.trim() ? md.trim().split(/\s+/).length.toLocaleString('es-ES') : 0} palabras</p>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {([['preview', 'Vista previa'], ['html', 'Código HTML']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === v ? 'bg-[var(--color-accent)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>{l}</button>
            ))}
          </div>
          <CopyDownload text={output} filename={full ? 'documento.html' : 'fragmento.html'} mime="text/html" />
        </div>
        {view === 'preview' ? (
          <iframe
            title="Vista previa del HTML"
            sandbox=""
            srcDoc={document}
            className="w-full h-[560px] rounded-xl border border-[var(--color-border)] bg-white"
          />
        ) : (
          <textarea readOnly value={output} rows={24} className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-xs bg-[var(--color-bg)] resize-y focus:outline-none" />
        )}
        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} className="accent-[var(--color-accent)]" />
          Copiar y descargar como página HTML completa (con &lt;head&gt; y estilos)
        </label>
      </div>
    </div>
  );
}
