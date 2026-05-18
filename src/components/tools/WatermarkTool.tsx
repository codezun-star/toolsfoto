import { useState, useEffect, useRef } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';

type Position = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';
type WatermarkType = 'text' | 'image';

const POSITIONS: { id: Position; label: string }[] = [
  { id: 'tl', label: '↖' }, { id: 'tc', label: '↑' }, { id: 'tr', label: '↗' },
  { id: 'ml', label: '←' }, { id: 'mc', label: '·' }, { id: 'mr', label: '→' },
  { id: 'bl', label: '↙' }, { id: 'bc', label: '↓' }, { id: 'br', label: '↘' },
];

function getXY(pos: Position, cw: number, ch: number, ww: number, wh: number, margin: number) {
  const col = pos[1] === 'l' ? margin : pos[1] === 'r' ? cw - ww - margin : (cw - ww) / 2;
  const row = pos[0] === 't' ? margin : pos[0] === 'b' ? ch - wh - margin : (ch - wh) / 2;
  return { x: col, y: row };
}

export default function WatermarkTool() {
  const upload = useImageUpload();
  const [type, setType] = useState<WatermarkType>('text');
  const [text, setText] = useState('© ToolsFoto');
  const [fontSize, setFontSize] = useState(40);
  const [opacity, setOpacity] = useState(70);
  const [position, setPosition] = useState<Position>('br');
  const [color, setColor] = useState('#ffffff');
  const [wmFile, setWmFile] = useState<File | null>(null);
  const [wmUrl, setWmUrl] = useState<string | null>(null);
  const [wmSize, setWmSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const { download } = useDownload(upload.image?.file.name);

  useEffect(() => {
    if (!upload.image || !previewRef.current) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = async () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = opacity / 100;

      if (type === 'text') {
        const fs = Math.round((img.naturalWidth / 800) * fontSize);
        ctx.font = `bold ${fs}px system-ui, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        const metrics = ctx.measureText(text);
        const ww = metrics.width;
        const wh = fs;
        const margin = Math.round(img.naturalWidth * 0.02);
        const { x, y } = getXY(position, canvas.width, canvas.height, ww, wh, margin);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = Math.max(2, fs / 20);
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      } else if (wmUrl) {
        const wmImg = new Image();
        wmImg.onload = () => {
          const ww = Math.round(img.naturalWidth * (wmSize / 100));
          const wh = Math.round((wmImg.naturalHeight / wmImg.naturalWidth) * ww);
          const margin = Math.round(img.naturalWidth * 0.02);
          const { x, y } = getXY(position, canvas.width, canvas.height, ww, wh, margin);
          ctx.drawImage(wmImg, x, y, ww, wh);
        };
        wmImg.src = wmUrl;
      }

      ctx.globalAlpha = 1;
    };
    img.src = upload.image.url;
  }, [upload.image, type, text, fontSize, opacity, position, color, wmUrl, wmSize]);

  function handleWmFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (wmUrl) URL.revokeObjectURL(wmUrl);
    const url = URL.createObjectURL(file);
    setWmFile(file);
    setWmUrl(url);
  }

  async function handleApply() {
    if (!upload.image || !previewRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const blob = await canvasToBlob(previewRef.current, upload.image.file.type);
      const ext = upload.image.file.name.split('.').pop() ?? 'png';
      download(blob, 'marca-de-agua', ext);
    } catch {
      setError('Error al aplicar la marca de agua.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {!upload.image ? (
          <ImageUploader
            image={upload.image} error={upload.error} isDragging={upload.isDragging}
            onDrop={upload.onDrop} onDragOver={upload.onDragOver} onDragLeave={upload.onDragLeave}
            onFileChange={upload.onFileChange} onClear={upload.clearImage}
          />
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="bg-[#F8F8F8] p-4 flex items-center justify-center min-h-48">
              <canvas ref={previewRef} className="max-w-full max-h-64 object-contain" />
            </div>
            <div className="px-4 py-2 border-t border-[var(--color-border)] flex justify-end">
              <button onClick={upload.clearImage} className="text-xs text-[var(--color-accent)] hover:underline">Cambiar imagen</button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div className="flex gap-2">
            {(['text', 'image'] as WatermarkType[]).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={['flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                  type === t ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}
              >
                {t === 'text' ? 'Texto' : 'Imagen'}
              </button>
            ))}
          </div>

          {type === 'text' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">Texto</label>
                <input type="text" value={text} onChange={e => setText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]" />
              </div>
              <Slider label="Tamaño" value={fontSize} min={10} max={120} onChange={setFontSize} />
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[var(--color-text)]">Color</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="h-8 w-14 rounded border border-[var(--color-border)] cursor-pointer" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--color-text)]">Imagen de marca de agua</label>
              <input type="file" accept="image/*" onChange={handleWmFileChange}
                className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--color-bg)] file:text-[var(--color-text-secondary)] file:font-medium hover:file:bg-[var(--color-border)]" />
              <Slider label="Tamaño" value={wmSize} min={5} max={80} unit="%" onChange={setWmSize} />
            </div>
          )}

          <Slider label="Opacidad" value={opacity} min={10} max={100} unit="%" onChange={setOpacity} />

          <div>
            <label className="text-sm font-medium text-[var(--color-text)] mb-2 block">Posición</label>
            <div className="grid grid-cols-3 gap-1.5 w-28">
              {POSITIONS.map(p => (
                <button key={p.id} onClick={() => setPosition(p.id)}
                  className={['aspect-square rounded text-base font-bold transition-colors',
                    position === p.id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg)] hover:bg-[var(--color-border)]'].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleApply} loading={loading} disabled={!upload.image} label="Aplicar y descargar" className="w-full" />
      </div>
    </div>
  );
}
