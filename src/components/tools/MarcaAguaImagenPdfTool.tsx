import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { revokeURL } from '@/lib/utils/canvas';
import { ImagePlus, X } from 'lucide-react';

interface PdfFile { file: File; name: string; size: number }

const POSITIONS = [
  { id: 'tl', label: 'TL' }, { id: 'tc', label: 'T' }, { id: 'tr', label: 'TR' },
  { id: 'cl', label: 'L' }, { id: 'cc', label: 'C' }, { id: 'cr', label: 'R' },
  { id: 'bl', label: 'BL' }, { id: 'bc', label: 'B' }, { id: 'br', label: 'BR' },
];

export default function MarcaAguaImagenPdfTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [position, setPosition] = useState('br');
  const [scale, setScale] = useState(25);
  const [opacity, setOpacity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() { setPdf(null); setError(null); }
  function setLogoFile(file: File) {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogo(file);
    setLogoUrl(URL.createObjectURL(file));
  }
  function clearLogo() { if (logoUrl) URL.revokeObjectURL(logoUrl); setLogo(null); setLogoUrl(null); }

  async function apply() {
    if (!pdf || !logo) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer(), { ignoreEncryption: true });
      const imgBytes = await logo.arrayBuffer();
      const img = logo.type === 'image/png' ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
      const margin = 24;
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const w = (width * scale) / 100;
        const h = (img.height / img.width) * w;
        let x = margin, y = margin;
        const pos = position;
        if (pos[1] === 'l') x = margin;
        else if (pos[1] === 'c') x = (width - w) / 2;
        else x = width - w - margin;
        if (pos[0] === 'b') y = margin;
        else if (pos[0] === 'c') y = (height - h) / 2;
        else y = height - h - margin;
        page.drawImage(img, { x, y, width: w, height: h, opacity: opacity / 100 });
      }
      const outBytes = await doc.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, '_marca.pdf');
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al aplicar la marca de agua. Usa una imagen PNG o JPG válida.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={(f) => setPdf({ file: f, name: f.name, size: f.size })} onClear={handleClear} current={pdf} />
        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Logo / imagen de marca</p>
          {logoUrl ? (
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg bg-[var(--color-bg)]" />
              <button onClick={clearLogo} className="flex items-center gap-1 text-sm text-red-600"><X size={14} /> Quitar</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-6 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] cursor-pointer hover:border-[var(--color-accent)] transition-colors">
              <ImagePlus size={22} className="text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-muted)] mt-1">Subir PNG o JPG</span>
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setLogoFile(e.target.files[0]); }} />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Posición</p>
            <div className="grid grid-cols-3 gap-1.5 w-32">
              {POSITIONS.map((p) => (
                <button key={p.id} onClick={() => setPosition(p.id)} className={['aspect-square rounded-lg border text-base transition-colors', position === p.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'].join(' ')}>{p.label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Tamaño</label><span className="text-[var(--color-text-secondary)]">{scale}% del ancho</span></div>
            <input type="range" min={5} max={80} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Opacidad</label><span className="text-[var(--color-text-secondary)]">{opacity}%</span></div>
            <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={apply} disabled={!pdf || !logo || loading} loading={loading} label="Aplicar marca y descargar" className="w-full" />
      </div>
    </div>
  );
}
