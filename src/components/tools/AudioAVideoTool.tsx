import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, Image } from 'lucide-react';

const BG_COLORS = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#2d6a4f', '#1b4332', '#6b2737', '#333333'];

export default function AudioAVideoTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [bgImage, setBgImage] = useState<File | null>(null);
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [useImage, setUseImage] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setAudio(null);
    setBgImage(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!audio) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const audioBuf = await audio.file.arrayBuffer();
      const audioExt = audio.name.split('.').pop()?.toLowerCase() ?? 'mp3';
      await ff.writeFile(`audio.${audioExt}`, new Uint8Array(audioBuf));

      let args: string[];
      if (useImage && bgImage) {
        const imgBuf = await bgImage.arrayBuffer();
        const imgExt = bgImage.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        await ff.writeFile(`bg.${imgExt}`, new Uint8Array(imgBuf));
        args = [
          '-loop', '1', '-i', `bg.${imgExt}`,
          '-i', `audio.${audioExt}`,
          '-c:v', 'libx264', '-tune', 'stillimage',
          '-c:a', 'aac', '-b:a', '192k',
          '-pix_fmt', 'yuv420p',
          '-shortest', 'output.mp4',
        ];
      } else {
        // Strip # from hex and convert to FFmpeg color format
        const color = bgColor.replace('#', '0x');
        args = [
          '-f', 'lavfi', '-i', `color=c=${color}:size=1280x720:rate=25`,
          '-i', `audio.${audioExt}`,
          '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '192k',
          '-pix_fmt', 'yuv420p',
          '-shortest', 'output.mp4',
        ];
      }

      try {
        await ff.exec(args);
      } catch (err) {
        console.error('[AudioAVideo] Error FFmpeg:', err);
        throw err;
      }

      const data = await ff.readFile('output.mp4') as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío. Prueba con otro formato de audio.');
      try { await ff.deleteFile(`audio.${audioExt}`); } catch { /* ignore */ }
      if (useImage && bgImage) { try { await ff.deleteFile(`bg.${bgImage.name.split('.').pop()?.toLowerCase()}`); } catch { /* ignore */ } }
      try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[AudioAVideo]', err);
      setError('Error al crear el vídeo. Asegúrate de que el audio es un formato válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, '.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Fondo del vídeo</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setUseImage(false)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  !useImage
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                }`}
              >
                Color sólido
              </button>
              <button
                onClick={() => setUseImage(true)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  useImage
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                }`}
              >
                Imagen
              </button>
            </div>

            {!useImage && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text)] mb-2">Color de fondo</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {BG_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'border-[var(--color-accent)] scale-110' : 'border-transparent'}`}
                    />
                  ))}
                  <label className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] overflow-hidden cursor-pointer">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 -ml-1 -mt-1 cursor-pointer" />
                  </label>
                </div>
              </div>
            )}

            {useImage && (
              <div>
                <label className="flex items-center gap-3 p-4 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-accent)] transition-colors">
                  <Image size={20} className="text-[var(--color-text-muted)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {bgImage ? bgImage.name : 'Seleccionar imagen de fondo (JPG, PNG)'}
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setBgImage(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            )}
          </div>
          <button
            onClick={process}
            disabled={useImage && !bgImage}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear vídeo MP4
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && audio && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Vídeo creado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar vídeo MP4
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
