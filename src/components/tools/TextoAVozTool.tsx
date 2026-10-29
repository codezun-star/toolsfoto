import { useEffect, useRef, useState } from 'react';
import { Speech, Download, Play, Square } from 'lucide-react';
import type { VoiceId } from '@diffusionstudio/vits-web';
import { revokeURL } from '@/lib/utils/canvas';

interface VoiceOption { id: VoiceId; label: string; lang: string; mb: number }

/** Voces Piper (VITS) ordenadas por idioma. `mb`: peso aproximado del modelo. */
const VOICES: VoiceOption[] = [
  { id: 'es_ES-davefx-medium', label: 'Español (España) · Dave', lang: 'es-ES', mb: 63 },
  { id: 'es_ES-sharvard-medium', label: 'Español (España) · Sharvard', lang: 'es-ES', mb: 77 },
  { id: 'es_MX-claude-high', label: 'Español (México) · Claude, alta calidad', lang: 'es-MX', mb: 114 },
  { id: 'es_MX-ald-medium', label: 'Español (México) · Ald', lang: 'es-MX', mb: 63 },
  { id: 'en_US-lessac-medium', label: 'Inglés (EE. UU.) · Lessac', lang: 'en-US', mb: 63 },
  { id: 'en_GB-alba-medium', label: 'Inglés (Reino Unido) · Alba', lang: 'en-GB', mb: 63 },
  { id: 'pt_BR-faber-medium', label: 'Portugués (Brasil) · Faber', lang: 'pt-BR', mb: 63 },
  { id: 'fr_FR-siwis-medium', label: 'Francés · Siwis', lang: 'fr-FR', mb: 63 },
  { id: 'de_DE-thorsten-medium', label: 'Alemán · Thorsten', lang: 'de-DE', mb: 63 },
  { id: 'it_IT-riccardo-x_low', label: 'Italiano · Riccardo', lang: 'it-IT', mb: 28 },
  { id: 'ca_ES-upc_ona-medium', label: 'Catalán · Ona', lang: 'ca-ES', mb: 63 },
];

const MAX_CHARS = 5000;

/** Trozos de ~350 caracteres cortados en final de frase: el modelo rinde mejor con frases cortas. */
function chunks(text: string): string[] {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?¡¿…]+[.!?…]*|[¡¿][^.!?]*[.!?]*/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > 350 && cur) { out.push(cur.trim()); cur = ''; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Une varios WAV PCM de 16 bits mono (cabecera de 44 bytes) con una pausa breve entre ellos. */
async function joinWavs(blobs: Blob[]): Promise<Blob> {
  const buffers = await Promise.all(blobs.map((b) => b.arrayBuffer()));
  const rate = new DataView(buffers[0]).getUint32(24, true);
  const gap = Math.round(rate * 0.25) * 2;
  const dataLen = buffers.reduce((s, b) => s + b.byteLength - 44, 0) + gap * (buffers.length - 1);
  const out = new Uint8Array(44 + dataLen);
  out.set(new Uint8Array(buffers[0], 0, 44));
  const view = new DataView(out.buffer);
  view.setUint32(4, 36 + dataLen, true);
  view.setUint32(40, dataLen, true);
  let offset = 44;
  buffers.forEach((b, i) => {
    out.set(new Uint8Array(b, 44), offset);
    offset += b.byteLength - 44 + (i < buffers.length - 1 ? gap : 0);
  });
  return new Blob([out], { type: 'audio/wav' });
}

/**
 * Texto a voz. Genera el audio con voces neuronales Piper (VITS) que corren
 * en el navegador con ONNX Runtime (`@diffusionstudio/vits-web`): el modelo
 * de la voz se descarga de Hugging Face la primera vez y se guarda en el
 * almacenamiento privado del navegador (OPFS). El texto nunca sale del
 * dispositivo. Además permite escuchar al momento con la voz del sistema
 * (Web Speech API), que no se puede descargar.
 */
export default function TextoAVozTool() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<VoiceId>('es_ES-davefx-medium');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audio, setAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (urlRef.current) revokeURL(urlRef.current);
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }, []);

  const option = VOICES.find((v) => v.id === voice) ?? VOICES[0];

  async function handleGenerate() {
    const clean = text.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    setStatus('Preparando la voz…');
    try {
      const tts = await import('@diffusionstudio/vits-web');
      const parts = chunks(clean.slice(0, MAX_CHARS));
      const blobs: Blob[] = [];
      for (let i = 0; i < parts.length; i++) {
        const wav = await tts.predict({ text: parts[i], voiceId: voice }, (p) => {
          if (p.total && p.loaded < p.total) {
            setStatus(`Descargando la voz… ${Math.round((p.loaded / p.total) * 100)}%`);
          }
        });
        blobs.push(wav);
        setStatus(`Generando audio… ${i + 1} de ${parts.length}`);
        setProgress(Math.round(((i + 1) / parts.length) * 100));
      }
      const blob = blobs.length === 1 ? new Blob([blobs[0]], { type: 'audio/wav' }) : await joinWavs(blobs);
      if (urlRef.current) revokeURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setAudio({ url, blob });
    } catch (err) {
      console.error('[TextoAVozTool] Error:', err);
      setError('No se ha podido generar el audio. La primera vez hay que descargar la voz: comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!audio) return;
    const url = URL.createObjectURL(audio.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'texto-a-voz.wav';
    a.click();
    revokeURL(url);
  }

  function handleSpeak() {
    if (typeof speechSynthesis === 'undefined') {
      setError('Tu navegador no incluye voces del sistema. Usa «Generar audio».');
      return;
    }
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text.slice(0, MAX_CHARS));
    u.lang = option.lang;
    const match = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(option.lang.slice(0, 2)));
    if (match) u.voice = match;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    setSpeaking(true);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-[var(--color-text)]" htmlFor="tts-text">Texto</label>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          rows={14}
          placeholder="Escribe o pega aquí el texto que quieres convertir en voz…"
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)] bg-white resize-y focus:outline-none focus:border-[var(--color-accent)] leading-relaxed"
        />
        <p className="text-xs text-[var(--color-text-muted)] text-right">{text.length.toLocaleString('es-ES')} / {MAX_CHARS.toLocaleString('es-ES')} caracteres</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-2">
          <label className="block text-sm font-semibold text-[var(--color-text)]" htmlFor="tts-voice">Voz</label>
          <select
            id="tts-voice"
            value={voice}
            onChange={(e) => setVoice(e.target.value as VoiceId)}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-accent)]"
          >
            {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          <p className="text-xs text-[var(--color-text-muted)]">
            La primera vez se descarga la voz (unos {option.mb} MB) y queda guardada en tu navegador. Las siguientes veces se genera al momento.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!text.trim() || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Speech size={16} />
          {loading ? status : 'Generar audio'}
        </button>

        {loading && (
          <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <button
          onClick={handleSpeak}
          disabled={!text.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-accent)] disabled:opacity-40 transition-colors"
        >
          {speaking ? <Square size={15} /> : <Play size={15} />}
          {speaking ? 'Parar' : 'Escuchar ya con la voz del navegador'}
        </button>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {audio && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-3">
            <audio controls src={audio.url} className="w-full" />
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-text)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Download size={15} />
              Descargar audio (WAV)
            </button>
            <p className="text-xs text-[var(--color-text-muted)]">¿Lo necesitas en MP3? Tras descargarlo, elige «Convertir audio» en las sugerencias de abajo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
