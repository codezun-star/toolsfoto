import { useState, useRef } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { ImagePlus } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }

export default function AnadirImagenPDFTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [targetPage, setTargetPage] = useState(1);
  const [xPercent, setXPercent] = useState(10);
  const [yPercent, setYPercent] = useState(10);
  const [widthPercent, setWidthPercent] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  async function handlePdfFile(file: File) {
    setPdf({ file, name: file.name, size: file.size });
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setPageCount(count);
      setTargetPage(1);
    } catch { setPageCount(0); }
  }

  function handlePdfClear() {
    setPdf(null);
    setPageCount(0);
    setError(null);
  }

  function handleImgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imgPreview) revokeURL(imgPreview);
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  }

  async function handleProcess() {
    if (!pdf || !imgFile) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await pdf.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      const imgBytes = await imgFile.arrayBuffer();
      const isJpg = imgFile.type === 'image/jpeg';
      const embeddedImg = isJpg
        ? await doc.embedJpg(imgBytes)
        : await doc.embedPng(imgBytes);

      const pageIdx = Math.min(Math.max(targetPage - 1, 0), doc.getPageCount() - 1);
      const page = doc.getPage(pageIdx);
      const { width: pageW, height: pageH } = page.getSize();

      const imgW = (widthPercent / 100) * pageW;
      const imgH = (imgW / embeddedImg.width) * embeddedImg.height;
      const x = (xPercent / 100) * pageW;
      const y = pageH - (yPercent / 100) * pageH - imgH;

      page.drawImage(embeddedImg, { x, y, width: imgW, height: imgH });

      const outBytes = await doc.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, '_con_imagen.pdf');
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al insertar la imagen. Usa JPG o PNG y comprueba que el PDF no esté protegido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={handlePdfFile} onClear={handlePdfClear} current={pdf} />
        {pageCount > 0 && (
          <p className="text-sm text-[var(--color-text-muted)] px-1">
            PDF cargado: <strong className="text-[var(--color-text)]">{pageCount} páginas</strong>
          </p>
        )}

        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Imagen a insertar (JPG o PNG)</p>
          {imgPreview ? (
            <div className="relative">
              <img src={imgPreview} alt="Imagen" className="w-full max-h-40 object-contain rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]" />
              <button
                onClick={() => { if (imgPreview) revokeURL(imgPreview); setImgFile(null); setImgPreview(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow text-[var(--color-text-muted)] hover:text-red-600 text-xs font-bold"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => imgInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors flex flex-col items-center gap-2"
            >
              <ImagePlus size={24} />
              <span className="text-sm">Haz clic para seleccionar imagen</span>
            </button>
          )}
          <input ref={imgInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImgChange} />
        </div>
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Posición en el PDF</h2>

          <div>
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">
              Página de destino (1–{pageCount || 'N'})
            </label>
            <input
              type="number"
              min={1}
              max={pageCount || 1}
              value={targetPage}
              onChange={e => setTargetPage(Number(e.target.value))}
              disabled={!pdf}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:bg-[var(--color-bg)]"
            />
          </div>

          <Slider label="Posición X (% desde izquierda)" value={xPercent} min={0} max={90} step={1} unit="%" onChange={setXPercent} />
          <Slider label="Posición Y (% desde arriba)" value={yPercent} min={0} max={90} step={1} unit="%" onChange={setYPercent} />
          <Slider label="Ancho de la imagen (% del ancho de página)" value={widthPercent} min={5} max={100} step={1} unit="%" onChange={setWidthPercent} />

          <p className="text-xs text-[var(--color-text-muted)]">La altura se ajusta automáticamente para mantener la proporción.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton
          onClick={handleProcess}
          disabled={!pdf || !imgFile || loading}
          loading={loading}
          className="w-full"
        />
      </div>
    </div>
  );
}
