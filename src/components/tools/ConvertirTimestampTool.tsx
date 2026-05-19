import { useState } from 'react';
import { Copy, CheckCircle2, RefreshCw } from 'lucide-react';

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDateUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

export default function ConvertirTimestampTool() {
  const [tsInput, setTsInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const tsDate = tsInput.trim() !== '' ? (() => {
    const n = Number(tsInput.trim());
    if (isNaN(n)) return null;
    return new Date(n > 9999999999 ? n : n * 1000);
  })() : null;

  const dateTs = dateInput.trim() !== '' ? (() => {
    const d = new Date(dateInput.trim());
    if (isNaN(d.getTime())) return null;
    return d;
  })() : null;

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function setNow() {
    setTsInput(String(Math.floor(Date.now() / 1000)));
    setDateInput('');
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copy(text, id)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
      {copied === id ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} className="text-[var(--color-text-muted)]" />}
    </button>
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--color-text)]">Unix Timestamp → Fecha</h2>
          <button onClick={setNow} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors">
            <RefreshCw size={12} />
            Ahora
          </button>
        </div>
        <input
          type="number"
          value={tsInput}
          onChange={e => { setTsInput(e.target.value); setDateInput(''); }}
          placeholder="Ej: 1700000000"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] font-mono text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />

        {tsDate && !isNaN(tsDate.getTime()) && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Local</p>
                <p className="font-mono font-semibold text-[var(--color-text)]">{formatDate(tsDate)}</p>
              </div>
              <CopyBtn text={formatDate(tsDate)} id="local" />
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">UTC</p>
                <p className="font-mono font-semibold text-[var(--color-text)]">{formatDateUTC(tsDate)}</p>
              </div>
              <CopyBtn text={formatDateUTC(tsDate)} id="utc" />
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">ISO 8601</p>
                <p className="font-mono font-semibold text-[var(--color-text)]">{tsDate.toISOString()}</p>
              </div>
              <CopyBtn text={tsDate.toISOString()} id="iso" />
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Milisegundos</p>
                <p className="font-mono font-semibold text-[var(--color-text)]">{tsDate.getTime()}</p>
              </div>
              <CopyBtn text={String(tsDate.getTime())} id="ms" />
            </div>
          </div>
        )}
        {tsInput && !tsDate && (
          <p className="text-sm text-red-600">Timestamp inválido</p>
        )}
      </div>

      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
        <h2 className="font-bold text-[var(--color-text)]">Fecha → Unix Timestamp</h2>
        <input
          type="text"
          value={dateInput}
          onChange={e => { setDateInput(e.target.value); setTsInput(''); }}
          placeholder="Ej: 2024-01-15 14:30:00 o 2024-01-15T14:30:00Z"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] font-mono text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />

        {dateTs && !isNaN(dateTs.getTime()) && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Unix (segundos)</p>
                <p className="font-mono font-semibold text-[var(--color-text)]">{Math.floor(dateTs.getTime() / 1000)}</p>
              </div>
              <CopyBtn text={String(Math.floor(dateTs.getTime() / 1000))} id="sec" />
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Unix (milisegundos)</p>
                <p className="font-mono font-semibold text-[var(--color-text)]">{dateTs.getTime()}</p>
              </div>
              <CopyBtn text={String(dateTs.getTime())} id="ms2" />
            </div>
          </div>
        )}
        {dateInput && (!dateTs || isNaN(dateTs.getTime())) && (
          <p className="text-sm text-red-600">Fecha inválida. Usa formatos como YYYY-MM-DD HH:MM:SS</p>
        )}
      </div>
    </div>
  );
}
