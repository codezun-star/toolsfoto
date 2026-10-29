/**
 * Lector y escritor mínimos de hojas de cálculo XLSX, sin dependencias
 * pesadas: un .xlsx es un ZIP de XML, y `fflate` (8 KB) hace el ZIP.
 *
 * - `writeXlsx`: texto y números, una hoja por tabla, primera fila en negrita.
 *   Usa cadenas en línea (`inlineStr`), que Excel, LibreOffice, Numbers y
 *   Google Sheets abren sin tabla de cadenas compartidas.
 * - `readXlsx`: valores de celda (texto, números, booleanos, fechas y el
 *   último resultado calculado de las fórmulas). No lee el resto de formatos
 *   ni celdas combinadas: basta para pasar los datos a PDF o a otro formato.
 *
 * Lo usan `PdfAExcelTool` y `ExcelAPdfTool`.
 */

export type Cell = string | number | boolean | null;
export interface Sheet { name: string; rows: Cell[][] }

function esc(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Índice de columna (0) → letra (A, B… Z, AA…). */
export function colName(i: number): string {
  let n = i + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Nombre de hoja válido para Excel: sin `[]:*?/\`, máx. 31 caracteres, únicos. */
function sheetNames(sheets: Sheet[]): string[] {
  const used = new Set<string>();
  return sheets.map((s, i) => {
    let base = s.name.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || `Hoja ${i + 1}`;
    let name = base;
    let n = 2;
    while (used.has(name.toLowerCase())) {
      const suffix = ` (${n++})`;
      name = base.slice(0, 31 - suffix.length) + suffix;
    }
    used.add(name.toLowerCase());
    return name;
  });
}

export async function writeXlsx(sheets: Sheet[]): Promise<Uint8Array> {
  const { zipSync, strToU8 } = await import('fflate');
  const names = sheetNames(sheets);
  const files: Record<string, Uint8Array> = {};

  files['[Content_Types].xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + '</Types>',
  );
  files['_rels/.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    + '</Relationships>',
  );
  files['xl/workbook.xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
    + names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
    + '</sheets></workbook>',
  );
  files['xl/_rels/workbook.xml.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
    + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
    + '</Relationships>',
  );
  // Estilo 0: normal. Estilo 1: negrita (cabecera).
  files['xl/styles.xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
    + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
    + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
    + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
    + '</styleSheet>',
  );

  sheets.forEach((sheet, si) => {
    const widths: number[] = [];
    const rowsXml = sheet.rows.map((row, r) => {
      const cells = row.map((v, c) => {
        if (v === null || v === '') return '';
        const len = String(v).length;
        widths[c] = Math.max(widths[c] ?? 8, Math.min(60, len + 2));
        const ref = `${colName(c)}${r + 1}`;
        const style = r === 0 ? ' s="1"' : '';
        if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${style}><v>${v}</v></c>`;
        if (typeof v === 'boolean') return `<c r="${ref}"${style} t="b"><v>${v ? 1 : 0}</v></c>`;
        return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
      }).join('');
      return `<row r="${r + 1}">${cells}</row>`;
    }).join('');
    const cols = widths.length
      ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w ?? 8}" customWidth="1"/>`).join('')}</cols>`
      : '';
    files[`xl/worksheets/sheet${si + 1}.xml`] = strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rowsXml}</sheetData></worksheet>`,
    );
  });

  return zipSync(files, { level: 6 });
}

/** "B12" → [fila 11, columna 1] */
function parseRef(ref: string): [number, number] {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return [0, 0];
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return [Number(m[2]) - 1, col - 1];
}

function textOf(el: Element | null | undefined): string {
  if (!el) return '';
  // Texto enriquecido: varios <r><t>; texto plano: un solo <t>. Se ignoran las
  // anotaciones fonéticas (<rPh>) que Excel añade en japonés.
  const ts = Array.from(el.getElementsByTagName('t')).filter((t) => t.parentElement?.localName !== 'rPh');
  return ts.map((t) => t.textContent ?? '').join('');
}

export async function readXlsx(data: ArrayBuffer): Promise<Sheet[]> {
  const { unzipSync, strFromU8 } = await import('fflate');
  const zip = unzipSync(new Uint8Array(data));
  const xml = (path: string): Document | null => {
    const bytes = zip[path];
    return bytes ? new DOMParser().parseFromString(strFromU8(bytes), 'application/xml') : null;
  };

  const workbook = xml('xl/workbook.xml');
  if (!workbook) throw new Error('No es un archivo XLSX válido');

  const shared = Array.from(xml('xl/sharedStrings.xml')?.getElementsByTagName('si') ?? []).map(textOf);

  // Estilos con formato de fecha: Excel guarda las fechas como número de serie
  // y solo el formato de la celda dice que lo son.
  const styles = xml('xl/styles.xml');
  const customFmt = new Map<string, string>();
  for (const f of Array.from(styles?.getElementsByTagName('numFmt') ?? [])) {
    customFmt.set(f.getAttribute('numFmtId') ?? '', f.getAttribute('formatCode') ?? '');
  }
  const cellXfs = styles?.getElementsByTagName('cellXfs')[0];
  const dateStyle = Array.from(cellXfs?.getElementsByTagName('xf') ?? []).map((xf) => {
    const id = Number(xf.getAttribute('numFmtId') ?? 0);
    if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47)) return true;
    const code = (customFmt.get(String(id)) ?? '').replace(/"[^"]*"|\[[^\]]*\]/g, '');
    return /[dy]/i.test(code) || /m{3,}/i.test(code);
  });
  const serialToDate = (n: number): string => {
    // Época de Excel: 30/12/1899 (incluye el falso 29/02/1900 de Lotus).
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n * 86400000));
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const time = n % 1 ? ` ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` : '';
    return `${dd}/${mm}/${d.getUTCFullYear()}${time}`;
  };

  // r:id de cada hoja → ruta de su XML
  const rels = new Map<string, string>();
  for (const rel of Array.from(xml('xl/_rels/workbook.xml.rels')?.getElementsByTagName('Relationship') ?? [])) {
    const target = rel.getAttribute('Target') ?? '';
    rels.set(rel.getAttribute('Id') ?? '', target.startsWith('/') ? target.slice(1) : `xl/${target}`);
  }

  const sheets: Sheet[] = [];
  for (const sh of Array.from(workbook.getElementsByTagName('sheet'))) {
    const rid = sh.getAttribute('r:id') ?? sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ?? '';
    const doc = xml(rels.get(rid) ?? '');
    if (!doc) continue;
    const rows: Cell[][] = [];
    for (const c of Array.from(doc.getElementsByTagName('c'))) {
      const [r, col] = parseRef(c.getAttribute('r') ?? '');
      const t = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      let value: Cell = null;
      if (t === 's') value = shared[Number(v)] ?? '';
      else if (t === 'inlineStr') value = textOf(c.getElementsByTagName('is')[0]);
      else if (t === 'b') value = v === '1';
      else if (t === 'str' || t === 'e') value = v;
      else if (v !== '') {
        const num = Number(v);
        value = !Number.isFinite(num) ? v : dateStyle[Number(c.getAttribute('s') ?? -1)] ? serialToDate(num) : num;
      }
      if (value === null || value === '') continue;
      (rows[r] ??= [])[col] = value;
    }
    // Rellena huecos para que todas las filas sean arrays densos
    const width = rows.reduce((m, row) => Math.max(m, row?.length ?? 0), 0);
    const dense = Array.from(rows, (row) => Array.from({ length: width }, (_, i) => row?.[i] ?? null));
    sheets.push({ name: sh.getAttribute('name') ?? `Hoja ${sheets.length + 1}`, rows: dense });
  }
  return sheets;
}

/** CSV (coma, punto y coma o tabulador, autodetectado) → filas. */
export function parseCsv(text: string): Cell[][] {
  const nl = text.indexOf('\n');
  const firstLine = nl === -1 ? text : text.slice(0, nl);
  const delim = [';', '\t', ','].map((d) => [d, firstLine.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: Cell[][] = [];
  let row: Cell[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ''));
}
