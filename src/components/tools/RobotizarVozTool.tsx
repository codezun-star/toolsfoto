import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const PRESETS = [
  {
    label: 'Robot estándar',
    description: 'Voz metálica con ecos cortos',
    filter: 'aecho=0.8:0.9:10:0.9|20:0.7|30:0.5,asetrate=44100*1.02,aresample=44100',
  },
  {
    label: 'Robot grave',
    description: 'Versión más profunda y grave',
    filter: 'asetrate=44100*0.85,aresample=44100,aecho=0.8:0.9:8:0.8|16:0.6',
  },
  {
    label: 'Alien',
    description: 'Tono extraterrestre con vibración',
    filter: 'vibrato=f=10:d=0.9,aecho=0.8:0.88:5:0.8|12:0.5|20:0.3',
  },
  {
    label: 'Cibernético',
    description: 'Procesado digital extremo',
    filter: 'asetrate=44100*1.05,aresample=44100,aecho=0.9:0.9:5:0.95|10:0.8|15:0.6|20:0.4',
  },
];

function getOutputExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'aac') return ext;
  return 'mp3';
}

const MIME: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' };

export default function RobotizarVozTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [preset, setPreset] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setAudio(null);
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
      const ext = getOutputExt(audio.name);
      const buf = await audio.file.arrayBuffer();
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));
      await ff.exec(['-i', `input.${ext}`, '-af', PRESETS[preset]!.filter, `output.${ext}`]);
      const data = await ff.readFile(`output.${ext}`) as Uint8Array;
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile(`output.${ext}`); } catch { /* ignore */ }
      const blob = new Blob([data], { type: MIME[ext] ?? 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[RobotizarVoz] Error FFmpeg:', err);
      setError('Error al aplicar el efecto. Asegúrate de que el archivo es un formato de audio válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `_robot.${ext}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
            <h2 className="font-bold text-[var(--color-text)]">Efecto de robot</h2>
            <div className="space-y-2">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => setPreset(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    preset === i
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${preset === i ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{p.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Aplicar efecto robot
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
            Original: <strong className="text-[var(--color-text)]">{formatBytes(audio.size)}</strong> →
            Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <audio src={resultUrl} controls className="w-full" />
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar audio robotizado
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
