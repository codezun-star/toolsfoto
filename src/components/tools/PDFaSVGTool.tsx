import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const u16 = (n: number, b: Uint8Array, o: number) => { b[o] = n & 0xff; b[o + 1] = (n >> 8) & 0xff; };
  const u32 = (n: number, b: Uint8Array, o: number) => { b[o] = n & 0xff; b[o + 1] = (n >> 8) & 0xff; b[o + 2] = (n >> 16) & 0xff; b[o + 3] = (n >> 24) & 0xff; };
  const parts: Uint8Array[] = [];
  const cd: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const nameB = new TextEncoder().encode(f.name);
    const crc = crc32(f.data);
    const lh = new Uint8Array(30 + nameB.length);
    u32(0x04034b50, lh, 0); u16(20, lh, 4); u16(0, lh, 6); u16(0, lh, 8);
    u16(0, lh, 10); u16(0, lh, 12); u32(crc, lh, 14);
    u32(f.data.length, lh, 18); u32(f.data.length, lh, 22);
    u16(nameB.length, lh, 26); u16(0, lh, 28);
    lh.set(nameB, 30);
    parts.push(lh, f.data);
    const ce = new Uint8Array(46 + nameB.length);
    u32(0x02014b50, ce, 0); u16(20, ce, 4); u16(20, ce, 6); u16(0, ce, 8); u16(0, ce, 10);
    u16(0, ce, 12); u16(0, ce, 14); u32(crc, ce, 16);
    u32(f.data.length, ce, 20); u32(f.data.length, ce, 24);
    u16(nameB.length, ce, 28); u16(0, ce, 30); u16(0, ce, 32);
    u16(0, ce, 34); u16(0, ce, 36); u32(0, ce, 38); u32(offset, ce, 42);
    ce.set(nameB, 46);
    cd.push(ce);
    offset += lh.length + f.data.length;
  }
  const cdOff = offset;
  const cdBytes = new Uint8Array(cd.reduce((s, c) => s + c.length, 0));
  let pos = 0;
  for (const c of cd) { cdBytes.set(c, pos); pos += c.length; }
  const eocd = new Uint8Array(22);
  u32(0x06054b50, eocd, 0); u16(0, eocd, 4); u16(0, eocd, 6);
  u16(files.length, eocd, 8); u16(files.length, eocd, 10);
  u32(cdBytes.length, eocd, 12); u32(cdOff, eocd, 16); u16(0, eocd, 20);
  const total = new Uint8Array([...parts, cdBytes, eocd].reduce((s, a) => s + a.length, 0));
  let p = 0;
  for (const a of [...parts, cdBytes, eocd]) { total.set(a, p); p += a.length; }
  return total;
}

async function pageToPngBytes(page: unknown): Promise<Uint8Array> {
  const p = page as { getViewport: (o: {scale: number}) => {width: number; height: number}; render: (o: object) => {promise: Promise<void>} };
  const vp = p.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext('2d')!;
  await p.render({ canvasContext: ctx, viewport: vp }).promise;
  return new Promise((res) => canvas.toBlob((b) => b!.arrayBuffer().then((ab) => res(new Uint8Array(ab))), 'image/png'));
}

function pngToSVG(pngBytes: Uint8Array, width: number, height: number): string {
  const b64 = btoa(String.fromCharCode(...pngBytes));
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" xlink:href="data:image/png;base64,${b64}"/></svg>`;
}

export default function PDFaSVGTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [svgPages, setSvgPages] = useState<{ svg: string; width: number; height: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClear() {
    setFile(null);
    setSvgPages([]);
    setError(null);
    setDone(false);
    setProgress(0);
  }

  async function process() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setSvgPages([]);
    setDone(false);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      const pages: { svg: string; width: number; height: number }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const pngBytes = await pageToPngBytes(page);
        const vp = page.getViewport({ scale: 1.5 });
        const svg = pngToSVG(pngBytes, Math.round(vp.width), Math.round(vp.height));
        pages.push({ svg, width: Math.round(vp.width), height: Math.round(vp.height) });
        setProgress(Math.round((i / pdf.numPages) * 100));
      }
      setSvgPages(pages);
      setDone(true);
    } catch {
      setError('Error al convertir el PDF. Comprueba que el archivo no está protegido.');
    } finally {
      setProcessing(false);
    }
  }

  function downloadSingle(idx: number) {
    const { svg } = svgPages[idx];
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file!.name.replace('.pdf', '')}_pagina_${idx + 1}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadZip() {
    const zipFiles = svgPages.map((p, i) => ({
      name: `${file!.name.replace('.pdf', '')}_pagina_${i + 1}.svg`,
      data: new TextEncoder().encode(p.svg),
    }));
    const zip = buildZip(zipFiles);
    const blob = new Blob([zip], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file!.name.replace('.pdf', '')}_svg.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={setFile} onClear={handleClear} current={file} />

      {file && !done && !processing && (
        <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
          Convertir a SVG
        </button>
      )}

      {processing && (
        <div className="p-6 text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm">Convirtiendo páginas… {progress}%</p>
          <div className="w-full bg-[var(--color-border)] rounded-full h-2"><div className="bg-[var(--color-accent)] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {done && svgPages.length > 0 && (
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-tools-bg)] border border-[var(--color-tools-border)] rounded-xl">
            <p className="text-sm font-semibold text-[var(--color-text)]">{svgPages.length} página{svgPages.length !== 1 ? 's' : ''} convertida{svgPages.length !== 1 ? 's' : ''}</p>
          </div>
          {svgPages.length > 1 && (
            <button onClick={downloadZip} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
              <Download size={18} /> Descargar todas en ZIP
            </button>
          )}
          <div className="space-y-2">
            {svgPages.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white border border-[var(--color-border)] rounded-xl">
                <span className="text-sm text-[var(--color-text)]">Página {i + 1} — {p.width}×{p.height}px</span>
                <button onClick={() => downloadSingle(i)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] border border-[var(--color-accent)] rounded-lg hover:bg-[var(--color-accent-bg)] transition-colors">
                  <Download size={13} /> SVG
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Convertir otro PDF</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
