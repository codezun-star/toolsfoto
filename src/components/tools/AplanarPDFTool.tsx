import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

export default function AplanarPDFTool() {
  const [pdf, setPdf] = useState<{ file: File; name: string; size: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [fieldCount, setFieldCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleLoad(f: File) {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      const form = doc.getForm();
      setFieldCount(form.getFields().length);
      setPdf({ file: f, name: f.name, size: f.size });
    } catch {
      setPdf({ file: f, name: f.name, size: f.size });
      setFieldCount(0);
    }
  }

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setPdf(null);
    setResultUrl(null);
    setResultSize(0);
    setFieldCount(0);
    setError(null);
  }

  async function process() {
    if (!pdf) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    setResultUrl(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await pdf.file.arrayBuffer();
      const doc = await PDFDocument.load(buf);

      const form = doc.getForm();
      form.flatten();

      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[AplanarPDF]', err);
      setError('Error al aplanar el PDF. El archivo puede estar protegido o tener un formato no compatible.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = pdf?.name.replace(/\.pdf$/i, '_aplanado.pdf') ?? 'aplanado.pdf';
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={handleLoad} onClear={handleClear} current={pdf} />

      {pdf && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)] text-sm">
            {fieldCount > 0 ? (
              <p className="text-[var(--color-text)]">
                Se detectaron <strong>{fieldCount}</strong> campos de formulario. Al aplanar, quedarán como texto estático.
              </p>
            ) : (
              <p className="text-[var(--color-text-secondary)]">
                No se detectaron campos de formulario interactivos. El PDF se procesará igualmente para eliminar anotaciones y metadatos de formulario.
              </p>
            )}
          </div>

          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
            <h2 className="font-bold text-[var(--color-text)] mb-2">¿Qué hace aplanar un PDF?</h2>
            <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
              <li>Convierte campos de formulario rellenables en texto estático</li>
              <li>Elimina la interactividad de checkboxes, listas y botones de radio</li>
              <li>Las firmas digitales y anotaciones quedan grabadas como contenido fijo</li>
              <li>El PDF resultante no se puede editar con Acrobat ni herramientas de formulario</li>
            </ul>
          </div>

          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Aplanar PDF
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Aplanando formulario…</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Original: <strong className="text-[var(--color-text)]">{formatBytes(pdf?.size ?? 0)}</strong> →
            Aplanado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar PDF aplanado
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otro PDF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
