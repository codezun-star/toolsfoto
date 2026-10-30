import { useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import PdfUploader from '@/components/ui/PdfUploader';
import { loadPdfjs } from '@/lib/utils/pdfjs';
import { writeXlsx, type Cell, type Sheet } from '@/lib/utils/xlsx';
import { toBlobPart } from '@/lib/utils/bytes';
import { revokeURL } from '@/lib/utils/canvas';
import { useT, withLang } from '@/i18n/react';

interface Piece { text: string; x: number; y: number; w: number; size: number }
type Decimal = ',' | '.';

/** Convierte "1.234,56" (coma decimal) o "1,234.56" (punto decimal) en número; si no es un número limpio, lo deja como texto. */
function toValue(raw: string, decimal: Decimal, convert: boolean): Cell {
  const s = raw.trim();
  if (!convert || !/^[-+(]?\d[\d.,\s ]*\)?$/.test(s)) return s;
  // Códigos con ceros a la izquierda ("0042", códigos postales) se quedan como texto.
  if (/^[-+(]?0\d/.test(s)) return s;
  const negative = s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'));
  let n = s.replace(/[()+\-\s ]/g, '');
  const thousands = decimal === ',' ? '.' : ',';
  // "1.234" con coma decimal es mil doscientos treinta y cuatro; "1.5" con coma decimal no es un número limpio.
  if (n.includes(thousands) && !new RegExp(`^\\d{1,3}(\\${thousands}\\d{3})+(\\${decimal}\\d+)?$`).test(n)) return s;
  n = n.split(thousands).join('').replace(decimal, '.');
  const v = Number(n);
  return Number.isFinite(v) ? (negative ? -v : v) : s;
}

/** Separa un fragmento con varios espacios seguidos ("Total     12,50") en celdas. */
function splitPiece(p: Piece): Piece[] {
  const parts = p.text.split(/(\s{2,})/);
  if (parts.length === 1) return [p];
  const charW = p.w / Math.max(1, p.text.length);
  const out: Piece[] = [];
  let offset = 0;
  for (const part of parts) {
    if (part.trim() && !/^\s+$/.test(part)) {
      out.push({ ...p, text: part.trim(), x: p.x + offset * charW, w: part.length * charW });
    }
    offset += part.length;
  }
  return out;
}

/** Filas y columnas de una página a partir de la posición de cada fragmento. */
function pageToRows(pieces: Piece[], pageWidth: number, decimal: Decimal, convert: boolean): Cell[][] {
  // Filas: fragmentos a la misma altura.
  const sorted = [...pieces].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Piece[][] = [];
  const rowY: number[] = [];
  for (const p of sorted) {
    const i = rowY.findIndex((y) => Math.abs(y - p.y) < Math.max(2, p.size * 0.5));
    if (i >= 0) rows[i].push(p);
    else { rows.push([p]); rowY.push(p.y); }
  }
  rows.forEach((r) => r.sort((a, b) => a.x - b.x));

  // Columnas: se proyectan horizontalmente los fragmentos de las filas con
  // varias celdas y se funden los que se solapan. Así una columna de cifras
  // alineadas a la derecha queda en una sola columna aunque empiecen en x distintas.
  const spans = rows
    .filter((r) => r.length > 1)
    .flat()
    .filter((p) => p.w < pageWidth * 0.5)
    .map((p) => [p.x, p.x + p.w] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const cols: Array<[number, number]> = [];
  for (const [a, b] of spans) {
    const last = cols[cols.length - 1];
    if (last && a <= last[1] + 2) last[1] = Math.max(last[1], b);
    else cols.push([a, b]);
  }
  if (!cols.length) return rows.map((r) => [toValue(r.map((p) => p.text).join(' '), decimal, convert)]);

  const colOf = (p: Piece): number => {
    let best = 0;
    let bestScore = -Infinity;
    cols.forEach(([a, b], i) => {
      const overlap = Math.min(b, p.x + p.w) - Math.max(a, p.x);
      const score = overlap > 0 ? overlap : -Math.min(Math.abs(p.x - b), Math.abs(a - (p.x + p.w)));
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return best;
  };

  return rows.map((r) => {
    const cells: string[] = Array.from({ length: cols.length }, () => '');
    for (const p of r) {
      const c = colOf(p);
      cells[c] = cells[c] ? `${cells[c]} ${p.text}` : p.text;
    }
    return cells.map((c) => toValue(c, decimal, convert));
  });
}

/**
 * PDF a Excel. Lee el texto con pdf.js y reconstruye las tablas a partir de
 * la posición de cada fragmento; escribe el .xlsx con el escritor propio
 * (`xlsx.ts`). Funciona con PDFs generados digitalmente (facturas, extractos,
 * informes); los escaneados necesitan antes OCR.
 */
function PdfAExcelTool() {
  const tr = useT();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'pages' | 'single'>('pages');
  const [decimal, setDecimal] = useState<Decimal>(',');
  const [convert, setConvert] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Cell[][] | null>(null);
  const [sheets, setSheets] = useState<Sheet[] | null>(null);

  function clear() { setFile(null); setPreview(null); setSheets(null); setError(null); }

  function save(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    revokeURL(url);
  }

  async function handleConvert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const pdfjsLib = await loadPdfjs();
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const perPage: Cell[][][] = [];
      let chars = 0;
      for (let n = 1; n <= doc.numPages; n++) {
        setStatus(tr('Leyendo página {i} de {n}…', { i: n, n: doc.numPages }));
        const page = await doc.getPage(n);
        const width = page.getViewport({ scale: 1 }).width;
        const content = await page.getTextContent();
        const pieces: Piece[] = [];
        for (const item of content.items) {
          if (!('str' in item) || !item.str.trim()) continue;
          chars += item.str.length;
          const [a, b, , , e, f] = item.transform;
          pieces.push(...splitPiece({ text: item.str, x: e, y: f, w: item.width, size: Math.hypot(a, b) || item.height || 10 }));
        }
        perPage.push(pageToRows(pieces, width, decimal, convert));
        page.cleanup();
      }
      if (chars < 10 * doc.numPages) {
        setError(tr('Este PDF apenas tiene texto: parece escaneado. Pásalo primero por «OCR de PDF» y conviértelo después a Excel.'));
        return;
      }
      const result: Sheet[] = mode === 'pages'
        ? perPage.map((rows, i) => ({ name: tr('Página {n}', { n: i + 1 }), rows }))
        : [{ name: tr('Datos'), rows: perPage.flat() }];
      setSheets(result);
      setPreview(result[0].rows.slice(0, 12));
      const bytes = await writeXlsx(result);
      save(new Blob([toBlobPart(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), file.name.replace(/\.pdf$/i, '') + '.xlsx');
    } catch (err) {
      console.error('[PdfAExcelTool] Error:', err);
      setError(tr('No se ha podido convertir el PDF. Si está protegido con contraseña, quítasela primero e inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!sheets || !file) return;
    const sep = decimal === ',' ? ';' : ',';
    const csv = sheets.flatMap((s) => s.rows).map((r) => r.map((c) => {
      const t = c === null ? '' : typeof c === 'number' && decimal === ',' ? String(c).replace('.', ',') : String(c);
      return /["\n;,]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    }).join(sep)).join('\r\n');
    save(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), file.name.replace(/\.pdf$/i, '') + '.csv');
  }

  const radio = (active: boolean) => `flex-1 text-center px-3 py-2 rounded-lg border text-sm cursor-pointer ${active ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-semibold' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PdfUploader onFile={(f) => { setFile(f); setPreview(null); setSheets(null); setError(null); }} onClear={clear} current={file} />

        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">{tr('Hojas')}</p>
            <div className="flex gap-2">
              <label className={radio(mode === 'pages')}><input type="radio" className="sr-only" checked={mode === 'pages'} onChange={() => setMode('pages')} />{tr('Una por página')}</label>
              <label className={radio(mode === 'single')}><input type="radio" className="sr-only" checked={mode === 'single'} onChange={() => setMode('single')} />{tr('Todo en una')}</label>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">{tr('Separador decimal del PDF')}</p>
            <div className="flex gap-2">
              <label className={radio(decimal === ',')}><input type="radio" className="sr-only" checked={decimal === ','} onChange={() => setDecimal(',')} />{tr('Coma (1.234,56)')}</label>
              <label className={radio(decimal === '.')}><input type="radio" className="sr-only" checked={decimal === '.'} onChange={() => setDecimal('.')} />{tr('Punto (1,234.56)')}</label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
            <input type="checkbox" checked={convert} onChange={(e) => setConvert(e.target.checked)} className="accent-[var(--color-accent)]" />
            {tr('Convertir las cifras en números (para poder sumar en Excel)')}
          </label>
        </div>
      </div>

      <button
        onClick={handleConvert}
        disabled={!file || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FileSpreadsheet size={16} />
        {loading ? status : tr('Convertir a Excel')}
      </button>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {preview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text)]">{tr('Vista previa (primeras filas de la primera hoja)')}</p>
            <button onClick={downloadCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)] transition-colors">
              <Download size={13} /> {tr('Descargar también en CSV')}
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
            <table className="text-xs text-[var(--color-text)] min-w-full">
              <tbody>
                {preview.map((row, r) => (
                  <tr key={r} className="border-b border-[var(--color-border)] last:border-0">
                    {row.map((c, i) => (
                      <td key={i} className={`px-2.5 py-1.5 whitespace-nowrap ${typeof c === 'number' ? 'text-right tabular-nums' : ''}`}>{c === null ? '' : typeof c === 'number' ? c.toLocaleString(decimal === ',' ? 'es-ES' : 'en-US', { maximumFractionDigits: 10 }) : String(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default withLang(PdfAExcelTool);
