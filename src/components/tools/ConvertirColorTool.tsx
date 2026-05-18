import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

interface HSL { h: number; s: number; l: number }
interface RGB { r: number; g: number; b: number }
interface HSB { h: number; s: number; b: number }

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 3 && clean.length !== 6) return null;
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const n = parseInt(full, 16);
  if (isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToHsb({ r, g, b }: RGB): HSB {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const bv = max;
  const s = max === 0 ? 0 : (max - min) / max;
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), b: Math.round(bv * 100) };
}

function parseRgb(val: string): RGB | null {
  const m = val.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return null;
  const [r, g, b] = [+m[1], +m[2], +m[3]];
  if (r > 255 || g > 255 || b > 255) return null;
  return { r, g, b };
}

function parseHsl(val: string): RGB | null {
  const m = val.match(/(\d+)[,\s]+(\d+)%?[,\s]+(\d+)%?/);
  if (!m) return null;
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toRgb = (t: number) => {
    let tc = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (tc < 1/6) return p + (q - p) * 6 * tc;
    if (tc < 1/2) return q;
    if (tc < 2/3) return p + (q - p) * (2/3 - tc) * 6;
    return p;
  };
  return { r: Math.round(toRgb(h + 1/3) * 255), g: Math.round(toRgb(h) * 255), b: Math.round(toRgb(h - 1/3) * 255) };
}

interface Color { hex: string; rgb: RGB; hsl: HSL; hsb: HSB }

function parseInput(val: string, type: 'hex' | 'rgb' | 'hsl'): Color | null {
  let rgb: RGB | null = null;
  if (type === 'hex') rgb = hexToRgb(val.trim());
  else if (type === 'rgb') rgb = parseRgb(val);
  else if (type === 'hsl') rgb = parseHsl(val);
  if (!rgb) return null;
  return { hex: rgbToHex(rgb), rgb, hsl: rgbToHsl(rgb), hsb: rgbToHsb(rgb) };
}

export default function ConvertirColorTool() {
  const [hex, setHex] = useState('#E84827');
  const [rgb, setRgb] = useState('232, 72, 39');
  const [hsl, setHsl] = useState('12, 81%, 53%');
  const [color, setColor] = useState<Color | null>(() => parseInput('#E84827', 'hex'));
  const [copied, setCopied] = useState('');

  function updateFromHex(val: string) {
    setHex(val);
    const c = parseInput(val, 'hex');
    if (c) {
      setColor(c);
      setRgb(`${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}`);
      setHsl(`${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%`);
    }
  }

  function updateFromRgb(val: string) {
    setRgb(val);
    const c = parseInput(val, 'rgb');
    if (c) {
      setColor(c);
      setHex(c.hex);
      setHsl(`${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%`);
    }
  }

  function updateFromHsl(val: string) {
    setHsl(val);
    const c = parseInput(val, 'hsl');
    if (c) {
      setColor(c);
      setHex(c.hex);
      setRgb(`${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}`);
    }
  }

  async function copyVal(val: string, key: string) {
    await navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  const formats = color ? [
    { key: 'hex', label: 'HEX', value: color.hex },
    { key: 'rgb', label: 'RGB', value: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})` },
    { key: 'hsl', label: 'HSL', value: `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)` },
    { key: 'hsb', label: 'HSB', value: `hsb(${color.hsb.h}, ${color.hsb.s}%, ${color.hsb.b}%)` },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">HEX</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={hex.startsWith('#') && hex.length === 7 ? hex : '#000000'}
              onChange={(e) => updateFromHex(e.target.value)}
              className="w-12 h-10 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              placeholder="#RRGGBB"
              className="flex-1 px-3 py-2 font-mono text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">RGB</label>
          <input
            type="text"
            value={rgb}
            onChange={(e) => updateFromRgb(e.target.value)}
            placeholder="R, G, B"
            className="w-full px-3 py-2 font-mono text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] h-10"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">HSL</label>
          <input
            type="text"
            value={hsl}
            onChange={(e) => updateFromHsl(e.target.value)}
            placeholder="H, S%, L%"
            className="w-full px-3 py-2 font-mono text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] h-10"
          />
        </div>
      </div>

      {color && (
        <>
          <div className="h-20 rounded-xl border border-[var(--color-border)] shadow-sm" style={{ backgroundColor: color.hex }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {formats.map((f) => (
              <button
                key={f.key}
                onClick={() => copyVal(f.value, f.key)}
                className="flex flex-col items-start p-3 bg-white rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-left group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">{f.label}</span>
                  {copied === f.key ? <CheckCircle2 size={12} className="text-green-600" /> : <Copy size={12} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <span className="font-mono text-xs text-[var(--color-text)] break-all">{f.value}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
