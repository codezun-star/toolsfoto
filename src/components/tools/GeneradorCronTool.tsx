import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface FieldSpec {
  label: string;
  min: number;
  max: number;
  names?: Record<string, number>;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const DOW_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

const SPECS: FieldSpec[] = [
  { label: 'Minuto', min: 0, max: 59 },
  { label: 'Hora', min: 0, max: 23 },
  { label: 'Día del mes', min: 1, max: 31 },
  { label: 'Mes', min: 1, max: 12, names: MONTH_NAMES },
  { label: 'Día de la semana', min: 0, max: 7, names: DOW_NAMES },
];

const DIAS = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const PRESETS: Array<{ label: string; expr: string }> = [
  { label: 'Cada minuto', expr: '* * * * *' },
  { label: 'Cada 5 minutos', expr: '*/5 * * * *' },
  { label: 'Cada 15 minutos', expr: '*/15 * * * *' },
  { label: 'Cada hora en punto', expr: '0 * * * *' },
  { label: 'Todos los días a las 00:00', expr: '0 0 * * *' },
  { label: 'Laborables a las 09:00', expr: '0 9 * * 1-5' },
  { label: 'Lunes a las 08:30', expr: '30 8 * * 1' },
  { label: 'Día 1 de cada mes', expr: '0 0 1 * *' },
  { label: 'Cada 6 horas', expr: '0 */6 * * *' },
  { label: 'Domingos a las 03:00', expr: '0 3 * * 0' },
];

function isEvery(raw: string): boolean {
  return raw === '*' || raw === '?';
}

function stepOf(raw: string): number | null {
  const m = /^\*\/(\d+)$/.exec(raw);
  return m ? Number(m[1]) : null;
}

/** Convierte un campo cron en el conjunto de valores que activa. Devuelve null si el campo es inválido. */
function parseField(raw: string, spec: FieldSpec): Set<number> | null {
  const out = new Set<number>();
  const token = (t: string): number | null => {
    const upper = t.toUpperCase();
    if (spec.names && upper in spec.names) return spec.names[upper];
    if (!/^\d+$/.test(t)) return null;
    const n = Number(t);
    return n >= spec.min && n <= spec.max ? n : null;
  };

  for (const part of raw.split(',')) {
    if (part === '') return null;
    const [range, stepRaw] = part.split('/');
    if (part.split('/').length > 2) return null;

    let step = 1;
    if (stepRaw !== undefined) {
      if (!/^\d+$/.test(stepRaw) || Number(stepRaw) === 0) return null;
      step = Number(stepRaw);
    }

    let from: number;
    let to: number;
    if (isEvery(range)) {
      from = spec.min;
      to = spec.max;
    } else if (range.includes('-')) {
      const bounds = range.split('-');
      if (bounds.length !== 2) return null;
      const a = token(bounds[0]);
      const b = token(bounds[1]);
      if (a === null || b === null || a > b) return null;
      from = a;
      to = b;
    } else {
      const v = token(range);
      if (v === null) return null;
      if (stepRaw === undefined) {
        out.add(v);
        continue;
      }
      from = v;
      to = spec.max;
    }

    for (let i = from; i <= to; i += step) out.add(i);
  }

  return out.size > 0 ? out : null;
}

function listar(valores: number[], nombres?: string[]): string {
  const textos = valores.map((v) => (nombres ? nombres[v] : String(v)));
  if (textos.length === 1) return textos[0];
  return `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]}`;
}

function dosDigitos(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function describir(raws: string[], sets: Set<number>[]): string {
  const [rMin, rHour, rDom, rMonth, rDow] = raws;
  const minutos = [...sets[0]].sort((a, b) => a - b);
  const horas = [...sets[1]].sort((a, b) => a - b);
  const dias = [...sets[2]].sort((a, b) => a - b);
  const meses = [...sets[3]].sort((a, b) => a - b);
  const semana = [...sets[4]].sort((a, b) => a - b);

  const pasoMin = stepOf(rMin);
  const pasoHora = stepOf(rHour);

  let tiempo: string;
  if (isEvery(rMin) && isEvery(rHour)) {
    tiempo = 'Cada minuto';
  } else if (pasoMin !== null && isEvery(rHour)) {
    tiempo = `Cada ${pasoMin} minutos`;
  } else if (isEvery(rMin)) {
    tiempo = `Cada minuto de las ${listar(horas)} horas`;
  } else if (minutos.length === 1 && isEvery(rHour)) {
    tiempo = `Cada hora, en el minuto ${minutos[0]}`;
  } else if (minutos.length === 1 && pasoHora !== null) {
    tiempo = `Cada ${pasoHora} horas, en el minuto ${minutos[0]}`;
  } else if (minutos.length === 1 && horas.length === 1) {
    tiempo = `A las ${dosDigitos(horas[0])}:${dosDigitos(minutos[0])}`;
  } else if (pasoMin !== null) {
    tiempo = `Cada ${pasoMin} minutos de las ${listar(horas)} horas`;
  } else if (horas.length === 1) {
    tiempo = `En los minutos ${listar(minutos)} de las ${dosDigitos(horas[0])} horas`;
  } else {
    tiempo = `En los minutos ${listar(minutos)} de las ${listar(horas)} horas`;
  }

  const partes: string[] = [];
  if (!isEvery(rDow)) {
    const normalizada = [...new Set(semana.map((d) => (d === 7 ? 0 : d)))].sort((a, b) => a - b);
    partes.push(`los ${listar(normalizada, DIAS)}`);
  }
  if (!isEvery(rDom)) {
    partes.push(dias.length === 1 ? `el día ${dias[0]} del mes` : `los días ${listar(dias)} del mes`);
  }
  if (isEvery(rDom) && isEvery(rDow)) {
    partes.push('todos los días');
  }
  if (!isEvery(rMonth)) {
    partes.push(`en ${listar(meses.map((m) => m - 1), MESES)}`);
  }

  // Cuando día del mes y día de la semana están restringidos a la vez, cron los combina con OR.
  const fecha =
    !isEvery(rDom) && !isEvery(rDow)
      ? [`${partes[0]} o ${partes[1]}`, ...partes.slice(2)].join(', ')
      : partes.join(', ');

  return `${tiempo}, ${fecha}.`;
}

function proximasEjecuciones(raws: string[], sets: Set<number>[], cantidad: number): Date[] {
  const resultado: Date[] = [];
  const desde = new Date();
  desde.setSeconds(0, 0);
  desde.setMinutes(desde.getMinutes() + 1);

  const domAny = isEvery(raws[2]);
  const dowAny = isEvery(raws[4]);
  const horas = [...sets[1]].sort((a, b) => a - b);
  const minutos = [...sets[0]].sort((a, b) => a - b);
  const semana = new Set([...sets[4]].map((d) => (d === 7 ? 0 : d)));

  const base = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());

  for (let d = 0; d < 366 * 5; d++) {
    const dia = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
    if (!sets[3].has(dia.getMonth() + 1)) continue;

    const domOk = sets[2].has(dia.getDate());
    const dowOk = semana.has(dia.getDay());
    let diaOk: boolean;
    if (domAny && dowAny) diaOk = true;
    else if (domAny) diaOk = dowOk;
    else if (dowAny) diaOk = domOk;
    else diaOk = domOk || dowOk;
    if (!diaOk) continue;

    for (const h of horas) {
      for (const m of minutos) {
        const t = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), h, m);
        if (t.getTime() < desde.getTime()) continue;
        resultado.push(t);
        if (resultado.length >= cantidad) return resultado;
      }
    }
  }
  return resultado;
}

const FORMATO = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export default function GeneradorCronTool() {
  const [expr, setExpr] = useState('0 9 * * 1-5');
  const [copied, setCopied] = useState(false);

  const campos = expr.trim().split(/\s+/);
  let error: string | null = null;
  let sets: Set<number>[] = [];

  if (expr.trim() === '') {
    error = 'Introduce una expresión cron de 5 campos.';
  } else if (campos.length !== 5) {
    error = `Una expresión cron estándar tiene 5 campos separados por espacios. Has escrito ${campos.length}.`;
  } else {
    const parsed = campos.map((c, i) => parseField(c, SPECS[i]));
    const idx = parsed.findIndex((p) => p === null);
    if (idx !== -1) {
      error = `El campo "${SPECS[idx].label}" no es válido: "${campos[idx]}". Valores aceptados: ${SPECS[idx].min}-${SPECS[idx].max}.`;
    } else {
      sets = parsed as Set<number>[];
    }
  }

  const descripcion = error ? '' : describir(campos, sets);
  const proximas = error ? [] : proximasEjecuciones(campos, sets, 5);

  async function copy() {
    if (!expr.trim()) return;
    await navigator.clipboard.writeText(expr.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[var(--color-text)]">Expresión cron</label>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="0 9 * * 1-5"
          spellCheck={false}
          className="w-full px-3 py-3 text-base rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono text-[var(--color-text)]"
        />
        <div className="grid grid-cols-5 gap-2 mt-2">
          {SPECS.map((s, i) => (
            <div key={s.label} className="text-center">
              <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">{s.label}</p>
              <p className="text-xs font-mono text-[var(--color-text-secondary)] truncate">{campos[i] ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      ) : (
        <div className="p-4 rounded-xl border border-[var(--color-tools-border)] bg-[var(--color-tools-bg)]">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Se ejecuta</p>
          <p className="text-base font-bold text-[var(--color-text)]">{descripcion}</p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-[var(--color-text)] mb-2">Plantillas frecuentes</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.expr}
              onClick={() => setExpr(p.expr)}
              className={[
                'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                expr.trim() === p.expr
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {proximas.length > 0 && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-3">Próximas 5 ejecuciones</h2>
          <ul className="space-y-1.5">
            {proximas.map((d) => (
              <li key={d.getTime()} className="text-sm text-[var(--color-text-secondary)] flex items-baseline gap-2">
                <span className="text-[var(--color-tools-icon)]">•</span>
                {FORMATO.format(d)}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            Calculadas con la zona horaria de tu navegador. El servidor donde corra el cron puede usar otra (habitualmente UTC).
          </p>
        </div>
      )}

      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
        <h2 className="font-bold text-[var(--color-text)] mb-3">Sintaxis admitida</h2>
        <ul className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
          <li><code className="font-mono text-[var(--color-text)]">*</code> — todos los valores del campo</li>
          <li><code className="font-mono text-[var(--color-text)]">5</code> — un valor exacto</li>
          <li><code className="font-mono text-[var(--color-text)]">1-5</code> — un rango cerrado</li>
          <li><code className="font-mono text-[var(--color-text)]">1,15,30</code> — una lista de valores</li>
          <li><code className="font-mono text-[var(--color-text)]">*/10</code> — cada 10 unidades desde el inicio</li>
          <li><code className="font-mono text-[var(--color-text)]">MON-FRI</code> / <code className="font-mono text-[var(--color-text)]">JAN,JUL</code> — nombres en inglés de 3 letras</li>
        </ul>
      </div>
    </div>
  );
}
