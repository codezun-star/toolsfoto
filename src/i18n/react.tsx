import { createContext, useContext, type ComponentType } from 'react';
import { translate, type Lang, type Vars } from './index';

/**
 * Idioma en los componentes React. Cada herramienta traducida exporta su
 * componente envuelto en `withLang()`: la página Astro le pasa `lang="en"` y
 * todo lo que hay dentro (uploaders, hooks, botones compartidos) lo lee con
 * `useT()` / `useLang()` sin tener que pasarlo prop a prop.
 */
const LangContext = createContext<Lang>('es');

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT() {
  const lang = useContext(LangContext);
  return (es: string, vars?: Vars) => translate(lang, es, vars);
}

export function withLang<P extends object>(Component: ComponentType<P>) {
  function WithLang(props: P & { lang?: Lang }) {
    return (
      <LangContext.Provider value={props.lang ?? 'es'}>
        <Component {...props} />
      </LangContext.Provider>
    );
  }
  WithLang.displayName = `withLang(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WithLang;
}
