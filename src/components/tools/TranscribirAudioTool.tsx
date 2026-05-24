import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Copy, Check, Download, Trash2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'es-ES', label: 'Español' },
  { code: 'en-US', label: 'English' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'pt-PT', label: 'Português' },
  { code: 'ca-ES', label: 'Català' },
];

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function TranscribirAudioTool() {
  const [lang, setLang] = useState('es-ES');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [copied, setCopied] = useState(false);
  const [supported, setSupported] = useState(true);
  const recogRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRec) setSupported(false);
  }, []);

  function startListening() {
    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const recog = new SpeechRec();
    recog.lang = lang;
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onresult = (e) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += text + ' ';
        else interimText += text;
      }
      if (finalText) setTranscript((prev) => prev + finalText);
      setInterim(interimText);
    };

    recog.onerror = () => { setListening(false); setInterim(''); };
    recog.onend = () => { setListening(false); setInterim(''); };

    recogRef.current = recog;
    recog.start();
    setListening(true);
  }

  function stopListening() {
    recogRef.current?.stop();
    recogRef.current = null;
    setListening(false);
    setInterim('');
  }

  async function copyText() {
    const full = transcript + interim;
    if (!full.trim()) return;
    await navigator.clipboard.writeText(full.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadTxt() {
    const full = (transcript + interim).trim();
    if (!full) return;
    const blob = new Blob([full], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcripcion.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!supported) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <p className="font-semibold mb-1">Navegador no compatible</p>
        <p>La Web Speech API no está disponible en este navegador. Usa Google Chrome o Microsoft Edge para la transcripción de voz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[var(--color-tools-bg)] border border-[var(--color-tools-border)] rounded-xl text-sm text-[var(--color-text-secondary)]">
        <p>Transcribe voz en tiempo real usando el micrófono de tu dispositivo. Para transcribir un archivo de audio, reprodúcelo cerca del micrófono.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Idioma</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { if (!listening) setLang(l.code); }}
              disabled={listening}
              className={['px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50', lang === l.code ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={listening ? stopListening : startListening}
        className={['w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-lg transition-all', listening ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-[var(--color-accent)] hover:bg-[#C93D1E] text-white'].join(' ')}
      >
        {listening ? <MicOff size={22} /> : <Mic size={22} />}
        {listening ? 'Detener transcripción' : 'Iniciar transcripción'}
      </button>

      {listening && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-accent)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          Escuchando…
        </div>
      )}

      {(transcript || interim) && (
        <div className="space-y-3">
          <div className="min-h-32 p-4 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
            {transcript}
            {interim && <span className="text-[var(--color-text-muted)]">{interim}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setTranscript(''); setInterim(''); }} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:text-red-600 hover:border-red-300 transition-colors">
              <Trash2 size={14} /> Borrar
            </button>
            <button onClick={copyText} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button onClick={downloadTxt} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm">
              <Download size={15} /> Descargar .txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
