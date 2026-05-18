import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

type Position = 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type FontFamily = 'sans-serif' | 'serif' | 'monospace' | 'Impact';

const POSITIONS: { id: Position; label: string }[] = [
  { id: 'top-left', label: '↖' },
  { id: 'top-center', label: '↑' },
  { id: 'top-right', label: '↗' },
  { id: 'center', label: '⊙' },
  { id: 'bottom-left', label: '↙' },
  { id: 'bottom-center', label: '↓' },
  { id: 'bottom-right', label: '↘' },
];

const FONT_FAMILIES: { id: FontFamily; label: string }[] = [
  { id: 'sans-serif', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'monospace', label: 'Mono' },
  { id: 'Impact', label: 'Impact' },
];

const TEXT_COLORS = ['#FFFFFF', '#000000', '#E84827', '#FBBF24', '#34D399', '#60A5FA', '#F472B6'];

function resolveCoords(
  pos: Position,
  canvasW: number,
  canvasH: number,
  fontSize: number,
  padding: number,
): { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline } {
  const map: Record<Position, { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline }> = {
    'top-left':      { x: padding, y: padding + fontSize, align: 'left',   baseline: 'alphabetic' },
    'top-center':    { x: canvasW / 2, y: padding + fontSize, align: 'center', baseline: 'alphabetic' },
    'top-right':     { x: canvasW - padding, y: padding + fontSize, align: 'right', baseline: 'alphabetic' },
    'center':        { x: canvasW / 2, y: canvasH / 2, align: 'center', baseline: 'middle' },
    'bottom-left':   { x: padding, y: canvasH - padding, align: 'left', baseline: 'alphabetic' },
    'bottom-center': { x: canvasW / 2, y: canvasH - padding, align: 'center', baseline: 'alphabetic' },
    'bottom-right':  { x: canvasW - padding, y: canvasH - padding, align: 'right', baseline: 'alphabetic' },
  };
  return map[pos];
}

export default function TextOverlayTool() {
  const upload = useImageUpload();
  const [text, setText] = useState('Tu texto aquí');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState<FontFamily>('sans-serif');
  const [bold, setBold] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [outline, setOutline] = useState(true);
  const [outlineWidth, setOutlineWidth] = useState(2);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [opacity, setOpacity] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  async function handleApply() {
    if (!upload.image || !text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scaledFont = Math.round(fontSize * (w / 800));
      const padding = scaledFont;
      const canvas = createCanvas(w, h);
      const ctx = getContext(canvas);
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = opacity / 100;
      const weight = bold ? 'bold ' : '';
      ctx.font = `${weight}${scaledFont}px ${fontFamily}`;
      const { x, y, align, baseline } = resolveCoords(position, w, h, scaledFont, padding);
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      if (outline) {
        ctx.strokeStyle = color === '#FFFFFF' ? '#000000' : '#FFFFFF';
        ctx.lineWidth = outlineWidth * (w / 800);
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.globalAlpha = 1;
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'con-texto', 'jpg');
    } catch {
      setError('Error al procesar la imagen. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ImageUploader
          image={upload.image}
          error={upload.error}
          isDragging={upload.isDragging}
          onDrop={upload.onDrop}
          onDragOver={upload.onDragOver}
          onDragLeave={upload.onDragLeave}
          onFileChange={upload.onFileChange}
          onClear={upload.clearImage}
        />

        {upload.image && (
          <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]">
            <img src={upload.image.url} alt="Preview" className="w-full object-contain max-h-60" />
            <div
              className="absolute inset-0 flex pointer-events-none"
              style={{
                alignItems: position.startsWith('top') ? 'flex-start' : position === 'center' ? 'center' : 'flex-end',
                justifyContent: position.endsWith('left') ? 'flex-start' : position.endsWith('right') ? 'flex-end' : 'center',
                padding: '8px',
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: `${Math.max(12, fontSize * 0.18)}px`,
                  fontWeight: bold ? 'bold' : 'normal',
                  color,
                  opacity: opacity / 100,
                  textShadow: outline ? (color === '#FFFFFF' ? '1px 1px 2px #000' : '1px 1px 2px #fff') : 'none',
                  wordBreak: 'break-word',
                  textAlign: position.endsWith('center') ? 'center' : position.endsWith('left') ? 'left' : 'right',
                }}
              >
                {text}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] block mb-1">Texto</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={200}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] resize-none focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <Slider label="Tamaño" value={fontSize} min={12} max={200} step={4} unit="px" onChange={setFontSize} />
          <Slider label="Opacidad" value={opacity} min={10} max={100} step={5} unit="%" onChange={setOpacity} />

          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Fuente</p>
            <div className="flex gap-2">
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id)}
                  className={[
                    'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    fontFamily === f.id
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]',
                  ].join(' ')}
                  style={{ fontFamily: f.id }}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={() => setBold((v) => !v)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                  bold
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]',
                ].join(' ')}
              >
                B
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Color del texto</p>
            <div className="flex flex-wrap gap-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: color === c ? 'var(--color-accent)' : 'var(--color-border)' }}
                  aria-label={c}
                />
              ))}
              <label className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={outline}
                onChange={(e) => setOutline(e.target.checked)}
                className="accent-[var(--color-accent)] w-4 h-4"
              />
              <span className="text-sm text-[var(--color-text)]">Contorno</span>
            </label>
            {outline && (
              <div className="flex-1">
                <Slider label="" value={outlineWidth} min={1} max={8} step={1} unit="px" onChange={setOutlineWidth} />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Posición</p>
            <div className="grid grid-cols-3 gap-1.5 w-28">
              {POSITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPosition(p.id)}
                  className={[
                    'py-1.5 rounded text-sm border transition-colors',
                    position === p.id
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleApply}
          disabled={!upload.image || !text.trim() || loading}
          loading={loading}
          className="w-full"
        />
      </div>
    </div>
  );
}
