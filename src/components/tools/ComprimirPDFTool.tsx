import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { formatBytes, formatReduction } from '@/lib/utils/format';
import { TrendingDown } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }
interface Result { blob: Blob; size: number }

export default function ComprimirPDFTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setPdf({ file, name: file.name, size: file.size });
    setResult(null);
    setError(null);
  }

  function handleClear() { setPdf(null); setResult(null); setError(null); }

  async function handleCompress() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await pdf.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const compressed = await doc.save({ useObjectStreams: true });
      setResult({ blob: new Blob([compressed], { type: 'application/pdf' }), size: compressed.byteLength });
    } catch {
      setError('Error al comprimir el PDF. Asegúrate de que no esté protegido con contraseña.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result || !pdf) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdf.name.replace(/\.pdf$/i, '_comprimido.pdf');
    a.click();
    revokeURL(url);
  }

  const reduction = pdf && result ? formatReduction(pdf.size, result.size) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={handleFile} onClear={handleClear} current={pdf} />

        {pdf && result && (
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
            <h2 className="font-bold text-[var(--color-text)]">Comparativa</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-[var(--color-bg)] rounded-lg">
                <p className="text-[var(--color-text-muted)]">Original</p>
                <p className="font-bold text-[var(--color-text)] mt-1">{formatBytes(pdf.size)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-[var(--color-text-muted)]">Comprimido</p>
                <p className="font-bold text-green-700 mt-1">{formatBytes(result.size)}</p>
              </div>
            </div>
            {reduction && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                <TrendingDown size={16} className="text-green-600 shrink-0" />
                <span className="text-sm text-green-700 font-medium">Ahorro: {reduction} menos</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-3">Cómo funciona</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            La compresión recodifica la estructura interna del PDF usando object streams compactos.
            Funciona mejor en PDFs con muchos objetos o generados con herramientas verbosas.
            El texto y las imágenes incrustadas no se modifican.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCompress}
            disabled={!pdf || loading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Comprimiendo…' : 'Comprimir PDF'}
          </button>
          <DownloadButton onClick={handleDownload} disabled={!result} loading={loading} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
