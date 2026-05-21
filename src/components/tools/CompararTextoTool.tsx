import { useState } from 'react';

interface DiffLine {
  type: 'added' | 'removed' | 'equal';
  content: string;
  lineA?: number;
  lineB?: number;
}

function lcs(a: string[], b: string[]): number[][] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp;
}

function diff(a: string[], b: string[]): DiffLine[] {
  const dp = lcs(a, b);
  const result: DiffLine[] = [];
  let i = a.length, j = b.length;
  let lineA = a.length, lineB = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'equal', content: a[i - 1], lineA: lineA--, lineB: lineB-- });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', content: b[j - 1], lineB: lineB-- });
      j--;
    } else {
      result.unshift({ type: 'removed', content: a[i - 1], lineA: lineA-- });
      i--;
    }
  }
  return result;
}

export default function CompararTextoTool() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [result, setResult] = useState<DiffLine[] | null>(null);

  function compare() {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    setResult(diff(linesA, linesB));
  }

  function clear() {
    setTextA('');
    setTextB('');
    setResult(null);
  }

  const added = result?.filter((l) => l.type === 'added').length ?? 0;
  const removed = result?.filter((l) => l.type === 'removed').length ?? 0;
  const equal = result?.filter((l) => l.type === 'equal').length ?? 0;

  return (
    <div className="space-y-5">
      {!result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">Texto A (original)</label>
            <textarea
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder="Pega el texto original aquí…"
              className="w-full h-64 px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-[var(--color-accent)]"
            />
            <p className="text-xs text-[var(--color-text-muted)]">{textA.split('\n').length} líneas</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">Texto B (modificado)</label>
            <textarea
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder="Pega el texto modificado aquí…"
              className="w-full h-64 px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-[var(--color-accent)]"
            />
            <p className="text-xs text-[var(--color-text-muted)]">{textB.split('\n').length} líneas</p>
          </div>
        </div>
      )}

      {!result && (
        <button
          onClick={compare}
          disabled={!textA.trim() || !textB.trim()}
          className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Comparar textos
        </button>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-3 text-sm">
              <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg font-medium">+{added} añadidas</span>
              <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg font-medium">-{removed} eliminadas</span>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">{equal} iguales</span>
            </div>
            <button
              onClick={clear}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              Nueva comparación
            </button>
          </div>

          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="w-10 px-2 py-2 text-center text-[var(--color-text-muted)] font-medium">A</th>
                    <th className="w-10 px-2 py-2 text-center text-[var(--color-text-muted)] font-medium">B</th>
                    <th className="px-3 py-2 text-left text-[var(--color-text-muted)] font-medium">Contenido</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((line, idx) => (
                    <tr
                      key={idx}
                      className={
                        line.type === 'added'
                          ? 'bg-green-50'
                          : line.type === 'removed'
                          ? 'bg-red-50'
                          : ''
                      }
                    >
                      <td className="w-10 px-2 py-0.5 text-center text-[var(--color-text-muted)] select-none border-r border-[var(--color-border)]">
                        {line.type !== 'added' ? line.lineA : ''}
                      </td>
                      <td className="w-10 px-2 py-0.5 text-center text-[var(--color-text-muted)] select-none border-r border-[var(--color-border)]">
                        {line.type !== 'removed' ? line.lineB : ''}
                      </td>
                      <td className="px-3 py-0.5 whitespace-pre">
                        <span
                          className={
                            line.type === 'added'
                              ? 'text-green-700'
                              : line.type === 'removed'
                              ? 'text-red-700 line-through'
                              : 'text-[var(--color-text)]'
                          }
                        >
                          {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                          {line.content}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
