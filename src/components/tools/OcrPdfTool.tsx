import { useState } from 'react';
import { FileSearch, Download, Copy, Check } from 'lucide-react';
import PdfUploader from '@/components/ui/PdfUploader';
import { loadPdfjs } from '@/lib/utils/pdfjs';
import { createOcrWorker, OCR_LANGUAGES } from '@/lib/utils/ocr';
import { toBlobPart } from '@/lib/utils/bytes';
import { revokeURL } from '@/lib/utils/canvas';
import { useLang, useT, withLang } from '@/i18n/react';

type Output = 'pdf' | 'txt';

interface OcrWord { text: string; x0: number; y0: number; x1: number; y1: number }

const MAX_PAGES = 60;

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  revokeURL(url);
}

/**
 * OCR de PDF escaneado. Renderiza cada página con pdf.js, la reconoce con
 * Tesseract y, en modo PDF, añade sobre la página ORIGINAL una capa de texto
 * invisible colocada palabra a palabra: el PDF se ve igual (misma calidad,
 * sin recomprimir) pero ya se puede buscar, seleccionar y copiar.
 */
function OcrPdfTool() {
  const t = useT();
  const [file, setFile] = useState<File | null>(null);
  const uiLang = useLang();
  const [lang, setLang] = useState(uiLang === 'en' ? 'eng' : 'spa');
  const [output, setOutput] = useState<Output>('pdf');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  function clear() { setFile(null); setText(''); setError(null); setProgress(0); }

  async function handleProcess() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setText('');
    setProgress(0);
    setStatus(t('Cargando el motor de OCR…'));
    try {
      const [pdfjsLib, { PDFDocument, StandardFonts }] = await Promise.all([loadPdfjs(), import('pdf-lib')]);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const src = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
      const total = Math.min(src.numPages, MAX_PAGES);

      const out = output === 'pdf' ? await PDFDocument.load(bytes, { ignoreEncryption: true }) : null;
      const font = out ? await out.embedFont(StandardFonts.Helvetica) : null;
      const okChar = new Map<string, boolean>();
      const clean = (s: string) => {
        if (!font) return s;
        let r = '';
        for (const ch of s) {
          let ok = okChar.get(ch);
          if (ok === undefined) {
            try { font.encodeText(ch); ok = true; } catch { ok = false; }
            okChar.set(ch, ok);
          }
          r += ok ? ch : '?';
        }
        return r;
      };

      const worker = await createOcrWorker(lang, (p, s) => {
        if (!s.includes('recognizing')) setStatus(s.includes('language') ? t('Descargando el idioma…') : t('Preparando…'));
      });
      const pages: string[] = [];
      try {
        for (let i = 1; i <= total; i++) {
          setStatus(t('Reconociendo página {i} de {n}…', { i, n: total }));
          const page = await src.getPage(i);
          // ~2000 px de ancho: suficiente para Tesseract sin disparar la memoria.
          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(3, Math.max(1.5, 2000 / base.width));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvas, viewport }).promise;

          const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });
          pages.push(data.text.trim());

          if (out && font) {
            const target = out.getPage(i - 1);
            const words: OcrWord[] = [];
            for (const block of data.blocks ?? []) {
              for (const para of block.paragraphs) {
                for (const line of para.lines) {
                  for (const w of line.words) {
                    if (w.text.trim() && w.confidence > 20) words.push({ text: w.text, ...w.bbox });
                  }
                }
              }
            }
            for (const w of words) {
              // Píxeles del render → puntos PDF (pdf.js tiene en cuenta rotación y CropBox).
              const [ax, ay] = viewport.convertToPdfPoint(w.x0, w.y1);
              const [bx, by] = viewport.convertToPdfPoint(w.x1, w.y0);
              const x = Math.min(ax, bx);
              const y = Math.min(ay, by);
              const width = Math.abs(bx - ax);
              const height = Math.abs(by - ay);
              const t = clean(w.text);
              const at1 = font.widthOfTextAtSize(t, 1);
              if (!at1 || width < 1 || height < 1) continue;
              // Tamaño que hace que la palabra ocupe su caja: la selección cae encima del texto visible.
              const size = Math.max(1, Math.min(width / at1, height * 1.2));
              target.drawText(t, { x, y: y + height * 0.15, size, font, opacity: 0 });
            }
          }
          canvas.width = 0;
          canvas.height = 0;
          setProgress(Math.round((i / total) * 100));
        }
      } finally {
        await worker.terminate();
      }

      const joined = pages.map((p, i) => `--- ${t('Página {n}', { n: i + 1 })} ---\n${p}`).join('\n\n');
      setText(joined);
      const baseName = file.name.replace(/\.pdf$/i, '');
      if (out) {
        const saved = await out.save({ useObjectStreams: true });
        download(new Blob([toBlobPart(saved)], { type: 'application/pdf' }), `${baseName}-ocr.pdf`);
      } else {
        download(new Blob([joined], { type: 'text/plain;charset=utf-8' }), `${baseName}-ocr.txt`);
      }
      if (src.numPages > MAX_PAGES) {
        setError(t('El PDF tiene {n} páginas: se han procesado las {m} primeras. Divide el documento para reconocer el resto.', { n: src.numPages, m: MAX_PAGES }));
      }
    } catch (err) {
      console.error('[OcrPdfTool] Error:', err);
      setError(t('No se ha podido procesar el PDF. Si está protegido con contraseña, quítasela primero; si no, comprueba tu conexión (la primera vez se descarga el motor de OCR).'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label={t('Sube tu PDF escaneado')} onFile={(f) => { setFile(f); setText(''); setError(null); }} onClear={clear} current={file} />

        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--color-text)]" htmlFor="ocrpdf-lang">{t('Idioma del documento')}</label>
            <select
              id="ocrpdf-lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-accent)]"
            >
              {OCR_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{t(l.label)}</option>)}
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-[var(--color-text)] mb-2">{t('Resultado')}</legend>
            {([
              ['pdf', t('PDF con texto buscable'), t('El mismo PDF, con una capa de texto invisible para buscar y copiar.')],
              ['txt', t('Solo el texto (.txt)'), t('Todo el texto reconocido, página a página.')],
            ] as const).map(([value, label, hint]) => (
              <label key={value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${output === value ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)]'}`}>
                <input type="radio" name="ocr-output" className="mt-1 accent-[var(--color-accent)]" checked={output === value} onChange={() => setOutput(value)} />
                <span>
                  <span className="block text-sm font-medium text-[var(--color-text)]">{label}</span>
                  <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5">{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {output === 'pdf' ? <FileSearch size={16} /> : <Download size={16} />}
          {loading ? status : output === 'pdf' ? t('Hacer el PDF buscable') : t('Extraer texto con OCR')}
        </button>

        {loading && (
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{t('Cada página tarda unos segundos. La primera vez se descarga el motor de OCR (unos 10 MB).')}</p>
          </div>
        )}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-text)]">{t('Texto reconocido')}</p>
          {text && (
            <button
              onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)] transition-colors"
            >
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copied ? t('Copiado') : t('Copiar todo')}
            </button>
          )}
        </div>
        <textarea
          readOnly
          value={text}
          rows={18}
          placeholder={t('Cuando termine, aquí verás el texto de cada página.')}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)] bg-white resize-y focus:outline-none leading-relaxed"
        />
      </div>
    </div>
  );
}

export default withLang(OcrPdfTool);
