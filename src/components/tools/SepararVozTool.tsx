import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const MIME_MAP: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac', m4a: 'audio/mp4' };

function getExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? 'mp3';
}

export default function SepararVozTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [vocalUrl, setVocalUrl] = useState<string | null>(null);
  const [vocalSize, setVocalSize] = useState(0);
  const [instUrl, setInstUrl] = useState<string | null>(null);
  const [instSize, setInstSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (vocalUrl) revokeURL(vocalUrl);
    if (instUrl) revokeURL(instUrl);
    setAudio(null);
    setVocalUrl(null);
    setVocalSize(0);
    setInstUrl(null);
    setInstSize(0);
    setError(null);
    setProgress(0);
  }

  async function process() {
    if (!audio) return;
    if (vocalUrl) revokeURL(vocalUrl);
    if (instUrl) revokeURL(instUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(Math.round(p * 0.9)));
      const ext = getExt(audio.file.name);
      const inputName = `input.${ext}`;
      const buf = await audio.file.arrayBuffer();
      await ff.writeFile(inputName, new Uint8Array(buf));

      // Vocal extraction: center channel (L+R)/2 — usually where lead vocals sit
      // Instrumental: mid-side technique (L-R)/2 — removes centered content
      try {
        await ff.exec([
          '-i', inputName,
          '-filter_complex',
          '[0:a]pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1[voc];[0:a]pan=stereo|c0=c0-c1|c1=c1-c0[inst]',
          '-map', '[voc]', '-acodec', 'libmp3lame', '-q:a', '3', 'vocals.mp3',
          '-map', '[inst]', '-acodec', 'libmp3lame', '-q:a', '3', 'instrumental.mp3'
        ]);
      } catch (err) {
        console.error('[SepararVoz] FFmpeg error:', err);
        throw err;
      }

      const vocalData = await ff.readFile('vocals.mp3') as Uint8Array;
      if (!vocalData || vocalData.length === 0) throw new Error('El procesador produjo un archivo de voz vacío.');
      const instData = await ff.readFile('instrumental.mp3') as Uint8Array;
      if (!instData || instData.length === 0) throw new Error('El procesador produjo un archivo instrumental vacío.');
      await ff.deleteFile(inputName).catch(() => {});
      await ff.deleteFile('vocals.mp3').catch(() => {});
      await ff.deleteFile('instrumental.mp3').catch(() => {});

      const vocalBlob = new Blob([vocalData], { type: 'audio/mpeg' });
      const instBlob = new Blob([instData], { type: 'audio/mpeg' });
      setVocalSize(vocalBlob.size);
      setVocalUrl(URL.createObjectURL(vocalBlob));
      setInstSize(instBlob.size);
      setInstUrl(URL.createObjectURL(instBlob));
      setProgress(100);
    } catch {
      setError('Error al separar el audio. Asegúrate de que el archivo es estéreo y está en un formato compatible.');
    } finally {
      setProcessing(false);
    }
  }

  function dlVocal() {
    if (!vocalUrl || !audio) return;
    const a = document.createElement('a');
    a.href = vocalUrl;
    a.download = audio.file.name.replace(/\.[^.]+$/, '_vocal.mp3');
    a.click();
  }

  function dlInst() {
    if (!instUrl || !audio) return;
    const a = document.createElement('a');
    a.href = instUrl;
    a.download = audio.file.name.replace(/\.[^.]+$/, '_instrumental.mp3');
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !vocalUrl && !processing && (
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-tools-bg)] border border-[var(--color-tools-border)] rounded-xl text-sm text-[var(--color-text-secondary)]">
            <p className="font-semibold text-[var(--color-text)] mb-1">¿Cómo funciona?</p>
            <p>Utiliza la técnica de extracción del canal central: la voz suele estar mezclada en el centro del estéreo. La pista vocal contiene el contenido central (L+R)/2, y el instrumental contiene el contenido lateral (L-R)/2.</p>
            <p className="mt-1">Funciona mejor con grabaciones comerciales donde la voz está centrada.</p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Separar voz e instrumental
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm">{progress === 0 ? 'Cargando procesador…' : `Separando pistas… ${progress}%`}</p>
          {progress > 0 && <div className="w-full bg-[var(--color-border)] rounded-full h-2"><div className="bg-[var(--color-accent)] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>}
        </div>
      )}

      {vocalUrl && instUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Pista vocal</p>
              <audio src={vocalUrl} controls className="w-full mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(vocalSize)}</span>
                <button onClick={dlVocal} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--color-accent)] text-white rounded-lg hover:bg-[#C93D1E] transition-colors">
                  <Download size={13} /> Descargar vocal
                </button>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] pt-4">
              <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Pista instrumental</p>
              <audio src={instUrl} controls className="w-full mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(instSize)}</span>
                <button onClick={dlInst} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--color-accent)] text-white rounded-lg hover:bg-[#C93D1E] transition-colors">
                  <Download size={13} /> Descargar instrumental
                </button>
              </div>
            </div>
          </div>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Separar otro audio</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
