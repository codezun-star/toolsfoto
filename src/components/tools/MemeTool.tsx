import { useState, useEffect, useRef } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { canvasToBlob } from '@/lib/utils/canvas';

function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  position: 'top' | 'bottom',
) {
  if (!text.trim()) return;
  ctx.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(3, fontSize / 10);
  ctx.textAlign = 'center';
  ctx.textBaseline = position === 'top' ? 'top' : 'bottom';
  ctx.lineJoin = 'round';

  const words = text.toUpperCase().split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const lineH = fontSize * 1.15;
  const totalH = lines.length * lineH;
  const startY = position === 'top' ? y : y - totalH + lineH;

  for (let i = 0; i < lines.length; i++) {
    const ly = startY + i * lineH;
    ctx.strokeText(lines[i], x, ly);
    ctx.fillText(lines[i], x, ly);
  }
}

export default function MemeTool() {
  const upload = useImageUpload();
  const [topText, setTopText] = useState('CUANDO');
  const [bottomText, setBottomText] = useState('LO LOGRAS');
  const [fontSize, setFontSize] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { download } = useDownload(upload.image?.file.name);

  useEffect(() => {
    if (!upload.image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const fs = Math.round((img.naturalWidth / 800) * fontSize);
      const margin = Math.round(img.naturalWidth * 0.03);
      drawMemeText(ctx, topText, canvas.width / 2, margin, canvas.width - margin * 2, fs, 'top');
      drawMemeText(ctx, bottomText, canvas.width / 2, canvas.height - margin, canvas.width - margin * 2, fs, 'bottom');
    };
    img.src = upload.image.url;
  }, [upload.image, topText, bottomText, fontSize]);

  async function handleDownload() {
    if (!canvasRef.current || !upload.image) return;
    setLoading(true);
    try {
      const blob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.92);
      download(blob, 'meme', 'jpg');
    } catch {
      setError('Error al generar el meme.');
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
            <div className="bg-black flex items-center justify-center min-h-48">
              <canvas ref={canvasRef} className="max-w-full max-h-72 object-contain" />
            </div>
            <div className="px-4 py-2 border-t border-[var(--color-border)] flex justify-end">
              <button onClick={upload.clearImage} className="text-xs text-[var(--color-accent)] hover:underline">Cambiar imagen</button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Texto del meme</h2>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-text)]">Texto superior</label>
            <input type="text" value={topText} onChange={e => setTopText(e.target.value)}
              placeholder="Texto arriba..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm uppercase focus:outline-none focus:border-[var(--color-accent)]" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-text)]">Texto inferior</label>
            <input type="text" value={bottomText} onChange={e => setBottomText(e.target.value)}
              placeholder="Texto abajo..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm uppercase focus:outline-none focus:border-[var(--color-accent)]" />
          </div>
          <Slider label="Tamaño de fuente" value={fontSize} min={20} max={120} onChange={setFontSize} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleDownload} loading={loading} disabled={!upload.image} label="Descargar meme" className="w-full" />
      </div>
    </div>
  );
}
