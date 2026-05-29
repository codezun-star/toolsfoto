import { useState, useRef } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

function getExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'aac') return ext;
  return 'mp3';
}

const MIME: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' };

export default function InsertarAudioTool() {
  const [main, setMain] = useState<AudioFile | null>(null);
  const [mainUrl, setMainUrl] = useState<string | null>(null);
  const [insert, setInsert] = useState<AudioFile | null>(null);
  const [insertUrl, setInsertUrl] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const insertInputRef = useRef<HTMLInputElement>(null);

  function handleMain(f: AudioFile) {
    if (mainUrl) revokeURL(mainUrl);
    setMain(f);
    setMainUrl(URL.createObjectURL(f.file));
    if (resultUrl) { revokeURL(resultUrl); setResultUrl(null); }
    setError(null);
  }
  function clearMain() {
    if (mainUrl) revokeURL(mainUrl);
    setMain(null); setMainUrl(null);
  }
  function handleInsertFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (insertUrl) revokeURL(insertUrl);
    const af: AudioFile = { file, name: file.name, size: file.size };
    setInsert(af);
    setInsertUrl(URL.createObjectURL(file));
    if (resultUrl) { revokeURL(resultUrl); setResultUrl(null); }
    setError(null);
  }
  function clearInsert() {
    if (insertUrl) revokeURL(insertUrl);
    setInsert(null); setInsertUrl(null);
  }
  function clearAll() {
    clearMain(); clearInsert();
    if (resultUrl) revokeURL(resultUrl);
    setResultUrl(null); setResultSize(0); setError(null);
  }

  async function process() {
    if (!main || !insert) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const extM = getExt(main.name);
      const extI = getExt(insert.name);

      await ff.writeFile(`main.${extM}`, new Uint8Array(await main.file.arrayBuffer()));
      await ff.writeFile(`insert.${extI}`, new Uint8Array(await insert.file.arrayBuffer()));

      // Strategy: split main at insertAt, concat [before][insert][after]
      // Re-encode everything to mp3 for compatibility
      const filter = `[0:a]atrim=end=${insertAt}[before];[0:a]atrim=start=${insertAt}[after];[before][1:a][after]concat=n=3:v=0:a=1[out]`;
      await ff.exec([
        '-i', `main.${extM}`,
        '-i', `insert.${extI}`,
        '-filter_complex', filter,
        '-map', '[out]',
        'output.mp3',
      ]);

      const data = await ff.readFile('output.mp3') as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío. Prueba con otro formato de audio.');
      try { await ff.deleteFile(`main.${extM}`); } catch { /* ignore */ }
      try { await ff.deleteFile(`insert.${extI}`); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp3'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[InsertarAudio] Error FFmpeg:', err);
      setError('Error al insertar el audio. Asegúrate de que el tiempo de inserción está dentro de la duración del audio principal.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !main) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = main.name.replace(/\.[^.]+$/, '_insercion.mp3');
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Audio principal</p>
          <AudioUploader label="Sube el audio principal" onFile={handleMain} onClear={clearMain} current={main} />
          {mainUrl && <audio src={mainUrl} controls className="w-full mt-2" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Audio a insertar</p>
          {insert ? (
            <div className="relative">
              <div className="p-3 bg-white rounded-xl border border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-text)] truncate">{insert.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(insert.size)}</p>
              </div>
              <button onClick={clearInsert} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow text-[var(--color-text-muted)] hover:text-red-600 text-xs font-bold">×</button>
              {insertUrl && <audio src={insertUrl} controls className="w-full mt-2" />}
            </div>
          ) : (
            <button
              onClick={() => insertInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-sm"
            >
              Haz clic para seleccionar el audio a insertar
            </button>
          )}
          <input ref={insertInputRef} type="file" accept="audio/*" className="hidden" onChange={handleInsertFile} />
        </div>
      </div>

      {main && insert && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
            <h2 className="font-bold text-[var(--color-text)]">Posición de inserción</h2>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-text)]">Insertar en el segundo: {insertAt}s</label>
              <input type="range" value={insertAt} min={0} max={3600} step={0.5} onChange={(e) => setInsertAt(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
            </div>
            <input
              type="number"
              value={insertAt}
              min={0}
              step={0.1}
              onChange={(e) => setInsertAt(Number(e.target.value))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)]"
            />
            <p className="text-xs text-[var(--color-text-muted)]">El audio insertado quedará en la posición {insertAt}s del audio principal.</p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Insertar audio
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

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Audio insertado en el segundo {insertAt}. Tamaño: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <audio src={resultUrl} controls className="w-full" />
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar audio resultante
          </button>
          <button onClick={clearAll} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Nueva inserción
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
