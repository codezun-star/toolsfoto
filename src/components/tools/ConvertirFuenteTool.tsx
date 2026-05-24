import { useState, useRef } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

// WOFF format builder (uncompressed tables)
// Spec: https://www.w3.org/TR/WOFF/
function buildWOFF(sfntBytes: Uint8Array): Uint8Array | null {
  const view = new DataView(sfntBytes.buffer, sfntBytes.byteOffset, sfntBytes.byteLength);
  // Read SFNT header
  const sfntVersion = view.getUint32(0);
  const flavor = sfntVersion; // 0x00010000 = TrueType, 0x4F54544F = CFF/OTF
  if (flavor !== 0x00010000 && flavor !== 0x4F54544F && flavor !== 0x74727565) return null;

  const numTables = view.getUint16(4);
  // Table directory entries: tag(4) + checksum(4) + offset(4) + length(4) = 16 bytes each
  interface TableEntry { tag: number; checksum: number; offset: number; length: number }
  const tables: TableEntry[] = [];
  for (let i = 0; i < numTables; i++) {
    const base = 12 + i * 16;
    tables.push({
      tag: view.getUint32(base),
      checksum: view.getUint32(base + 4),
      offset: view.getUint32(base + 8),
      length: view.getUint32(base + 12),
    });
  }

  // Calculate total sfnt size
  const totalSfntSize = sfntBytes.length;

  // WOFF header: 44 bytes
  // WOFF table directory: numTables * 20 bytes each
  const WOFF_HEADER = 44;
  const WOFF_ENTRY = 20;
  const headerSize = WOFF_HEADER + numTables * WOFF_ENTRY;

  // Build table data (uncompressed — CompLength = OrigLength)
  const tableData: { data: Uint8Array; padded: number }[] = tables.map((t) => {
    const end = Math.min(t.offset + t.length, sfntBytes.length);
    const data = sfntBytes.slice(t.offset, end);
    // Pad to 4-byte boundary
    const padded = Math.ceil(data.length / 4) * 4;
    return { data, padded };
  });

  const totalDataSize = tableData.reduce((s, t) => s + t.padded, 0);
  const totalWoffSize = headerSize + totalDataSize;

  const out = new Uint8Array(totalWoffSize);
  const outView = new DataView(out.buffer);

  // WOFF signature
  outView.setUint32(0, 0x774F4646); // 'wOFF'
  outView.setUint32(4, flavor);
  outView.setUint32(8, totalWoffSize);
  outView.setUint16(12, numTables);
  outView.setUint16(14, 0); // reserved
  outView.setUint32(16, totalSfntSize);
  outView.setUint16(20, 1); // majorVersion
  outView.setUint16(22, 0); // minorVersion
  outView.setUint32(24, 0); // metaOffset
  outView.setUint32(28, 0); // metaLength
  outView.setUint32(32, 0); // metaOrigLength
  outView.setUint32(36, 0); // privOffset
  outView.setUint32(40, 0); // privLength

  let tableOffset = headerSize;
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i];
    const { data, padded } = tableData[i];
    // Write directory entry
    const base = WOFF_HEADER + i * WOFF_ENTRY;
    outView.setUint32(base, t.tag);
    outView.setUint32(base + 4, tableOffset);
    outView.setUint32(base + 8, data.length); // compLength (uncompressed = origLength)
    outView.setUint32(base + 12, t.length);   // origLength
    outView.setUint32(base + 16, t.checksum);
    // Write table data
    out.set(data, tableOffset);
    tableOffset += padded;
  }

  return out;
}

// Extract SFNT from WOFF
function extractSFNT(woffBytes: Uint8Array): Uint8Array | null {
  const view = new DataView(woffBytes.buffer, woffBytes.byteOffset, woffBytes.byteLength);
  if (view.getUint32(0) !== 0x774F4646) return null; // not WOFF
  const flavor = view.getUint32(4);
  const numTables = view.getUint16(12);

  interface WEntry { tag: number; offset: number; compLength: number; origLength: number; checksum: number }
  const entries: WEntry[] = [];
  for (let i = 0; i < numTables; i++) {
    const base = 44 + i * 20;
    entries.push({
      tag: view.getUint32(base),
      offset: view.getUint32(base + 4),
      compLength: view.getUint32(base + 8),
      origLength: view.getUint32(base + 12),
      checksum: view.getUint32(base + 16),
    });
  }

  // Calculate sfnt search parameters
  const n = numTables;
  let searchRange = 1;
  let entrySelector = 0;
  while (searchRange * 2 <= n) { searchRange *= 2; entrySelector++; }
  searchRange *= 16;
  const rangeShift = n * 16 - searchRange;

  // Build sfnt
  const sfntHeaderSize = 12 + n * 16;
  let dataOffset = sfntHeaderSize;
  // Build directory to find offsets
  const offsets: number[] = [];
  for (const e of entries) {
    offsets.push(dataOffset);
    dataOffset += Math.ceil(e.origLength / 4) * 4;
  }
  const totalSize = dataOffset;
  const sfnt = new Uint8Array(totalSize);
  const sfntView = new DataView(sfnt.buffer);
  sfntView.setUint32(0, flavor);
  sfntView.setUint16(4, n);
  sfntView.setUint16(6, searchRange);
  sfntView.setUint16(8, entrySelector);
  sfntView.setUint16(10, rangeShift);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const base = 12 + i * 16;
    sfntView.setUint32(base, e.tag);
    sfntView.setUint32(base + 4, e.checksum);
    sfntView.setUint32(base + 8, offsets[i]);
    sfntView.setUint32(base + 12, e.origLength);
    // Copy table data
    const src = woffBytes.slice(e.offset, e.offset + e.compLength);
    sfnt.set(src, offsets[i]);
  }
  return sfnt;
}

function detectFormat(bytes: Uint8Array): 'ttf' | 'otf' | 'woff' | 'woff2' | 'unknown' {
  const view = new DataView(bytes.buffer, bytes.byteOffset, Math.min(4, bytes.byteLength));
  const sig = view.getUint32(0);
  if (sig === 0x00010000 || sig === 0x74727565) return 'ttf';
  if (sig === 0x4F54544F) return 'otf';
  if (sig === 0x774F4646) return 'woff';
  if (sig === 0x774F4632) return 'woff2';
  return 'unknown';
}

export default function ConvertirFuenteTool() {
  const [file, setFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'ttf' | 'woff'>('woff');
  const [fontBytes, setFontBytes] = useState<Uint8Array | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontName, setFontName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setInputFormat('');
    setFontBytes(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
    setFontName('');
  }

  async function handleFile(f: File) {
    handleClear();
    setFile(f);
    const buf = await f.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const fmt = detectFormat(bytes);
    if (fmt === 'unknown') { setError('Formato no reconocido. Se aceptan TTF, OTF y WOFF.'); return; }
    if (fmt === 'woff2') { setError('WOFF2 requiere decodificación Brotli no disponible en el navegador. Usa una herramienta de escritorio para convertir WOFF2.'); return; }
    setInputFormat(fmt);
    setFontBytes(bytes);
    setFontName(f.name.replace(/\.[^.]+$/, ''));
    setError(null);
    // Set default output
    setOutputFormat(fmt === 'woff' ? 'ttf' : 'woff');
  }

  function convert() {
    if (!fontBytes || !inputFormat) return;
    setProcessing(true);
    setError(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    try {
      let resultBytes: Uint8Array | null = null;
      let mime = 'application/octet-stream';

      if (outputFormat === 'woff') {
        if (inputFormat === 'woff') { setError('El archivo ya está en formato WOFF.'); setProcessing(false); return; }
        resultBytes = buildWOFF(fontBytes);
        mime = 'font/woff';
        if (!resultBytes) throw new Error('No se pudo construir el archivo WOFF. Asegúrate de que el TTF/OTF es válido.');
      } else if (outputFormat === 'ttf') {
        if (inputFormat === 'ttf' || inputFormat === 'otf') { setError('El archivo ya es TTF/OTF.'); setProcessing(false); return; }
        resultBytes = extractSFNT(fontBytes);
        mime = 'font/ttf';
        if (!resultBytes) throw new Error('No se pudo extraer el SFNT del WOFF. El archivo puede estar corrupto.');
      }

      if (!resultBytes) throw new Error('Error en la conversión.');
      const blob = new Blob([resultBytes], { type: mime });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error en la conversión.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${fontName}.${outputFormat}`;
    a.click();
  }

  const availableOutputs: ('ttf' | 'woff')[] = inputFormat === 'woff' ? ['ttf'] : ['woff'];

  return (
    <div className="space-y-6">
      <div
        className={['flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors', file ? 'border-[var(--color-tools-border)] bg-[var(--color-tools-bg)]' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)]'].join(' ')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <input ref={inputRef} type="file" accept=".ttf,.otf,.woff" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        <Upload size={28} className="text-[var(--color-text-muted)]" />
        {file ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">{file.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{inputFormat.toUpperCase()} · {formatBytes(file.size)}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Arrastra un archivo de fuente o haz clic</p>
            <p className="text-xs text-[var(--color-text-muted)]">Formatos soportados: TTF, OTF, WOFF</p>
          </div>
        )}
      </div>

      {file && inputFormat && !error && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Convertir a</label>
            <div className="flex gap-2">
              {availableOutputs.map((f) => (
                <button
                  key={f}
                  onClick={() => setOutputFormat(f)}
                  className={['px-4 py-2 rounded-xl text-sm font-semibold border uppercase transition-colors', outputFormat === f ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
              WOFF2 no está disponible — requiere compresión Brotli que el navegador no soporta nativamente.
            </p>
          </div>

          <button onClick={convert} disabled={processing} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50">
            {processing ? <Loader2 size={18} className="animate-spin mx-auto" /> : `Convertir a ${outputFormat.toUpperCase()}`}
          </button>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(file!.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar {fontName}.{outputFormat}
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Convertir otra fuente</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
