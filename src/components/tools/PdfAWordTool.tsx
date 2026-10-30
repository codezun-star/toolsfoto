import { useState } from 'react';
import { FileType } from 'lucide-react';
import PdfUploader from '@/components/ui/PdfUploader';
import { loadPdfjs } from '@/lib/utils/pdfjs';
import { revokeURL } from '@/lib/utils/canvas';
import { useT, withLang } from '@/i18n/react';

interface Piece { text: string; x: number; y: number; w: number; size: number; bold: boolean; italic: boolean }
interface Line { pieces: Piece[]; y: number; x: number; right: number; size: number }
interface Para { lines: Line[]; size: number; page: number; bullet: boolean; center: boolean }

const BULLET_RE = /^\s*([•·▪◦‣●○■□–-]|\d{1,3}[.)]|[a-z][.)])\s+/i;

/** Agrupa los fragmentos de texto de una página en líneas, de arriba abajo. */
function toLines(pieces: Piece[]): Line[] {
  const sorted = [...pieces].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const p of sorted) {
    const line = lines.find((l) => Math.abs(l.y - p.y) < Math.max(2, p.size * 0.45));
    if (line) line.pieces.push(p);
    else lines.push({ pieces: [p], y: p.y, x: 0, right: 0, size: 0 });
  }
  for (const l of lines) {
    l.pieces.sort((a, b) => a.x - b.x);
    l.x = l.pieces[0].x;
    l.right = Math.max(...l.pieces.map((p) => p.x + p.w));
    l.size = Math.max(...l.pieces.map((p) => p.size));
  }
  return lines.sort((a, b) => b.y - a.y);
}

function median(values: number[]): number {
  if (!values.length) return 11;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/**
 * PDF a Word (.docx). Lee el texto con pdf.js y reconstruye la estructura a
 * partir de la posición y el tamaño de cada fragmento: líneas → párrafos,
 * títulos por tamaño de letra, listas por viñetas y negrita/cursiva por el
 * nombre de la fuente. Genera el .docx con la librería `docx`.
 */
function PdfAWordTool() {
  const tr = useT();
  const [file, setFile] = useState<File | null>(null);
  const [keepLines, setKeepLines] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function handleConvert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDone(null);
    try {
      const pdfjsLib = await loadPdfjs();
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const paras: Para[] = [];
      let chars = 0;

      for (let n = 1; n <= doc.numPages; n++) {
        setStatus(tr('Leyendo página {i} de {n}…', { i: n, n: doc.numPages }));
        const page = await doc.getPage(n);
        const pageWidth = page.getViewport({ scale: 1 }).width;
        // La lista de operadores carga las fuentes: así se sabe cuál es negrita o cursiva.
        await page.getOperatorList();
        const content = await page.getTextContent();
        const fontName = new Map<string, string>();
        const pieces: Piece[] = [];
        for (const item of content.items) {
          if (!('str' in item) || !item.str.trim()) continue;
          let name = fontName.get(item.fontName);
          if (name === undefined) {
            try {
              const f = page.commonObjs.get(item.fontName) as { name?: string } | null;
              name = f?.name ?? '';
            } catch { name = ''; }
            name += ` ${content.styles[item.fontName]?.fontFamily ?? ''}`;
            fontName.set(item.fontName, name);
          }
          const [a, b, , , e, f] = item.transform;
          const size = Math.hypot(a, b) || item.height || 11;
          chars += item.str.length;
          pieces.push({
            text: item.str, x: e, y: f, w: item.width, size,
            bold: /bold|black|heavy|semibold|demi/i.test(name),
            italic: /italic|oblique/i.test(name),
          });
        }

        const lines = toLines(pieces);
        let current: Para | null = null;
        let prev: Line | null = null;
        for (const line of lines) {
          const text = line.pieces.map((p) => p.text).join(' ');
          const bullet = BULLET_RE.test(text);
          const mid = (line.x + line.right) / 2;
          const center = Math.abs(mid - pageWidth / 2) < pageWidth * 0.06 && line.right - line.x < pageWidth * 0.6;
          const gap = prev ? prev.y - line.y : 0;
          const sameBlock = current && prev && !bullet
            && gap < Math.max(prev.size, line.size) * 1.75
            && Math.abs(line.size - current.size) < 1.2
            && center === current.center;
          if (sameBlock && current) {
            current.lines.push(line);
          } else {
            current = { lines: [line], size: line.size, page: n, bullet, center };
            paras.push(current);
          }
          prev = line;
        }
        page.cleanup();
      }

      if (chars < 20 * doc.numPages) {
        setError(tr('Este PDF apenas tiene texto: parece escaneado (las páginas son imágenes). Pásalo primero por «OCR de PDF» para reconocer el texto y después conviértelo a Word.'));
        return;
      }

      setStatus(tr('Creando el documento Word…'));
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const body = median(paras.flatMap((p) => p.lines.map((l) => l.size)));
      let lastPage = 1;

      const children = paras.map((p) => {
        const pageBreakBefore = p.page !== lastPage;
        lastPage = p.page;
        const allBold = p.lines.every((l) => l.pieces.every((x) => x.bold));
        const length = p.lines.reduce((s, l) => s + l.pieces.reduce((t, x) => t + x.text.length, 0), 0);
        const ratio = p.size / body;
        const heading = ratio >= 1.8 ? HeadingLevel.HEADING_1
          : ratio >= 1.45 ? HeadingLevel.HEADING_2
          : (ratio >= 1.15 || (allBold && length < 90 && p.lines.length <= 2)) ? HeadingLevel.HEADING_3
          : undefined;

        const runs: InstanceType<typeof TextRun>[] = [];
        p.lines.forEach((line, li) => {
          line.pieces.forEach((piece, pi) => {
            let t = piece.text;
            if (li === 0 && pi === 0 && p.bullet) t = t.replace(BULLET_RE, '');
            // Espacio entre fragmentos separados y entre líneas unidas (sin partir palabras con guion).
            const before = pi > 0 && piece.x - (line.pieces[pi - 1].x + line.pieces[pi - 1].w) > piece.size * 0.2;
            if (before) t = ` ${t}`;
            if (!keepLines && pi === line.pieces.length - 1 && li < p.lines.length - 1) {
              if (/-$/.test(t)) t = t.slice(0, -1);
              else if (!/\s$/.test(t)) t += ' ';
            }
            runs.push(new TextRun({
              text: t,
              bold: heading ? undefined : piece.bold,
              italics: piece.italic,
              size: heading ? undefined : Math.round(Math.min(28, Math.max(16, piece.size * 2))),
              break: keepLines && pi === 0 && li > 0 ? 1 : undefined,
            }));
          });
        });

        return new Paragraph({
          children: runs,
          heading,
          pageBreakBefore,
          bullet: p.bullet ? { level: 0 } : undefined,
          alignment: p.center ? AlignmentType.CENTER : undefined,
          spacing: { after: 120 },
        });
      });

      const docx = new Document({
        creator: 'ToolsFoto',
        styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
        sections: [{ children }],
      });
      const blob = await Packer.toBlob(docx);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, '') + '.docx';
      a.click();
      revokeURL(url);
      setDone(tr(doc.numPages === 1 ? 'Listo: {n} página convertida a Word.' : 'Listo: {n} páginas convertidas a Word.', { n: doc.numPages }));
    } catch (err) {
      console.error('[PdfAWordTool] Error:', err);
      setError(tr('No se ha podido convertir el PDF. Si está protegido con contraseña, quítasela primero e inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PdfUploader onFile={(f) => { setFile(f); setDone(null); setError(null); }} onClear={() => { setFile(null); setDone(null); }} current={file} />

      <label className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[var(--color-border)] cursor-pointer">
        <input type="checkbox" checked={keepLines} onChange={(e) => setKeepLines(e.target.checked)} className="mt-1 accent-[var(--color-accent)]" />
        <span>
          <span className="block text-sm font-medium text-[var(--color-text)]">{tr('Mantener los saltos de línea del PDF')}</span>
          <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5">
            {tr('Desactivado (recomendado), las líneas se unen en párrafos que fluyen al editar. Actívalo para poemas, direcciones o listados.')}
          </span>
        </span>
      </label>

      <button
        onClick={handleConvert}
        disabled={!file || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FileType size={16} />
        {loading ? status : tr('Convertir a Word')}
      </button>

      {done && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{done}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <p className="text-xs text-[var(--color-text-muted)]">
        {tr('Se conservan el texto, los párrafos, los títulos, las listas, la negrita y la cursiva. Las imágenes y el diseño exacto de columnas no se trasladan: el objetivo es un documento que puedas editar con comodidad.')}
      </p>
    </div>
  );
}

export default withLang(PdfAWordTool);
