import { useState, useRef } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { formatBytes } from '@/lib/utils/format';
import Slider from '@/components/ui/Slider';
import { Download, Loader2 } from 'lucide-react';

export default function MezclarAudiosTool() {
  const [audio1, setAudio1] = useState<AudioFile | null>(null);
  const [audio1Url, setAudio1Url] = useState<string | null>(null);
  const [audio2, setAudio2] = useState<AudioFile | null>(null);
  const [audio2Url, setAudio2Url] = useState<string | null>(null);
  const [vol1, setVol1] = useState(100);
  const [vol2, setVol2] = useState(80);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audio2InputRef = useRef<HTMLInputElement>(null);

  function handleFile1(f: AudioFile) {
    if (audio1Url) URL.revokeObjectURL(audio1Url);
    setAudio1(f);
    setAudio1Url(URL.createObjectURL(f.file));
    if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null); }
    setError(null);
  }

  function handleClear1() {
    if (audio1Url) URL.revokeObjectURL(audio1Url);
    setAudio1(null);
    setAudio1Url(null);
  }

  function handleFile2(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audio2Url) URL.revokeObjectURL(audio2Url);
    const af: AudioFile = { file, name: file.name, size: file.size, type: file.type };
    setAudio2(af);
    setAudio2Url(URL.createObjectURL(file));
    if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null); }
    setError(null);
  }

  function handleClear2() {
    if (audio2Url) URL.revokeObjectURL(audio2Url);
    setAudio2(null);
    setAudio2Url(null);
  }

  function handleClearAll() {
    handleClear1();
    handleClear2();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!audio1 || !audio2) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const ff = new FFmpeg();
      ff.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)));
      await ff.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      });
      await ff.writeFile('input1.mp3', await fetchFile(audio1.file));
      await ff.writeFile('input2.mp3', await fetchFile(audio2.file));
      const filter = `[0:a]volume=${vol1 / 100}[a1];[1:a]volume=${vol2 / 100}[a2];[a1][a2]amix=inputs=2:duration=longest[out]`;
      await ff.exec(['-i', 'input1.mp3', '-i', 'input2.mp3', '-filter_complex', filter, '-map', '[out]', 'output.mp3']);
      const data = await ff.readFile('output.mp3');
      const blob = new Blob([data], { type: 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al mezclar los audios. Comprueba que los formatos son compatibles.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'mezcla.mp3';
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Pista principal</p>
          <AudioUploader label="Sube la pista principal" onFile={handleFile1} onClear={handleClear1} current={audio1} />
          {audio1Url && <audio src={audio1Url} controls className="w-full mt-2" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Pista secundaria</p>
          {audio2 ? (
            <div className="relative">
              <div className="p-3 bg-white rounded-xl border border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-text)] truncate">{audio2.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(audio2.size)}</p>
              </div>
              <button onClick={handleClear2} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow text-[var(--color-text-muted)] hover:text-red-600 text-xs font-bold">×</button>
              {audio2Url && <audio src={audio2Url} controls className="w-full mt-2" />}
            </div>
          ) : (
            <button
              onClick={() => audio2InputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-sm"
            >
              Haz clic para seleccionar audio
            </button>
          )}
          <input ref={audio2InputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile2} />
        </div>
      </div>

      {audio1 && audio2 && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Volumen de mezcla</h2>
            <Slider label="Volumen pista principal" value={vol1} min={0} max={200} step={5} unit="%" onChange={setVol1} />
            <Slider label="Volumen pista secundaria" value={vol2} min={0} max={200} step={5} unit="%" onChange={setVol2} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Mezclar audios
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium">{progress === 0 ? 'Cargando procesador…' : `Mezclando… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio src={resultUrl} controls className="w-full" />
          <p className="text-sm text-[var(--color-text-muted)] text-center">{formatBytes(resultSize)}</p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar mezcla
          </button>
          <button onClick={handleClearAll} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Nueva mezcla
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
