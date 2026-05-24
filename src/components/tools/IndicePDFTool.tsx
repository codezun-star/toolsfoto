import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { Download, Loader2 } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface OutlineItem {
  title: string;
  level: number;
  page?: number;
}

export default function IndicePDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    setFile(null);
    setOutline([]);
    setDone(false);
    setError(null);
  }

  async function process() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setOutline([]);
    setDone(false);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;

      // Try to get the built-in PDF outline (bookmarks)
      const rawOutline = await pdf.getOutline();
      if (rawOutline && rawOutline.length > 0) {
        const items: OutlineItem[] = [];

        async function processItems(nodes: unknown[], level: number) {
          for (const node of nodes) {
            const n = node as { title?: string; items?: unknown[]; dest?: unknown };
            if (!n.title) continue;
            let page: number | undefined;
            if (n.dest) {
              try {
                const dest = Array.isArray(n.dest) ? n.dest : await pdf.getDestination(n.dest as string);
                if (dest?.[0]) {
                  const pageIdx = await pdf.getPageIndex(dest[0]);
                  page = pageIdx + 1;
                }
              } catch { /* ignore */ }
            }
            items.push({ title: n.title, level, page });
            if (n.items?.length) await processItems(n.items, level + 1);
          }
        }

        await processItems(rawOutline, 0);
        setOutline(items);
      } else {
        // No built-in outline: scan text for potential headings
        const items: OutlineItem[] = [];
        const seen = new Set<string>();
        for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const lines = new Map<number, { text: string; height: number }[]>();
          for (const item of content.items) {
            const it = item as { str?: string; transform?: number[]; height?: number };
            if (!it.str?.trim()) continue;
            const y = Math.round(it.transform?.[5] ?? 0);
            if (!lines.has(y)) lines.set(y, []);
            lines.get(y)!.push({ text: it.str, height: it.height ?? 12 });
          }
          for (const [, lineItems] of [...lines.entries()].sort((a, b) => b[0] - a[0])) {
            const text = lineItems.map((l) => l.text).join('').trim();
            const maxH = Math.max(...lineItems.map((l) => l.height));
            if (!text || seen.has(text) || text.length > 120) continue;
            if (maxH >= 14 && text.length >= 3) {
              seen.add(text);
              const level = maxH >= 20 ? 0 : maxH >= 16 ? 1 : 2;
              items.push({ title: text, level, page: i });
              if (items.length >= 80) break;
            }
          }
          if (items.length >= 80) break;
        }
        setOutline(items.length > 0 ? items : [{ title: 'No se encontraron encabezados en este PDF', level: 0 }]);
      }
      setDone(true);
    } catch {
      setError('Error al extraer el índice. Comprueba el formato del PDF.');
    } finally {
      setProcessing(false);
    }
  }

  function downloadTxt() {
    const lines = outline.map((item) => {
      const indent = '  '.repeat(item.level);
      const page = item.page ? ` .......... ${item.page}` : '';
      return `${indent}${item.title}${page}`;
    });
    const content = `ÍNDICE DE CONTENIDOS\n${file!.name}\n${'─'.repeat(50)}\n\n${lines.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file!.name.replace('.pdf', '_indice.txt');
    a.click();
    revokeURL(url);
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={setFile} onClear={handleClear} current={file} />

      {file && !done && !processing && (
        <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
          Extraer índice
        </button>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Analizando estructura del PDF…</p>
        </div>
      )}

      {done && outline.length > 0 && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-1 max-h-96 overflow-y-auto">
            {outline.map((item, i) => (
              <div key={i} className="flex items-baseline gap-2" style={{ paddingLeft: `${item.level * 16}px` }}>
                <span className={['font-medium', item.level === 0 ? 'text-[var(--color-text)] text-sm' : item.level === 1 ? 'text-[var(--color-text-secondary)] text-sm' : 'text-[var(--color-text-muted)] text-xs'].join(' ')}>
                  {item.title}
                </span>
                {item.page && <span className="ml-auto text-xs text-[var(--color-text-muted)] shrink-0">p. {item.page}</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={downloadTxt} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm">
              <Download size={16} /> Descargar índice (.txt)
            </button>
            <button onClick={handleClear} className="px-5 py-3 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
              Otro PDF
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
