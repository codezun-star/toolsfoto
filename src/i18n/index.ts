import { EN } from './en';

/**
 * Traducción de la interfaz. El sitio está escrito en español y el español es
 * la clave: `translate('en', 'Comprimir imagen')` busca esa frase en `EN`.
 * Así los componentes siguen leyéndose en español y una frase sin traducir
 * se muestra en español en lugar de romper la página (y avisa en desarrollo).
 *
 * Interpolación con llaves: `translate('en', 'Comprimir {n} imágenes', { n: 3 })`.
 * La frase con llaves es la clave tal cual, también en `EN`.
 */

export type Lang = 'es' | 'en';
export type Vars = Record<string, string | number>;

const warned = new Set<string>();

export function translate(lang: Lang, es: string, vars?: Vars): string {
  let s = es;
  if (lang === 'en') {
    const en = EN[es];
    if (en !== undefined) s = en;
    else if (import.meta.env.DEV && !warned.has(es)) {
      warned.add(es);
      console.warn(`[i18n] Falta la traducción al inglés de: «${es}»`);
    }
  }
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Atajo para plantillas Astro: `const t = translator(lang)`. */
export function translator(lang: Lang) {
  return (es: string, vars?: Vars) => translate(lang, es, vars);
}

/** Etiqueta de idioma para `<html lang>`, OpenGraph y JSON-LD. */
export const LOCALE: Record<Lang, { html: string; og: string; name: string }> = {
  es: { html: 'es', og: 'es_ES', name: 'Spanish' },
  en: { html: 'en', og: 'en_US', name: 'English' },
};
