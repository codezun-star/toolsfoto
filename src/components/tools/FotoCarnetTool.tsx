import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext, revokeURL } from '@/lib/utils/canvas';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useState } from 'react';

interface PhotoSize { id: string; label: string; desc: string; w: number; h: number }

const PHOTO_SIZES: PhotoSize[] = [
  { id: 'dni', label: 'DNI / Carnet español', desc: '26 × 32 mm (307 × 378 px)', w: 307, h: 378 },
  { id: 'pasaporte', label: 'Pasaporte España / ICAO', desc: '35 × 45 mm (413 × 531 px)', w: 413, h: 531 },
  { id: 'pasaporte-usa', label: 'Pasaporte USA', desc: '2 × 2 in (600 × 600 px)', w: 600, h: 600 },
  { id: 'visa', label: 'Visa / Schengen', desc: '35 × 45 mm (413 × 531 px)', w: 413, h: 531 },
  { id: '4x4', label: 'Carnet 4 × 4 cm', desc: '4 × 4 cm (472 × 472 px)', w: 472, h: 472 },
  { id: 'linkedin', label: 'Foto perfil LinkedIn', desc: '400 × 400 px', w: 400, h: 400 },
];

export default function FotoCarnetTool() {
  const upload = useImageUpload();
  const { download } = useDownload(upload.image?.file.name);
  const [sizeId, setSizeId] = useState('pasaporte');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    upload.clearImage();
    setError(null);
  }

  async function process() {
    if (!upload.image) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const size = PHOTO_SIZES.find((s) => s.id === sizeId)!;
      const img = await loadImage(upload.image.url);
      const canvas = createCanvas(size.w, size.h);
      const ctx = getContext(canvas);

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size.w, size.h);

      const srcAspect = img.naturalWidth / img.naturalHeight;
      const dstAspect = size.w / size.h;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (srcAspect > dstAspect) {
        sw = img.naturalHeight * dstAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / dstAspect;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size.w, size.h);

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al procesar la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  const selected = PHOTO_SIZES.find((s) => s.id === sizeId)!;

  return (
    <div className="space-y-6">
      <ImageUploader
        image={upload.image}
        error={upload.error}
        isDragging={upload.isDragging}
        onDrop={upload.onDrop}
        onDragOver={upload.onDragOver}
        onDragLeave={upload.onDragLeave}
        onFileChange={upload.onFileChange}
        onClear={handleClear}
      />

      {upload.image && !resultUrl && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Tipo de foto</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PHOTO_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSizeId(s.id)}
                  className={[
                    'text-left px-4 py-3 rounded-xl border transition-colors',
                    sizeId === s.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)]',
                  ].join(' ')}
                >
                  <span className={`block text-sm font-bold ${sizeId === s.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{s.label}</span>
                  <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[var(--color-text)]">Color de fondo:</label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
            {['#FFFFFF', '#DCE9FF', '#E8F5E9'].map((c) => (
              <button key={c} onClick={() => setBgColor(c)} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'border-[var(--color-accent)] scale-110' : 'border-[var(--color-border)]'}`} />
            ))}
          </div>

          <button
            onClick={process}
            disabled={processing}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-60"
          >
            {processing ? 'Generando…' : 'Generar foto carnet'}
          </button>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src={resultUrl}
              alt="Foto carnet"
              className="rounded-xl border border-[var(--color-border)] shadow-sm"
              style={{ maxHeight: 320 }}
            />
          </div>
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            {selected.label} — {selected.w} × {selected.h} px
          </p>
          <DownloadButton
            onClick={() => { if (resultBlob) download(resultBlob, 'carnet', 'jpg'); }}
            disabled={!resultBlob}
            label="Descargar foto carnet"
            className="w-full"
          />
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otra imagen
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
