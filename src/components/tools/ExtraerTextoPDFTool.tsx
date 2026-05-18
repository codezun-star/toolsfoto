import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { Copy, Download, Check } from 'lucide-react';

interface PdfFile { file: File; name: string; size: number }

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function ExtraerTextoPDFTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() { setPdf(null); setText(''); setError(null); setCopied(false); }

  async function handleExtract() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    setText('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const bytes = await pdf.file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => {
          if ('str' in item) return item.str;
          return '';
        }).join(' ');
        parts.push(`--- Página ${i} ---\n${pageText}`);
      }
      setText(parts.join('\n\n'));
    } catch {
      setError('Error al extraer el texto. El PDF puede estar escaneado (solo imágenes) o protegido.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!pdf) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdf.name.replace(/\.pdf$/i, '_texto.txt');
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={(f) => { setPdf({ file: f, name: f.name, size: f.size }); setText(''); setError(null); }} onClear={handleClear} current={pdf} />

        {!text && (
          <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)] text-sm text-[var(--color-text-secondary)]">
            <p className="font-medium text-[var(--color-text)] mb-1">Nota sobre OCR</p>
            <p>Esta herramienta extrae texto de PDFs nativos (generados digitalmente). Los PDFs escaneados son imágenes y no contienen texto extraíble sin OCR.</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!text ? (
          <>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <button
              onClick={handleExtract}
              disabled={!pdf || loading}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Extrayendo texto…' : 'Extraer texto'}
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-2 justify-end">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)] transition-colors">
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar todo'}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)] transition-colors">
                <Download size={13} />
                Guardar .txt
              </button>
              <button onClick={handleClear} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] transition-colors">
                Nuevo
              </button>
            </div>
            <textarea
              readOnly
              value={text}
              rows={18}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-mono text-[var(--color-text)] bg-white resize-none focus:outline-none leading-relaxed"
            />
          </>
        )}
      </div>
    </div>
  );
}
