import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Upload } from 'lucide-react';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PdfDoc {
  pdf: { numPages: number; getPage: (n: number) => Promise<unknown> };
  name: string;
}

async function renderPage(pdf: PdfDoc, pageNum: number, scale: number): Promise<string> {
  const page = await pdf.pdf.getPage(pageNum) as { getViewport: (o: {scale: number}) => {width: number; height: number}; render: (o: object) => {promise: Promise<void>} };
  const vp = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

function PdfDropZone({ label, onLoad, loaded }: { label: string; onLoad: (name: string, pdf: PdfDoc['pdf']) => void; loaded: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handle(f: File) {
    if (!f.name.toLowerCase().endsWith('.pdf')) return;
    setLoading(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      onLoad(f.name, pdf as PdfDoc['pdf']);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className={['flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors', loaded ? 'border-[var(--color-tools-border)] bg-[var(--color-tools-bg)]' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)]'].join(' ')}>
      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handle(e.target.files[0]); }} />
      {loading ? <Loader2 size={22} className="animate-spin text-[var(--color-accent)]" /> : <Upload size={22} className="text-[var(--color-text-muted)]" />}
      <span className="text-sm text-[var(--color-text-secondary)] font-medium">{loaded ? 'PDF cargado — clic para cambiar' : label}</span>
    </label>
  );
}

export default function CompararPDFsTool() {
  const [docA, setDocA] = useState<PdfDoc | null>(null);
  const [docB, setDocB] = useState<PdfDoc | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [imgA, setImgA] = useState<string | null>(null);
  const [imgB, setImgB] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const numPages = Math.min(docA?.pdf.numPages ?? 0, docB?.pdf.numPages ?? 0);

  async function renderBoth(p: number, s: number, a: PdfDoc | null, b: PdfDoc | null) {
    if (!a || !b) return;
    setRendering(true);
    try {
      const [ia, ib] = await Promise.all([renderPage(a, p, s), renderPage(b, p, s)]);
      setImgA(ia);
      setImgB(ib);
    } finally {
      setRendering(false);
    }
  }

  function loadA(name: string, pdf: PdfDoc['pdf']) {
    const doc = { pdf, name };
    setDocA(doc);
    if (docB) { setPage(1); renderBoth(1, scale, doc, docB); }
  }

  function loadB(name: string, pdf: PdfDoc['pdf']) {
    const doc = { pdf, name };
    setDocB(doc);
    if (docA) { setPage(1); renderBoth(1, scale, docA, doc); }
  }

  function navigate(delta: number) {
    const np = Math.min(numPages, Math.max(1, page + delta));
    setPage(np);
    renderBoth(np, scale, docA, docB);
  }

  function changeScale(s: number) {
    setScale(s);
    renderBoth(page, s, docA, docB);
  }

  const ready = docA && docB;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">PDF A</label>
          <PdfDropZone label="Subir PDF A" onLoad={loadA} loaded={!!docA} />
          {docA && <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">{docA.name} · {docA.pdf.numPages} pág.</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">PDF B</label>
          <PdfDropZone label="Subir PDF B" onLoad={loadB} loaded={!!docB} />
          {docB && <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">{docB.name} · {docB.pdf.numPages} pág.</p>}
        </div>
      </div>

      {ready && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} disabled={page <= 1 || rendering} className="p-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-40 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold">Pág. {page} / {numPages}</span>
            <button onClick={() => navigate(1)} disabled={page >= numPages || rendering} className="p-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-40 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <select value={scale} onChange={(e) => changeScale(Number(e.target.value))} className="px-3 py-1.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none">
            <option value={0.8}>80%</option>
            <option value={1.0}>100%</option>
            <option value={1.2}>120%</option>
            <option value={1.5}>150%</option>
          </select>
        </div>
      )}

      {rendering && (
        <div className="p-6 text-center">
          <Loader2 size={24} className="animate-spin mx-auto text-[var(--color-accent)]" />
        </div>
      )}

      {!rendering && imgA && imgB && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{docA!.name}</p>
            <img src={imgA} alt="PDF A" className="w-full rounded-xl border border-[var(--color-border)] shadow-sm" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{docB!.name}</p>
            <img src={imgB} alt="PDF B" className="w-full rounded-xl border border-[var(--color-border)] shadow-sm" />
          </div>
        </div>
      )}

      {!ready && (
        <p className="text-sm text-center text-[var(--color-text-muted)]">Sube dos PDFs para compararlos página a página de forma sincronizada</p>
      )}
    </div>
  );
}
