import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const SPEEDS = [
  { value: 0.5, label: '0.5×', desc: 'Mitad de velocidad' },
  { value: 0.75, label: '0.75×', desc: 'Ligeramente lento' },
  { value: 1.25, label: '1.25×', desc: 'Ligeramente rápido' },
  { value: 1.5, label: '1.5×', desc: 'Rápido' },
  { value: 2, label: '2×', desc: 'Doble velocidad' },
];

function getOutputExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'aac' || ext === 'flac') return ext;
  return 'mp3';
}

export default function VelocidadAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [speed, setSpeed] = useState(1.5);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setAudio(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!audio) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const buf = await audio.file.arrayBuffer();
      const ext = getOutputExt(audio.name);
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      // atempo range 0.5-2.0; chain for outside range
      let atempoFilter: string;
      if (speed >= 0.5 && speed <= 2.0) {
        atempoFilter = `atempo=${speed}`;
      } else if (speed < 0.5) {
        atempoFilter = `atempo=${speed * 2},atempo=0.5`;
      } else {
        atempoFilter = `atempo=2.0,atempo=${speed / 2}`;
      }

      await ff.exec(['-i', `input.${ext}`, '-af', atempoFilter, `output.${ext}`]);
      const data = await ff.readFile(`output.${ext}`) as Uint8Array;
      await ff.deleteFile(`input.${ext}`);
      await ff.deleteFile(`output.${ext}`);

      const mime = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : ext === 'ogg' ? 'audio/ogg' : 'audio/aac';
      const blob = new Blob([data], { type: mime });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al cambiar la velocidad del audio. Asegúrate de que el archivo es un formato de audio válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `_${speed}x.${ext}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Velocidad</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={[
                    'px-3 py-3 rounded-xl border text-left transition-colors',
                    speed === s.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)]',
                  ].join(' ')}
                >
                  <span className={`block text-base font-extrabold ${speed === s.value ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{s.label}</span>
                  <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 bg-[var(--color-tools-bg)] rounded-xl text-xs text-[var(--color-text-secondary)]">
            El tono (pitch) se preserva usando el filtro <code>atempo</code> de FFmpeg.
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Cambiar velocidad
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
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Original: <strong className="text-[var(--color-text)]">{formatBytes(audio.size)}</strong></span>
            <span className="text-[var(--color-text-secondary)]">Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar audio ({speed}×)
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
