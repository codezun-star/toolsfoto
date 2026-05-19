import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext, revokeURL } from '@/lib/utils/canvas';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useState } from 'react';

const W = 1280, H = 720;
const FONTS = ['Impact', 'Arial Black', 'Georgia', 'Montserrat'];
const POSITIONS = ['top-left', 'top-center', 'center', 'bottom-left', 'bottom-center', 'bottom-right'] as const;
type Pos = typeof POSITIONS[number];

function getTextXY(pos: Pos, w: number, h: number, margin: number) {
  const x = pos.includes('left') ? margin : pos.includes('right') ? w - margin : w / 2;
  const y = pos.includes('top') ? margin + 60 : pos.includes('bottom') ? h - margin : h / 2;
  const align: CanvasTextAlign = pos.includes('left') ? 'left' : pos.includes('right') ? 'right' : 'center';
  return { x, y, align };
}

export default function ThumbnailYoutubeTool() {
  const upload = useImageUpload();
  const { download } = useDownload('thumbnail-youtube');
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [title, setTitle] = useState('');
  const [fontSize, setFontSize] = useState(80);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [font, setFont] = useState('Impact');
  const [textPos, setTextPos] = useState<Pos>('bottom-left');
  const [overlayOpacity, setOverlayOpacity] = useState(40);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    upload.clearImage();
    setError(null);
  }

  async function generate() {
    setProcessing(true);
    setError(null);
    if (resultUrl) revokeURL(resultUrl);
    try {
      const canvas = createCanvas(W, H);
      const ctx = getContext(canvas);

      if (upload.image) {
        const img = await loadImage(upload.image.url);
        const srcRatio = img.naturalWidth / img.naturalHeight;
        const dstRatio = W / H;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (srcRatio > dstRatio) { sw = img.naturalHeight * dstRatio; sx = (img.naturalWidth - sw) / 2; }
        else { sh = img.naturalWidth / dstRatio; sy = (img.naturalHeight - sh) / 2; }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);
      }

      if (overlayOpacity > 0) {
        ctx.fillStyle = `rgba(0,0,0,${overlayOpacity / 100})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (title.trim()) {
        const margin = 60;
        const { x, y, align } = getTextXY(textPos, W, H, margin);
        const maxWidth = W - margin * 2;
        ctx.font = `bold ${fontSize}px ${font}, sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = textPos.includes('center') ? 'middle' : textPos.includes('top') ? 'top' : 'bottom';

        const words = title.split(' ');
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
          else line = test;
        }
        if (line) lines.push(line);

        const lineH = fontSize * 1.25;
        const totalH = lines.length * lineH;
        let startY = y;
        if (ctx.textBaseline === 'middle') startY = y - totalH / 2 + lineH / 2;
        if (ctx.textBaseline === 'bottom') startY = y - totalH + lineH;

        lines.forEach((l, i) => {
          const ly = startY + i * lineH;
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = fontSize / 12;
          ctx.strokeText(l, x, ly);
          ctx.fillStyle = textColor;
          ctx.fillText(l, x, ly);
        });
      }

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al generar la miniatura.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)] text-sm text-[var(--color-text-secondary)]">
        Genera miniaturas en <strong className="text-[var(--color-text)]">1280 × 720 px</strong> (16:9). Sube una imagen de fondo o usa un color sólido.
      </div>

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

      {!upload.image && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-text)]">Color de fondo (si no hay imagen):</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
        </div>
      )}

      <div className="space-y-4">
        {upload.image && (
          <Slider label="Oscurecer fondo" value={overlayOpacity} onChange={setOverlayOpacity} min={0} max={90} step={5} unit="%" />
        )}

        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Título (opcional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Escribe el título de tu vídeo…"
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {title && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Color texto</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Fuente</label>
                <select value={font} onChange={(e) => setFont(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none">
                  {FONTS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <Slider label="Tamaño de texto" value={fontSize} onChange={setFontSize} min={40} max={140} step={4} unit="px" />
            <div>
              <p className="text-xs font-semibold text-[var(--color-text)] mb-2">Posición del texto</p>
              <div className="grid grid-cols-3 gap-1.5">
                {POSITIONS.map((p) => (
                  <button key={p} onClick={() => setTextPos(p)} className={['py-1.5 text-xs rounded-lg border transition-colors capitalize', textPos === p ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-semibold' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>
                    {p.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button
          onClick={generate}
          disabled={processing}
          className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-60"
        >
          {processing ? 'Generando…' : 'Generar miniatura'}
        </button>
      </div>

      {resultUrl && (
        <div className="space-y-4">
          <img src={resultUrl} alt="Miniatura" className="w-full rounded-xl border border-[var(--color-border)]" />
          <p className="text-center text-sm text-[var(--color-text-secondary)]">1280 × 720 px — listo para subir a YouTube</p>
          <DownloadButton
            onClick={() => { if (resultBlob) download(resultBlob, 'yt', 'jpg'); }}
            disabled={!resultBlob}
            label="Descargar miniatura JPG"
            className="w-full"
          />
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Crear nueva miniatura
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
