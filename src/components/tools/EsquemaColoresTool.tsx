import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToRgb(h: number, s: number, l: number): string {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
}

function generateScheme(hex: string, type: string): Array<{ hex: string; label: string }> {
  const [h, s, l] = hexToHsl(hex);
  const mod = (n: number) => ((n % 360) + 360) % 360;
  const colors: Array<{ hex: string; label: string }> = [{ hex, label: 'Base' }];

  switch (type) {
    case 'complementary':
      colors.push({ hex: hslToHex(mod(h + 180), s, l), label: 'Complementario' });
      break;
    case 'analogous':
      colors.push({ hex: hslToHex(mod(h - 30), s, l), label: 'Análogo -30°' });
      colors.push({ hex: hslToHex(mod(h + 30), s, l), label: 'Análogo +30°' });
      break;
    case 'triadic':
      colors.push({ hex: hslToHex(mod(h + 120), s, l), label: 'Triádico +120°' });
      colors.push({ hex: hslToHex(mod(h + 240), s, l), label: 'Triádico +240°' });
      break;
    case 'split':
      colors.push({ hex: hslToHex(mod(h + 150), s, l), label: 'Split +150°' });
      colors.push({ hex: hslToHex(mod(h + 210), s, l), label: 'Split +210°' });
      break;
    case 'tetradic':
      colors.push({ hex: hslToHex(mod(h + 90), s, l), label: '+90°' });
      colors.push({ hex: hslToHex(mod(h + 180), s, l), label: '+180°' });
      colors.push({ hex: hslToHex(mod(h + 270), s, l), label: '+270°' });
      break;
    case 'shades':
      [20, 35, 50, 65, 80].forEach((lightness, i) => {
        colors.splice(i, 1, { hex: hslToHex(h, s, lightness), label: `${lightness}%` });
      });
      return colors;
  }
  return colors;
}

function ColorCard({ hex, label }: { hex: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [h, s, l] = hexToHsl(hex);

  async function copy() {
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-white">
      <div className="h-20 w-full" style={{ backgroundColor: hex }} />
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[var(--color-text)]">{label}</p>
          <button onClick={copy} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          </button>
        </div>
        <p className="text-xs font-mono text-[var(--color-text)]">{hex.toUpperCase()}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{hslToRgb(h, s, l)}</p>
        <p className="text-xs text-[var(--color-text-muted)]">hsl({h}, {s}%, {l}%)</p>
      </div>
    </div>
  );
}

const SCHEMES = [
  { id: 'complementary', label: 'Complementario' },
  { id: 'analogous', label: 'Análogo' },
  { id: 'triadic', label: 'Triádico' },
  { id: 'split', label: 'Split-comp.' },
  { id: 'tetradic', label: 'Tetrádico' },
  { id: 'shades', label: 'Tonos' },
];

export default function EsquemaColoresTool() {
  const [baseColor, setBaseColor] = useState('#E84827');
  const [scheme, setScheme] = useState('complementary');

  const colors = generateScheme(baseColor, scheme);

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
        <h2 className="font-bold text-[var(--color-text)]">Color base</h2>
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer">
            <div className="w-14 h-14 rounded-xl border-2 border-[var(--color-border)] overflow-hidden">
              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="absolute inset-0 w-20 h-20 -ml-2 -mt-2 cursor-pointer"
              />
            </div>
          </label>
          <div className="space-y-1 flex-1">
            <input
              type="text"
              value={baseColor.toUpperCase()}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBaseColor(v);
              }}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              {(() => { const [h, s, l] = hexToHsl(baseColor); return `hsl(${h}, ${s}%, ${l}%)`; })()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
        <h2 className="font-bold text-[var(--color-text)]">Tipo de esquema</h2>
        <div className="flex gap-2 flex-wrap">
          {SCHEMES.map((s) => (
            <button
              key={s.id}
              onClick={() => setScheme(s.id)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                scheme === s.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-4 ${colors.length <= 2 ? 'grid-cols-2' : colors.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {colors.map((c) => (
          <ColorCard key={c.hex + c.label} hex={c.hex} label={c.label} />
        ))}
      </div>
    </div>
  );
}
