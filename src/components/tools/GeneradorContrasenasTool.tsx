import { useState, useCallback } from 'react';
import { Copy, RefreshCw, KeyRound, Check } from 'lucide-react';

interface Options {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMS = '0123456789';
const SYMS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

function generatePassword(opts: Options): string {
  const pool = [
    opts.upper && UPPER,
    opts.lower && LOWER,
    opts.numbers && NUMS,
    opts.symbols && SYMS,
  ].filter(Boolean).join('');
  if (!pool) return '';
  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => pool[n % pool.length]).join('');
}

function strength(pw: string): { label: string; color: string; pct: number } {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: 'Débil', color: '#EF4444', pct: 25 };
  if (score <= 3) return { label: 'Regular', color: '#F97316', pct: 50 };
  if (score <= 4) return { label: 'Buena', color: '#EAB308', pct: 75 };
  return { label: 'Excelente', color: '#22C55E', pct: 100 };
}

export default function GeneradorContrasenasTool() {
  const [opts, setOpts] = useState<Options>({ length: 16, upper: true, lower: true, numbers: true, symbols: true });
  const [count, setCount] = useState(5);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = useCallback(() => {
    const pws = Array.from({ length: count }, () => generatePassword(opts));
    setPasswords(pws);
    setCopied(null);
  }, [opts, count]);

  async function copyOne(i: number) {
    await navigator.clipboard.writeText(passwords[i]);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(passwords.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  const previewPw = generatePassword(opts);
  const str = strength(previewPw);
  const hasPool = opts.upper || opts.lower || opts.numbers || opts.symbols;

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-[var(--color-text)]">Longitud</label>
            <span className="text-sm font-mono font-bold text-[var(--color-accent)]">{opts.length} caracteres</span>
          </div>
          <input
            type="range" min={6} max={64} value={opts.length}
            onChange={(e) => setOpts((o) => ({ ...o, length: Number(e.target.value) }))}
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
            <span>6</span><span>64</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['upper', 'Mayúsculas', 'A-Z'],
            ['lower', 'Minúsculas', 'a-z'],
            ['numbers', 'Números', '0-9'],
            ['symbols', 'Símbolos', '!@#$'],
          ] as const).map(([key, label, ex]) => (
            <label key={key} className={['flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-colors', opts[key] ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)]'].join(' ')}>
              <input
                type="checkbox" className="hidden"
                checked={opts[key]}
                onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))}
              />
              <span className={`text-xs font-bold ${opts[key] ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{label}</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">{ex}</span>
            </label>
          ))}
        </div>

        {previewPw && (
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Fortaleza</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[var(--color-bg)] rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${str.pct}%`, background: str.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: str.color }}>{str.label}</span>
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-[var(--color-text)]">Cantidad</label>
            <span className="text-sm font-mono font-bold text-[var(--color-accent)]">{count}</span>
          </div>
          <input type="range" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
        </div>
      </div>

      <button
        onClick={generate}
        disabled={!hasPool}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50"
      >
        <KeyRound size={18} />
        Generar {count} {count === 1 ? 'contraseña' : 'contraseñas'}
      </button>

      {passwords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{passwords.length} contraseñas generadas</p>
            <button onClick={copyAll} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline">
              {copiedAll ? <Check size={13} /> : <Copy size={13} />}
              {copiedAll ? 'Copiadas' : 'Copiar todas'}
            </button>
          </div>
          {passwords.map((pw, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--color-border)]">
              <code className="flex-1 text-sm font-mono text-[var(--color-text)] break-all">{pw}</code>
              <button onClick={() => copyOne(i)} className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                {copied === i ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              </button>
              <button onClick={() => setPasswords((prev) => prev.map((p, j) => j === i ? generatePassword(opts) : p))} className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                <RefreshCw size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!hasPool && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">Selecciona al menos un tipo de carácter.</p>}
    </div>
  );
}
