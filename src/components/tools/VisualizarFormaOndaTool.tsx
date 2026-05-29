import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { Download, Loader2 } from 'lucide-react';

export default function VisualizarFormaOndaTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [waveColor, setWaveColor] = useState('#E84827');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setAudio(null);
    setResultUrl(null);
    setError(null);
  }

  async function process() {
    if (!audio) return;
    setProcessing(true);
    setError(null);
    if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null); }
    try {
      const arrayBuffer = await audio.file.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      const data = audioBuffer.getChannelData(0);
      const W = 1200, H = 300;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const step = Math.ceil(data.length / W);
      const amp = H / 2;

      for (let i = 0; i < W; i++) {
        let min = 1.0, max = -1.0;
        for (let j = 0; j < step; j++) {
          const sample = data[i * step + j] ?? 0;
          if (sample < min) min = sample;
          if (sample > max) max = sample;
        }
        const y1 = (1 + min) * amp;
        const y2 = (1 + max) * amp;
        if (i === 0) ctx.moveTo(i, y1);
        ctx.lineTo(i, y1);
        ctx.lineTo(i, y2);
      }
      ctx.stroke();

      canvas.toBlob((blob) => {
        if (blob) setResultUrl(URL.createObjectURL(blob));
        setProcessing(false);
      }, 'image/png');
    } catch (err) {
      console.error('[VisualizarFormaOnda] Error:', err);
      setError('No se pudo decodificar el archivo de audio. Asegúrate de que es un formato compatible.');
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, '_waveform.png');
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Personalizar colores</h2>
            <div className="flex gap-6 flex-wrap">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">Color de la onda</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={waveColor} onChange={(e) => setWaveColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-[var(--color-border)]" />
                  <span className="text-sm text-[var(--color-text-secondary)] font-mono">{waveColor}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">Color de fondo</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-[var(--color-border)]" />
                  <span className="text-sm text-[var(--color-text-secondary)] font-mono">{bgColor}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Generar forma de onda
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Analizando audio…</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <img src={resultUrl} alt="Forma de onda" className="w-full rounded-lg border border-[var(--color-border)]" />
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar imagen PNG
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
