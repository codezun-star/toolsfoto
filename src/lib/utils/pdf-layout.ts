import type { PDFDocument, PDFFont, PDFPage } from 'pdf-lib';

/**
 * Maquetador de documentos a PDF con pdf-lib: párrafos con negrita/cursiva,
 * títulos, listas, imágenes y tablas, con salto de página automático.
 * El texto queda como texto real (seleccionable y buscable), no como imagen.
 *
 * Lo usan `WordAPdfTool` (DOCX → HTML con mammoth → bloques) y
 * `ExcelAPdfTool` (hojas → tablas).
 *
 * Usa las fuentes estándar de PDF (Helvetica), que no hay que incrustar y
 * cubren el juego WinAnsi: todo el español, el resto de lenguas de Europa
 * occidental, comillas tipográficas, rayas, € y viñetas. Los caracteres fuera
 * de ese juego (emojis, alfabetos no latinos) se sustituyen por "?".
 */

export interface Run { text: string; bold?: boolean; italic?: boolean }

export type Block =
  | { type: 'paragraph'; runs: Run[]; bullet?: string; indent?: number; align?: 'left' | 'center' }
  | { type: 'heading'; level: number; runs: Run[] }
  | { type: 'image'; bytes: Uint8Array; mime: string }
  | { type: 'table'; rows: string[][]; header?: boolean }
  | { type: 'pagebreak' };

export interface LayoutOptions {
  /** Tamaño en puntos [ancho, alto]. A4 por defecto. */
  pageSize?: [number, number];
  margin?: number;
  fontSize?: number;
  /** Tamaño de letra de las tablas (las hojas de cálculo suelen necesitar menos). */
  tableFontSize?: number;
  /** Título que se pinta en la cabecera de cada página (p. ej. nombre de la hoja). */
  pageHeader?: (pageIndex: number) => string;
}

export const A4: [number, number] = [595.28, 841.89];

const HEADING_SIZE = [22, 18, 15, 13, 12, 11];

interface Fonts { regular: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont }

interface Segment { text: string; font: PDFFont; width: number }

export async function layoutPdf(blocks: Block[], opts: LayoutOptions = {}): Promise<Uint8Array> {
  const { PDFDocument: Doc, StandardFonts, rgb } = await import('pdf-lib');
  const [pageW, pageH] = opts.pageSize ?? A4;
  const margin = opts.margin ?? 56;
  const baseSize = opts.fontSize ?? 11;
  const tableSize = opts.tableFontSize ?? 9;
  const contentW = pageW - margin * 2;

  const doc: PDFDocument = await Doc.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
  };
  const text = rgb(0.07, 0.07, 0.07);
  const grey = rgb(0.45, 0.45, 0.45);
  const border = rgb(0.75, 0.75, 0.75);
  const headFill = rgb(0.94, 0.94, 0.94);

  // ── Caracteres admitidos por WinAnsi ──────────────────────────────────────
  const okChar = new Map<string, boolean>();
  const clean = (s: string): string => {
    let out = '';
    for (const ch of s.replace(/\t/g, '    ').replace(/[\r\n\u2028\u2029]/g, ' ')) {
      let ok = okChar.get(ch);
      if (ok === undefined) {
        try { fonts.regular.encodeText(ch); ok = true; } catch { ok = false; }
        okChar.set(ch, ok);
      }
      out += ok ? ch : '?';
    }
    return out;
  };
  const fontFor = (r: Run): PDFFont =>
    r.bold && r.italic ? fonts.boldItalic : r.bold ? fonts.bold : r.italic ? fonts.italic : fonts.regular;

  // ── Páginas ───────────────────────────────────────────────────────────────
  let page!: PDFPage;
  let y = 0;
  let pageIndex = -1;
  const newPage = () => {
    page = doc.addPage([pageW, pageH]);
    pageIndex++;
    y = pageH - margin;
    const header = opts.pageHeader?.(pageIndex);
    if (header) {
      page.drawText(clean(header), { x: margin, y: pageH - margin / 2 - 4, size: 8, font: fonts.regular, color: grey });
    }
  };
  newPage();
  const ensure = (h: number) => { if (y - h < margin) newPage(); };

  // ── Partir texto en líneas ────────────────────────────────────────────────
  function wrap(runs: Run[], size: number, width: number): Segment[][] {
    const lines: Segment[][] = [];
    let line: Segment[] = [];
    let lineW = 0;
    const push = () => { lines.push(line); line = []; lineW = 0; };

    for (const run of runs) {
      const font = fontFor(run);
      // Palabras con su espacio final, para medir y cortar por palabras.
      for (const token of clean(run.text).split(/(?<= )/)) {
        if (!token) continue;
        let w = font.widthOfTextAtSize(token, size);
        if (lineW + w > width && lineW > 0) {
          push();
          if (token === ' ') continue;
        }
        let rest = token;
        // Palabra más larga que la línea: se corta por caracteres.
        while (w > width) {
          let n = rest.length;
          while (n > 1 && font.widthOfTextAtSize(rest.slice(0, n), size) > width) n--;
          line.push({ text: rest.slice(0, n), font, width: font.widthOfTextAtSize(rest.slice(0, n), size) });
          push();
          rest = rest.slice(n);
          w = font.widthOfTextAtSize(rest, size);
        }
        line.push({ text: rest, font, width: w });
        lineW += w;
      }
    }
    if (line.length) push();
    return lines.length ? lines : [[]];
  }

  function drawLines(lines: Segment[][], x: number, size: number, width: number, align: 'left' | 'center' = 'left') {
    const lineH = size * 1.4;
    for (const segs of lines) {
      ensure(lineH);
      y -= lineH;
      const total = segs.reduce((s, g) => s + g.width, 0);
      let cx = align === 'center' ? x + (width - total) / 2 : x;
      for (const g of segs) {
        if (g.text.trim()) page.drawText(g.text, { x: cx, y: y + size * 0.28, size, font: g.font, color: text });
        cx += g.width;
      }
    }
  }

  // ── Tablas ────────────────────────────────────────────────────────────────
  function drawTable(rows: string[][], header: boolean) {
    const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    if (!cols) return;
    const pad = 3;
    // Ancho por columna proporcional al contenido, con mínimo legible.
    const want = Array.from({ length: cols }, (_, c) =>
      Math.min(220, Math.max(30, ...rows.slice(0, 200).map((r) => fonts.regular.widthOfTextAtSize(clean(String(r[c] ?? '')), tableSize) + pad * 2))));
    const sum = want.reduce((a, b) => a + b, 0);
    const widths = want.map((w) => (w / sum) * contentW);
    const lineH = tableSize * 1.3;

    const drawRow = (row: string[], isHead: boolean) => {
      const cells = widths.map((w, c) => wrap([{ text: String(row[c] ?? ''), bold: isHead }], tableSize, w - pad * 2));
      const h = Math.max(...cells.map((l) => l.length)) * lineH + pad * 2;
      if (y - h < margin) {
        newPage();
        if (header && !isHead && rows.length) drawRow(rows[0], true);
      }
      let x = margin;
      cells.forEach((lines, c) => {
        page.drawRectangle({
          x, y: y - h, width: widths[c], height: h,
          borderColor: border, borderWidth: 0.5,
          ...(isHead ? { color: headFill } : {}),
        });
        let ly = y - pad;
        for (const segs of lines) {
          ly -= lineH;
          let cx = x + pad;
          for (const g of segs) {
            if (g.text.trim()) page.drawText(g.text, { x: cx, y: ly + tableSize * 0.3, size: tableSize, font: g.font, color: text });
            cx += g.width;
          }
        }
        x += widths[c];
      });
      y -= h;
    };

    rows.forEach((row, i) => drawRow(row, header && i === 0));
    y -= baseSize;
  }

  // ── Bloques ───────────────────────────────────────────────────────────────
  for (const block of blocks) {
    if (block.type === 'pagebreak') {
      newPage();
    } else if (block.type === 'heading') {
      const size = HEADING_SIZE[Math.min(5, Math.max(0, block.level - 1))];
      const lines = wrap(block.runs.map((r) => ({ ...r, bold: true })), size, contentW);
      ensure(size * 1.4 * Math.min(lines.length, 2) + size);
      y -= size * 0.6;
      drawLines(lines, margin, size, contentW);
      y -= size * 0.3;
    } else if (block.type === 'paragraph') {
      const indent = (block.indent ?? 0) + (block.bullet ? 16 : 0);
      const lines = wrap(block.runs, baseSize, contentW - indent);
      const startY = y;
      drawLines(lines, margin + indent, baseSize, contentW - indent, block.align);
      if (block.bullet) {
        // La viñeta va a la altura de la primera línea, aunque haya saltado de página.
        const firstLineY = y < startY ? startY - baseSize * 1.4 : y;
        page.drawText(clean(block.bullet), { x: margin + indent - 14, y: firstLineY + baseSize * 0.28, size: baseSize, font: fonts.regular, color: text });
      }
      y -= block.bullet ? baseSize * 0.2 : baseSize * 0.6;
    } else if (block.type === 'image') {
      try {
        const img = block.mime.includes('png') ? await doc.embedPng(block.bytes) : await doc.embedJpg(block.bytes);
        const maxH = pageH - margin * 2;
        const scale = Math.min(1, contentW / img.width, maxH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ensure(h);
        y -= h;
        page.drawImage(img, { x: margin + (contentW - w) / 2, y, width: w, height: h });
        y -= baseSize * 0.6;
      } catch {
        // Formato de imagen no admitido por pdf-lib (EMF, TIFF…): se omite.
      }
    } else if (block.type === 'table') {
      drawTable(block.rows, block.header ?? false);
    }
  }

  return doc.save({ useObjectStreams: true });
}
