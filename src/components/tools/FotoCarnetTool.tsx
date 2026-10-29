import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext, revokeURL } from '@/lib/utils/canvas';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useState } from 'react';

interface PhotoSize { id: string; label: string; desc: string; w: number; h: number }

/** Medidas oficiales a 300 ppp (px = mm / 25,4 × 300). */
const PHOTO_SIZES: PhotoSize[] = [
  { id: 'dni', label: 'DNI y pasaporte de España', desc: '26 × 32 mm (307 × 378 px)', w: 307, h: 378 },
  { id: 'pasaporte', label: 'Pasaporte / visado ICAO (UE, Reino Unido)', desc: '35 × 45 mm (413 × 531 px)', w: 413, h: 531 },
  { id: 'visa', label: 'Visado Schengen', desc: '35 × 45 mm (413 × 531 px)', w: 413, h: 531 },
  { id: 'pasaporte-usa', label: 'Pasaporte y visa de EE. UU.', desc: '2 × 2 in (600 × 600 px)', w: 600, h: 600 },
  { id: 'mx-pasaporte', label: 'Tamaño pasaporte 3,5 × 4,5 cm', desc: '35 × 45 mm (413 × 531 px)', w: 413, h: 531 },
  { id: 'mx-infantil', label: 'Tamaño infantil (México)', desc: '2,5 × 3 cm (295 × 354 px)', w: 295, h: 354 },
  { id: '4x4', label: 'Carnet 4 × 4 cm', desc: '4 × 4 cm (472 × 472 px)', w: 472, h: 472 },
  { id: 'canada', label: 'Pasaporte de Canadá', desc: '50 × 70 mm (591 × 827 px)', w: 591, h: 827 },
  { id: 'china', label: 'Visado de China', desc: '33 × 48 mm (390 × 567 px)', w: 390, h: 567 },
  { id: 'linkedin', label: 'Foto perfil LinkedIn', desc: '400 × 400 px', w: 400, h: 400 },
];

/** Hoja de 15 × 10 cm a 300 ppp (el tamaño de foto estándar de cualquier tienda o máquina de revelado). */
const SHEET_W = 1772;
const SHEET_H = 1181;

interface Props {
  /** Tipo de foto seleccionado al abrir. Lo usan las páginas por país o documento. */
  initialSize?: string;
}

export default function FotoCarnetTool({ initialSize = 'pasaporte' }: Props) {
  const upload = useImageUpload();
  const { download } = useDownload(upload.image?.file.name);
  const [sizeId, setSizeId] = useState(PHOTO_SIZES.some((p) => p.id === initialSize) ? initialSize : 'pasaporte');
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

  /** Varias copias en una hoja de 15 × 10 cm con guías de corte, lista para revelar. */
  async function downloadSheet() {
    if (!resultUrl) return;
    const img = await loadImage(resultUrl);
    const gap = 24; // 2 mm
    const cols = Math.max(1, Math.floor((SHEET_W - gap) / (selected.w + gap)));
    const rows = Math.max(1, Math.floor((SHEET_H - gap) / (selected.h + gap)));
    const ox = (SHEET_W - (cols * selected.w + (cols - 1) * gap)) / 2;
    const oy = (SHEET_H - (rows * selected.h + (rows - 1) * gap)) / 2;
    const sheet = createCanvas(SHEET_W, SHEET_H);
    const ctx = getContext(sheet);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, SHEET_W, SHEET_H);
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * (selected.w + gap);
        const y = oy + r * (selected.h + gap);
        ctx.drawImage(img, x, y, selected.w, selected.h);
        ctx.strokeRect(x - 0.5, y - 0.5, selected.w + 1, selected.h + 1);
      }
    }
    const blob = await canvasToBlob(sheet, 'image/jpeg', 0.95);
    download(blob, `hoja-10x15-${cols * rows}-copias`, 'jpg');
  }

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
          <button
            onClick={downloadSheet}
            className="w-full py-3 rounded-xl border border-[var(--color-border)] bg-white text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors"
          >
            Descargar hoja para imprimir (10 × 15 cm, varias copias)
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otra imagen
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
