/**
 * Mensajes en español para los errores de la librería `yaml`, que vienen en
 * inglés. Se traduce por código de error; la posición sale de `linePos`.
 */

const MESSAGES: Record<string, string> = {
  BAD_INDENT: 'la sangría no cuadra con la de las líneas anteriores',
  BLOCK_AS_IMPLICIT_KEY: 'sangría incorrecta: hay un mapa anidado donde no se admite (revisa los espacios al principio de la línea)',
  TAB_AS_INDENT: 'se ha usado un tabulador para sangrar; YAML solo admite espacios',
  DUPLICATE_KEY: 'esta clave está repetida en el mismo mapa',
  MISSING_CHAR: 'falta un carácter de cierre (unas comillas, un corchete o una llave)',
  MULTILINE_IMPLICIT_KEY: 'una clave no puede ocupar varias líneas; ¿falta un espacio después de los dos puntos?',
  UNEXPECTED_TOKEN: 'hay un carácter inesperado en esta posición',
  BAD_SCALAR_START: 'el valor empieza por un carácter reservado; ponlo entre comillas',
  BAD_DIRECTIVE: 'directiva % no válida',
  BAD_ALIAS: 'alias (*) no válido',
  BAD_DQ_ESCAPE: 'secuencia de escape no válida dentro de comillas dobles',
  KEY_OVER_1024_CHARS: 'la clave supera los 1024 caracteres',
  TAG_RESOLVE_FAILED: 'no se reconoce la etiqueta de tipo (!)',
  ALIAS_PROPS: 'un alias no puede llevar etiqueta ni ancla',
  BAD_PROP_ORDER: 'el ancla (&) y la etiqueta (!) están en un orden no válido',
  IMPOSSIBLE: 'estructura imposible de interpretar',
};

interface YamlLikeError { code?: string; linePos?: Array<{ line: number; col: number }> | [{ line: number; col: number }, { line: number; col: number }] }

export function yamlErrorText(err: unknown): string {
  const e = err as YamlLikeError;
  const pos = e.linePos?.[0];
  const what = (e.code && MESSAGES[e.code]) || 'error de sintaxis';
  return pos ? `Línea ${pos.line}, columna ${pos.col}: ${what}.` : `${what[0].toUpperCase()}${what.slice(1)}.`;
}
