import { useRef, useState } from 'react';
import { Sheet as SheetIcon, Upload, X, FileSpreadsheet } from 'lucide-react';
import { readXlsx, parseCsv, type Sheet, type Cell } from '@/lib/utils/xlsx';
import { layoutPdf, A4, type Block } from '@/lib/utils/pdf-layout';
import { toBlobPart } from '@/lib/utils/bytes';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { useFileReceiver } from '@/hooks/useFileReceiver';

const MAX_SIZE = 50 * 1024 * 1024;
const isSheet = (f: File) => /\.(xlsx|xlsm|csv)$/i.test(f.name);
const fmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 10 });

function cellText(c: Cell): string {
  if (c === null) return '';
  if (typeof c === 'number') return fmt.format(c);
  if (typeof c === 'boolean') return c ? 'VERDADERO' : 'FALSO';
  return c;
}

/** Quita filas y columnas vacías de los bordes. */
function trim(rows: Cell[][]): string[][] {
  const text = rows.map((r) => r.map(cellText));
  const filled = text.filter((r) => r.some((c) => c.trim()));
  const width = filled.reduce((m, r) => {
    let last = r.length - 1;
    while (last >= 0 && !r[last].trim()) last--;
    return Math.max(m, last + 1);
  }, 0);
  return filled.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
}

/**
 * Excel a PDF. Lee el .xlsx con el lector propio (`xlsx.ts`, sin
 * dependencias pesadas) o un CSV, y compone cada hoja como tabla con el
 * maquetador (`pdf-layout.ts`): cabecera repetida en cada página, columnas
 * proporcionales al contenido y orientación vertical u horizontal.
 */
export default function ExcelAPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [landscape, setLandscape] = useState(true);
  const [header, setHeader] = useState(true);
  const [size, setSize] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(f: File) {
    setError(null);
    if (/\.xls$/i.test(f.name)) {
      setError('El formato antiguo .xls (Excel 97-2003) no se puede leer en el navegador. Guárdalo como .xlsx desde Excel, LibreOffice o Google Sheets.');
      return;
    }
    if (!isSheet(f)) { setError('Sube una hoja de cálculo .xlsx o un archivo .csv.'); return; }
    if (f.size > MAX_SIZE) { setError('El archivo supera el límite de 50 MB.'); return; }
    try {
      const parsed = /\.csv$/i.test(f.name)
        ? [{ name: f.name.replace(/\.csv$/i, ''), rows: parseCsv(await f.text()) }]
        : await readXlsx(await f.arrayBuffer());
      const usable = parsed.filter((s) => s.rows.some((r) => r.some((c) => c !== null && c !== '')));
      if (!usable.length) { setError('La hoja de cálculo está vacía.'); return; }
      setFile(f);
      setSheets(usable);
      setSelected(new Set(usable.map((_, i) => i)));
    } catch (err) {
      console.error('[ExcelAPdfTool] Error al leer:', err);
      setError('No se ha podido leer el archivo. Comprueba que es un .xlsx válido y que no está protegido con contraseña.');
    }
  }

  useFileReceiver(isSheet, (f) => { void pick(f); }, () => file === null);

  function clear() { setFile(null); setSheets([]); setError(null); }

  async function handleConvert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const chosen = sheets.filter((_, i) => selected.has(i));
      const blocks: Block[] = [];
      chosen.forEach((s, i) => {
        if (i > 0) blocks.push({ type: 'pagebreak' });
        if (chosen.length > 1) blocks.push({ type: 'heading', level: 3, runs: [{ text: s.name }] });
        blocks.push({ type: 'table', rows: trim(s.rows), header });
      });
      const bytes = await layoutPdf(blocks, {
        pageSize: landscape ? [A4[1], A4[0]] : A4,
        margin: 32,
        tableFontSize: size,
      });
      const url = URL.createObjectURL(new Blob([toBlobPart(bytes)], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.(xlsx|xlsm|csv)$/i, '') + '.pdf';
      a.click();
      revokeURL(url);
    } catch (err) {
      console.error('[ExcelAPdfTool] Error:', err);
      setError('No se ha podido crear el PDF. Inténtalo de nuevo con menos hojas o un tamaño de letra menor.');
    } finally {
      setLoading(false);
    }
  }

  const toggle = (i: number) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {file ? (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] shrink-0"><FileSpreadsheet size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatBytes(file.size)} · {sheets.length} {sheets.length === 1 ? 'hoja' : 'hojas'}</p>
            </div>
            <button onClick={clear} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]" aria-label="Eliminar archivo"><X size={16} /></button>
          </div>
        ) : (
          <label
            className={[
              'flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center',
              dragging ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)]',
            ].join(' ')}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) void pick(f); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
          >
            <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><Upload size={24} /></div>
            <div>
              <p className="font-semibold text-[var(--color-text)]">Sube tu hoja de cálculo</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra aquí o haz clic · XLSX o CSV · Máx. 50 MB</p>
            </div>
            <input ref={inputRef} type="file" accept=".xlsx,.xlsm,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); e.target.value = ''; }} />
          </label>
        )}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {sheets.length > 1 && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Hojas a incluir</p>
            <div className="space-y-1.5">
              {sheets.map((s, i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="accent-[var(--color-accent)]" />
                  {s.name} <span className="text-xs text-[var(--color-text-muted)]">({s.rows.length} filas)</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Orientación</p>
            <div className="flex gap-2">
              {([[true, 'Horizontal'], [false, 'Vertical']] as const).map(([v, label]) => (
                <button key={label} onClick={() => setLandscape(v)} className={`flex-1 px-3 py-2 rounded-lg border text-sm ${landscape === v ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-semibold' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--color-text)]" htmlFor="xl-size">Tamaño de letra: {size} pt</label>
            <input id="xl-size" type="range" min={6} max={12} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-[var(--color-accent)] mt-2" />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
            <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} className="accent-[var(--color-accent)]" />
            La primera fila es la cabecera (se repite en cada página)
          </label>
        </div>

        <button
          onClick={handleConvert}
          disabled={!file || loading || selected.size === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <SheetIcon size={16} />
          {loading ? 'Creando PDF…' : 'Convertir a PDF'}
        </button>
        <p className="text-xs text-[var(--color-text-muted)]">
          Se trasladan los valores de las celdas (los resultados de las fórmulas, no las fórmulas). Colores, gráficos y celdas
          combinadas no se incluyen. Para tablas muy anchas usa la orientación horizontal y una letra más pequeña.
        </p>
      </div>
    </div>
  );
}
