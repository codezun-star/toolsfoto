import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { Download, Loader2 } from 'lucide-react';

export default function AnalizarEspectroTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [barColor, setBarColor] = useState('#E84827');
  const [bgColor, setBgColor] = useState('#111110');
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

      const offlineCtx = new OfflineAudioContext(1, 1024, 44100);
      const analyser = offlineCtx.createAnalyser();
      analyser.fftSize = 2048;

      const audioCtx2 = new AudioContext();
      const decoded = await audioCtx2.decodeAudioData(arrayBuffer.slice(0));
      await audioCtx2.close();

      // Sample frequency spectrum from the middle of the track
      const sampleRate = decoded.sampleRate;
      const midSample = Math.floor(decoded.length / 2);
      const chunkSize = 2048;
      const channelData = decoded.getChannelData(0);
      const chunk = channelData.slice(midSample, midSample + chunkSize);

      // Compute simple DFT magnitude for spectrum (256 bins)
      const N = 256;
      const magnitudes = new Float32Array(N);
      for (let k = 0; k < N; k++) {
        let re = 0, im = 0;
        for (let n = 0; n < chunkSize; n++) {
          const angle = (2 * Math.PI * k * n) / chunkSize;
          re += (chunk[n] ?? 0) * Math.cos(angle);
          im -= (chunk[n] ?? 0) * Math.sin(angle);
        }
        magnitudes[k] = Math.sqrt(re * re + im * im) / chunkSize;
      }

      // Draw spectrum
      const W = 1200, H = 400;
      const BINS = 128;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      const barW = Math.floor(W / BINS) - 1;
      const maxMag = Math.max(...magnitudes.slice(0, BINS), 0.001);

      for (let i = 0; i < BINS; i++) {
        const mag = magnitudes[i] ?? 0;
        const barH = Math.round((mag / maxMag) * (H - 40));
        const x = i * (barW + 1);
        ctx.fillStyle = barColor;
        ctx.fillRect(x, H - 20 - barH, barW, barH);
      }

      // Frequency labels
      ctx.fillStyle = '#888888';
      ctx.font = '11px monospace';
      const freqs = [100, 500, 1000, 5000, 10000, 20000];
      for (const f of freqs) {
        const binIdx = Math.round((f / (sampleRate / 2)) * BINS);
        if (binIdx < BINS) {
          const x = binIdx * (barW + 1);
          ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x, H - 4);
        }
      }

      canvas.toBlob((blob) => {
        if (blob) setResultUrl(URL.createObjectURL(blob));
        setProcessing(false);
      }, 'image/png');
    } catch (err) {
      console.error('[AnalizarEspectro] Error:', err);
      setError('No se pudo analizar el espectro. Asegúrate de que el archivo es un formato de audio compatible.');
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, '_espectro.png');
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
                <label className="text-sm font-medium text-[var(--color-text)]">Color de barras</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-[var(--color-border)]" />
                  <span className="text-sm text-[var(--color-text-secondary)] font-mono">{barColor}</span>
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
            Analizar espectro
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Calculando espectro de frecuencias…</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <img src={resultUrl} alt="Espectro de frecuencias" className="w-full rounded-lg border border-[var(--color-border)]" />
          <p className="text-xs text-[var(--color-text-muted)] text-center">Espectro de frecuencias tomado del fragmento central del audio</p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar espectrograma PNG
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Analizar otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
