import { useState } from 'react';
import DownloadButton from '@/components/ui/DownloadButton';

const PAGE_SIZES: Record<string, [number, number]> = {
  'A4 (210×297 mm)': [595.28, 841.89],
  'A3 (297×420 mm)': [841.89, 1190.55],
  'Carta (215.9×279.4 mm)': [612, 792],
  'Legal (215.9×355.6 mm)': [612, 1008],
  'A5 (148×210 mm)': [419.53, 595.28],
};

export default function PDFEnBlancoTool() {
  const [selectedSize, setSelectedSize] = useState('A4 (210×297 mm)');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [numPages, setNumPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      let [w, h] = PAGE_SIZES[selectedSize];
      if (orientation === 'landscape') [w, h] = [h, w];

      for (let i = 0; i < numPages; i++) {
        doc.addPage([w, h]);
      }

      const outBytes = await doc.save();
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento_en_blanco_${numPages}pag.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Error al crear el PDF. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
        <h2 className="font-bold text-[var(--color-text)]">Configuración del PDF</h2>

        <div>
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-2">
            Tamaño de página
          </label>
          <div className="space-y-2">
            {Object.keys(PAGE_SIZES).map(size => (
              <label key={size} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="pageSize"
                  value={size}
                  checked={selectedSize === size}
                  onChange={() => setSelectedSize(size)}
                  className="accent-[var(--color-accent)]"
                />
                <span className="text-sm text-[var(--color-text)]">{size}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-2">
            Orientación
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['portrait', 'landscape'] as const).map(o => (
              <button
                key={o}
                onClick={() => setOrientation(o)}
                className={['px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors', orientation === o ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
              >
                {o === 'portrait' ? 'Vertical' : 'Horizontal'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-2">
            Número de páginas
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={numPages}
            onChange={e => setNumPages(Math.min(100, Math.max(1, Number(e.target.value))))}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Se creará un PDF en blanco de <strong>{numPages} página{numPages !== 1 ? 's' : ''}</strong> en formato{' '}
            <strong>{selectedSize.split(' ')[0]}</strong> {orientation === 'portrait' ? 'vertical' : 'horizontal'}.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <DownloadButton
        onClick={handleCreate}
        disabled={loading}
        loading={loading}
        label="Crear PDF en blanco"
        className="w-full"
      />
    </div>
  );
}
