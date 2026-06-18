import { useState, useRef, useEffect } from 'react';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { Mic, Square, Download, Loader2, Music } from 'lucide-react';

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function GrabarAudioTool() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState('audio/webm');
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  function reset() {
    if (url) revokeURL(url);
    setUrl(null);
    blobRef.current = null;
    setSeconds(0);
    setError(null);
  }

  async function start() {
    reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = ['audio/webm', 'audio/ogg', 'audio/mp4'];
      const chosen = preferred.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || '';
      const rec = chosen ? new MediaRecorder(stream, { mimeType: chosen }) : new MediaRecorder(stream);
      setMime(chosen || rec.mimeType || 'audio/webm');
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chosen || 'audio/webm' });
        blobRef.current = blob;
        setUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError('No se pudo acceder al micrófono. Concede el permiso en tu navegador e inténtalo de nuevo.');
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function ext(): string {
    return mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm';
  }

  function download() {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `grabacion.${ext()}`;
    a.click();
  }

  async function toMp3() {
    if (!blobRef.current) return;
    setConverting(true);
    setError(null);
    try {
      const ff = await createFFmpeg();
      const inName = `rec.${ext()}`;
      const file = new File([blobRef.current], inName, { type: mime });
      const blob = await runFFmpeg(ff, file, inName, ['-c:a', 'libmp3lame', '-b:a', '192k'], 'out.mp3');
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = 'grabacion.mp3';
      a.click();
      revokeURL(u);
    } catch {
      setError('No se pudo convertir a MP3. Puedes descargar la grabación en su formato original.');
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-8 bg-white rounded-xl border border-[var(--color-border)] flex flex-col items-center gap-5">
        <div className={`text-4xl font-mono font-bold ${recording ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{fmt(seconds)}</div>
        {!recording ? (
          <button onClick={start} className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Mic size={18} /> {url ? 'Grabar de nuevo' : 'Empezar a grabar'}
          </button>
        ) : (
          <button onClick={stop} className="flex items-center gap-2 px-6 py-3 bg-[var(--color-text)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
            <Square size={16} /> Detener
          </button>
        )}
        {recording && <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Grabando…</p>}
      </div>

      {url && !recording && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio controls src={url} className="w-full" />
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={download} className="flex-1 flex items-center justify-center gap-2 py-3 border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] transition-colors">
              <Download size={16} /> Descargar .{ext()}
            </button>
            <button onClick={toMp3} disabled={converting} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] disabled:opacity-50 transition-colors">
              {converting ? <Loader2 size={16} className="animate-spin" /> : <Music size={16} />}
              {converting ? 'Convirtiendo…' : 'Descargar MP3'}
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] text-center">La conversión a MP3 descarga el procesador (~30 MB) la primera vez. La grabación nunca sale de tu dispositivo.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
