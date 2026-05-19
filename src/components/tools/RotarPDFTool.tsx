import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { RotateCcw } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }
type Rotation = 90 | 180 | 270;

export default function RotarPDFTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [rotation, setRotation] = useState<Rotation>(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() { setPdf(null); setError(null); }

  async function handleRotate() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const bytes = await pdf.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      pages.forEach(page => {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + rotation) % 360));
      });
      const out = await doc.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, `_rotado${rotation}.pdf`);
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al rotar el PDF. Asegúrate de que no esté protegido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <PdfUploader label="Sube tu PDF" onFile={(f) => { setPdf({ file: f, name: f.name, size: f.size }); setError(null); }} onClear={handleClear} current={pdf} />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Ángulo de rotación</h2>
          <div className="grid grid-cols-3 gap-2">
            {([90, 180, 270] as Rotation[]).map(r => (
              <button key={r} onClick={() => setRotation(r)}
                className={['flex flex-col items-center gap-2 py-3 rounded-lg border transition-colors', rotation === r ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}>
                <RotateCcw size={18} style={{ transform: `rotate(${r === 270 ? 180 : 0}deg) scaleX(${r === 90 ? -1 : 1})` }} />
                <span className="text-xs font-medium">{r}°</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La rotación se aplica a todas las páginas del documento.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton
          onClick={handleRotate}
          disabled={!pdf || loading}
          loading={loading}
          label={`Rotar ${rotation}° y descargar`}
          className="w-full"
        />
      </div>
    </div>
  );
}
