import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Base = 'dec' | 'bin' | 'hex' | 'oct';

const BASES: { id: Base; label: string; prefix: string; radix: number }[] = [
  { id: 'dec', label: 'Decimal', prefix: '', radix: 10 },
  { id: 'bin', label: 'Binario', prefix: '0b', radix: 2 },
  { id: 'hex', label: 'Hexadecimal', prefix: '0x', radix: 16 },
  { id: 'oct', label: 'Octal', prefix: '0o', radix: 8 },
];

const CHAR_SETS: Record<Base, RegExp> = {
  dec: /^[0-9]*$/,
  bin: /^[01]*$/,
  hex: /^[0-9a-fA-F]*$/,
  oct: /^[0-7]*$/,
};

export default function ConversorBaseTool() {
  const [activeBase, setActiveBase] = useState<Base>('dec');
  const [value, setValue] = useState('');
  const [copied, setCopied] = useState('');

  function handleInput(v: string) {
    if (!v || CHAR_SETS[activeBase].test(v)) setValue(v);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  }

  function convert(): Record<Base, string> {
    if (!value) return { dec: '', bin: '', hex: '', oct: '' };
    try {
      const radix = BASES.find((b) => b.id === activeBase)!.radix;
      const decimal = parseInt(value, radix);
      if (isNaN(decimal) || decimal < 0) return { dec: '', bin: '', hex: '', oct: '' };
      return {
        dec: decimal.toString(10),
        bin: decimal.toString(2),
        hex: decimal.toString(16).toUpperCase(),
        oct: decimal.toString(8),
      };
    } catch {
      return { dec: '', bin: '', hex: '', oct: '' };
    }
  }

  const results = convert();

  // Group binary in nibbles for readability
  function formatBin(bin: string): string {
    if (!bin) return '';
    const padded = bin.padStart(Math.ceil(bin.length / 4) * 4, '0');
    return padded.match(/.{1,4}/g)?.join(' ') ?? bin;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
        <h2 className="font-bold text-[var(--color-text)]">Base de entrada</h2>
        <div className="grid grid-cols-4 gap-2">
          {BASES.map((b) => (
            <button
              key={b.id}
              onClick={() => { setActiveBase(b.id); setValue(''); }}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                activeBase === b.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--color-text)] block mb-1">
            Valor en {BASES.find((b) => b.id === activeBase)?.label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleInput(e.target.value.toUpperCase())}
            placeholder={activeBase === 'dec' ? '255' : activeBase === 'bin' ? '11111111' : activeBase === 'hex' ? 'FF' : '377'}
            className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {results.dec && (
        <div className="space-y-2">
          {BASES.map((b) => {
            const displayValue = b.id === 'bin' ? formatBin(results[b.id]) : results[b.id];
            const copyValue = results[b.id];
            return (
              <div key={b.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                activeBase === b.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'bg-white border-[var(--color-border)]'
              }`}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {b.label} {b.prefix && <span className="font-mono">{b.prefix}</span>}
                  </p>
                  <p className={`text-lg font-mono font-bold break-all ${activeBase === b.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>
                    {displayValue}
                  </p>
                </div>
                <button
                  onClick={() => copy(copyValue, b.id)}
                  className="ml-3 flex-shrink-0 p-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
                >
                  {copied === b.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-[var(--color-text-muted)]" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Referencia rápida</p>
        <div className="grid grid-cols-4 gap-2 text-xs font-mono text-[var(--color-text-secondary)]">
          {[0, 1, 2, 4, 8, 10, 15, 16, 255].map((n) => (
            <div key={n} className="bg-[var(--color-bg)] rounded p-1.5">
              <span className="text-[var(--color-text-muted)]">Dec </span>{n}<br/>
              <span className="text-[var(--color-text-muted)]">Hex </span>{n.toString(16).toUpperCase()}<br/>
              <span className="text-[var(--color-text-muted)]">Bin </span>{n.toString(2)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
