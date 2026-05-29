import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

function getOutputExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'aac') return ext;
  return 'mp3';
}

const LEVELS = [
  { label: 'Suave', sublabel: 'Leve reducción, preserva calidad', strength: 0.02 },
  { label: 'Medio', sublabel: 'Reducción moderada del ruido', strength: 0.05 },
  { label: 'Intenso', sublabel: 'Máxima reducción, puede afectar calidad', strength: 0.1 },
];

export default function ReducirRuidoAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [levelIdx, setLevelIdx] = useState(1);
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
      const buf = await audio.file.arrayBuffer();
      const ext = getOutputExt(audio.name);
      const s = LEVELS[levelIdx].strength;
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      // anlmdn = Adaptive LMS noise reduction filter
      await ff.exec([
        '-i', `input.${ext}`,
        '-af', `anlmdn=s=${s}:p=0.002:r=0.002:m=15`,
        `output.${ext}`,
      ]);

      const data = await ff.readFile(`output.${ext}`) as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío. Prueba con otro formato de audio.');
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile(`output.${ext}`); } catch { /* ignore */ }

      const mimeMap: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' };
      const blob = new Blob([data], { type: mimeMap[ext] ?? 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[ReducirRuidoAudio] Error FFmpeg:', err);
      setError('Error al reducir el ruido. Asegúrate de que el archivo es un formato de audio válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `_sin_ruido.${ext}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Nivel de reducción de ruido</h2>
            <div className="space-y-2">
              {LEVELS.map((l, i) => (
                <button
                  key={l.label}
                  onClick={() => setLevelIdx(i)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    levelIdx === i
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${levelIdx === i ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{l.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{l.sublabel}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Usa el filtro ANLMDN (Adaptive LMS). Efectivo con ruido de fondo constante (ventiladores, ambiente, hiss). El formato original se preserva.
            </p>
          </div>

          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Reducir ruido de fondo
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
            Sin ruido: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar audio sin ruido
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
