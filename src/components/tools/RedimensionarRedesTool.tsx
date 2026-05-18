import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext, revokeURL } from '@/lib/utils/canvas';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useState } from 'react';

interface Preset { id: string; red: string; name: string; w: number; h: number }

const PRESETS: Preset[] = [
  { id: 'ig-post', red: 'Instagram', name: 'Post (cuadrado)', w: 1080, h: 1080 },
  { id: 'ig-story', red: 'Instagram', name: 'Story / Reels', w: 1080, h: 1920 },
  { id: 'ig-landscape', red: 'Instagram', name: 'Post (horizontal)', w: 1080, h: 566 },
  { id: 'twitter', red: 'Twitter / X', name: 'Post', w: 1200, h: 675 },
  { id: 'twitter-header', red: 'Twitter / X', name: 'Cabecera', w: 1500, h: 500 },
  { id: 'youtube-thumb', red: 'YouTube', name: 'Miniatura', w: 1280, h: 720 },
  { id: 'youtube-banner', red: 'YouTube', name: 'Banner canal', w: 2560, h: 1440 },
  { id: 'facebook-post', red: 'Facebook', name: 'Post', w: 1200, h: 630 },
  { id: 'linkedin', red: 'LinkedIn', name: 'Post', w: 1200, h: 627 },
  { id: 'tiktok', red: 'TikTok', name: 'Vídeo / Story', w: 1080, h: 1920 },
  { id: 'pinterest', red: 'Pinterest', name: 'Pin', w: 1000, h: 1500 },
  { id: 'whatsapp', red: 'WhatsApp', name: 'Icono / Perfil', w: 512, h: 512 },
];

const REDS = [...new Set(PRESETS.map((p) => p.red))];

export default function RedimensionarRedesTool() {
  const upload = useImageUpload();
  const { download } = useDownload();
  const [presetId, setPresetId] = useState('ig-post');
  const [mode, setMode] = useState<'cover' | 'contain'>('cover');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setResultUrl(null);
    upload.clear();
    setError(null);
  }

  async function process() {
    if (!upload.file) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const preset = PRESETS.find((p) => p.id === presetId)!;
      const img = await loadImage(upload.previewUrl!);
      const canvas = createCanvas(preset.w, preset.h);
      const ctx = getContext(canvas);

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, preset.w, preset.h);

      const srcRatio = img.naturalWidth / img.naturalHeight;
      const dstRatio = preset.w / preset.h;

      let dx = 0, dy = 0, dw = preset.w, dh = preset.h;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (mode === 'cover') {
        if (srcRatio > dstRatio) { sw = img.naturalHeight * dstRatio; sx = (img.naturalWidth - sw) / 2; }
        else { sh = img.naturalWidth / dstRatio; sy = (img.naturalHeight - sh) / 2; }
      } else {
        if (srcRatio > dstRatio) { dh = preset.w / srcRatio; dy = (preset.h - dh) / 2; }
        else { dw = preset.h * srcRatio; dx = (preset.w - dw) / 2; }
      }

      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al procesar la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  const selected = PRESETS.find((p) => p.id === presetId)!;

  return (
    <div className="space-y-6">
      <ImageUploader state={upload} onClear={handleClear} />

      {upload.file && !resultUrl && (
        <div className="space-y-5">
          {REDS.map((red) => (
            <div key={red}>
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">{red}</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.filter((p) => p.red === red).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPresetId(p.id)}
                    className={[
                      'px-3 py-2 rounded-xl border text-sm transition-colors',
                      presetId === p.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-semibold'
                        : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)] text-[var(--color-text-secondary)]',
                    ].join(' ')}
                  >
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-xs opacity-70">{p.w}×{p.h}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Ajuste de imagen</p>
            <div className="flex gap-2">
              {([['cover', 'Recortar (llenar)'], ['contain', 'Rellenar (con fondo)']] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={[
                    'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                    mode === id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)] text-[var(--color-text-secondary)]',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'contain' && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--color-text)]">Color de fondo:</span>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
              {['#FFFFFF', '#000000', '#F5F3EF'].map((c) => (
                <button key={c} onClick={() => setBgColor(c)} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-full border-2 ${bgColor === c ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`} />
              ))}
            </div>
          )}

          <button
            onClick={process}
            disabled={processing}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-60"
          >
            {processing ? 'Procesando…' : 'Redimensionar'}
          </button>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <img src={resultUrl} alt="Resultado" className="max-w-full rounded-xl border border-[var(--color-border)]" />
          <p className="text-sm text-center text-[var(--color-text-secondary)]">
            {selected.red} — {selected.name} · {selected.w} × {selected.h} px
          </p>
          <DownloadButton url={resultUrl} filename={download(upload.file!.name, 'jpg')} label="Descargar imagen" />
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otra imagen
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
