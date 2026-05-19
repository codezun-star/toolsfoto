import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';
import { loadImage, revokeURL } from '@/lib/utils/canvas';
import { Copy, Check, Download } from 'lucide-react';

const SIZES = [
  { size: 16, name: 'favicon-16x16.png', label: '16×16' },
  { size: 32, name: 'favicon-32x32.png', label: '32×32' },
  { size: 48, name: 'favicon-48x48.png', label: '48×48' },
  { size: 96, name: 'favicon-96x96.png', label: '96×96' },
  { size: 180, name: 'apple-touch-icon.png', label: '180×180 (Apple)' },
];

interface Preview { size: number; name: string; label: string; url: string }

export default function GenerarFaviconTool() {
  const upload = useImageUpload();
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);

  function clearPreviews() { previews.forEach(p => revokeURL(p.url)); setPreviews([]); }

  async function handleGenerate() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    clearPreviews();
    try {
      const img = await loadImage(upload.image.url);
      const results: Preview[] = [];
      for (const def of SIZES) {
        const canvas = document.createElement('canvas');
        canvas.width = def.size; canvas.height = def.size;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, def.size, def.size);
        const url = await new Promise<string>((res, rej) => {
          canvas.toBlob(b => b ? res(URL.createObjectURL(b)) : rej(), 'image/png');
        });
        results.push({ ...def, url });
      }
      setPreviews(results);
    } catch {
      setError('Error al generar los favicons.');
    } finally {
      setLoading(false);
    }
  }

  function downloadOne(p: Preview) {
    const a = document.createElement('a'); a.href = p.url; a.download = p.name; a.click();
  }

  async function downloadAll() {
    for (const p of previews) { downloadOne(p); await new Promise(r => setTimeout(r, 150)); }
  }

  const htmlTags = previews.filter(p => p.size !== 96).map(p => {
    if (p.size === 180) return `<link rel="apple-touch-icon" sizes="180x180" href="/${p.name}">`;
    return `<link rel="icon" type="image/png" sizes="${p.size}x${p.size}" href="/${p.name}">`;
  }).join('\n');

  function copyHtml() {
    navigator.clipboard.writeText(htmlTags).then(() => {
      setCopiedHtml(true); setTimeout(() => setCopiedHtml(false), 2000);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ImageUploader image={upload.image} error={upload.error} isDragging={upload.isDragging}
          onDrop={upload.onDrop} onDragOver={upload.onDragOver} onDragLeave={upload.onDragLeave}
          onFileChange={upload.onFileChange} onClear={() => { upload.clearImage(); clearPreviews(); }} />

        <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text)]">Recomendación:</strong> usa una imagen cuadrada PNG con fondo transparente de al menos 180×180 px para obtener los mejores resultados.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-3">Tamaños que se generarán</h2>
          <ul className="space-y-1.5">
            {SIZES.map(s => (
              <li key={s.size} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text)]">{s.label}</span>
                <span className="text-[var(--color-text-muted)] font-mono text-xs">{s.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={!upload.image || loading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Generando…' : 'Generar favicons'}
          </button>
          <button onClick={downloadAll} disabled={previews.length === 0}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            <Download size={16} /> Descargar todos
          </button>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
            <h2 className="font-bold text-[var(--color-text)] mb-4">Favicons generados</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {previews.map(p => (
                <div key={p.size} className="text-center space-y-2">
                  <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center" style={{ minHeight: 80 }}>
                    <img src={p.url} alt={p.label} style={{ width: Math.min(p.size, 64), height: Math.min(p.size, 64) }} className="object-contain" />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">{p.label}</p>
                  <button onClick={() => downloadOne(p)} className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 mx-auto">
                    <Download size={11} /> {p.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[var(--color-text)]">Etiquetas HTML para tu &lt;head&gt;</h2>
              <button onClick={copyHtml} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)] transition-colors">
                {copiedHtml ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copiedHtml ? 'Copiado' : 'Copiar HTML'}
              </button>
            </div>
            <pre className="text-xs font-mono bg-[var(--color-bg)] rounded-lg p-4 overflow-x-auto text-[var(--color-text)] leading-relaxed">{htmlTags}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
