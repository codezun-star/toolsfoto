import { useRef, useState } from 'react';
import { FileInput, Upload, X, FileText } from 'lucide-react';
import { layoutPdf, type Block, type Run } from '@/lib/utils/pdf-layout';
import { toBlobPart } from '@/lib/utils/bytes';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { useFileReceiver } from '@/hooks/useFileReceiver';

const MAX_SIZE = 50 * 1024 * 1024;
const isDocx = (f: File) => /\.docx$/i.test(f.name) || f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Texto con formato de un nodo HTML (negrita/cursiva heredadas). */
function runsOf(node: Node, bold = false, italic = false): Run[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ');
    return text ? [{ text, bold, italic }] : [];
  }
  if (!(node instanceof Element)) return [];
  const tag = node.tagName.toLowerCase();
  if (tag === 'img' || tag === 'table' || tag === 'ul' || tag === 'ol') return [];
  if (tag === 'br') return [{ text: '\n', bold, italic }];
  const b = bold || tag === 'strong' || tag === 'b';
  const i = italic || tag === 'em' || tag === 'i';
  return Array.from(node.childNodes).flatMap((c) => runsOf(c, b, i));
}

/** Parte en varias líneas donde había <br>. */
function splitBreaks(runs: Run[]): Run[][] {
  const out: Run[][] = [[]];
  for (const r of runs) {
    if (r.text === '\n') out.push([]);
    else out[out.length - 1].push(r);
  }
  return out.map((line) => {
    if (line.length) {
      line[0] = { ...line[0], text: line[0].text.replace(/^\s+/, '') };
    }
    return line;
  }).filter((line) => line.some((r) => r.text.trim()));
}

function dataUriToBytes(src: string): { bytes: Uint8Array; mime: string } | null {
  const m = /^data:([^;]+);base64,(.*)$/.exec(src);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime: m[1] };
}

/** HTML de mammoth → bloques del maquetador. */
function htmlToBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const blocks: Block[] = [];

  const images = (el: Element) => {
    for (const img of Array.from(el.querySelectorAll('img'))) {
      const data = dataUriToBytes(img.getAttribute('src') ?? '');
      if (data) blocks.push({ type: 'image', ...data });
    }
  };

  const list = (el: Element, depth: number) => {
    const ordered = el.tagName.toLowerCase() === 'ol';
    let n = 0;
    for (const li of Array.from(el.children)) {
      if (li.tagName.toLowerCase() !== 'li') continue;
      n++;
      const lines = splitBreaks(runsOf(li));
      lines.forEach((runs, i) => blocks.push({
        type: 'paragraph', runs, indent: depth * 18,
        bullet: i === 0 ? (ordered ? `${n}.` : depth % 2 ? '◦' : '•') : undefined,
      }));
      images(li);
      for (const sub of Array.from(li.children)) {
        const t = sub.tagName.toLowerCase();
        if (t === 'ul' || t === 'ol') list(sub, depth + 1);
      }
    }
  };

  for (const el of Array.from(doc.body.children)) {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const runs = runsOf(el).filter((r) => r.text !== '\n');
      if (runs.some((r) => r.text.trim())) blocks.push({ type: 'heading', level: Number(tag[1]), runs });
    } else if (tag === 'ul' || tag === 'ol') {
      list(el, 0);
    } else if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll('tr')).map((tr) =>
        Array.from(tr.children).map((td) => (td.textContent ?? '').replace(/\s+/g, ' ').trim()));
      const header = !!el.querySelector('tr th') || !!el.querySelector('tr:first-child strong');
      if (rows.length) blocks.push({ type: 'table', rows, header });
    } else {
      const lines = splitBreaks(runsOf(el));
      if (!lines.length && !el.querySelector('img')) {
        // Párrafo vacío: en Word se usa como separación.
        blocks.push({ type: 'paragraph', runs: [{ text: ' ' }] });
      }
      for (const runs of lines) blocks.push({ type: 'paragraph', runs });
      images(el);
    }
  }
  return blocks;
}

/**
 * Word a PDF. `mammoth` convierte el .docx a HTML semántico (párrafos,
 * títulos, listas, tablas, negrita/cursiva e imágenes) y el maquetador
 * propio (`pdf-layout.ts`) lo compone en páginas A4 con pdf-lib. El texto
 * del PDF queda seleccionable.
 */
export default function WordAPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File) {
    setError(null);
    setWarning(null);
    if (/\.doc$/i.test(f.name)) {
      setError('El formato antiguo .doc (Word 97-2003) no se puede leer en el navegador. Ábrelo en Word o LibreOffice y guárdalo como .docx.');
      return;
    }
    if (!isDocx(f)) { setError('Sube un documento de Word en formato .docx.'); return; }
    if (f.size > MAX_SIZE) { setError('El archivo supera el límite de 50 MB.'); return; }
    setFile(f);
  }

  useFileReceiver(isDocx, pick, () => file === null);

  async function handleConvert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const mammoth = await import('mammoth');
      const { value: html, messages } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      const blocks = htmlToBlocks(html);
      if (!blocks.length) {
        setError('El documento está vacío o no tiene contenido que se pueda convertir.');
        return;
      }
      const bytes = await layoutPdf(blocks);
      const url = URL.createObjectURL(new Blob([toBlobPart(bytes)], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.docx$/i, '') + '.pdf';
      a.click();
      revokeURL(url);
      if (messages.some((m) => m.type === 'warning')) {
        setWarning('PDF creado. Algunos elementos avanzados (cuadros de texto, formas, columnas o encabezados de página) no se han podido trasladar.');
      }
    } catch (err) {
      console.error('[WordAPdfTool] Error:', err);
      setError('No se ha podido leer el documento. Comprueba que es un .docx válido y que no está protegido con contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {file ? (
        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] shrink-0"><FileText size={20} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">{file.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatBytes(file.size)}</p>
          </div>
          <button onClick={() => setFile(null)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]" aria-label="Eliminar archivo">
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          className={[
            'flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center',
            dragging ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)]',
          ].join(' ')}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><Upload size={24} /></div>
          <div>
            <p className="font-semibold text-[var(--color-text)]">Sube tu documento de Word</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra aquí o haz clic · DOCX · Máx. 50 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }}
          />
        </label>
      )}

      <button
        onClick={handleConvert}
        disabled={!file || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FileInput size={16} />
        {loading ? 'Convirtiendo…' : 'Convertir a PDF'}
      </button>

      {warning && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{warning}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <p className="text-xs text-[var(--color-text-muted)]">
        Se conservan los títulos, párrafos, listas, tablas, imágenes, negrita y cursiva. El PDF usa una tipografía estándar
        (Helvetica) en tamaño A4, así que el resultado es limpio y legible aunque no idéntico píxel a píxel al original.
      </p>
    </div>
  );
}
