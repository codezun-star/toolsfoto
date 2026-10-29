/**
 * Buzón de archivos entre páginas.
 *
 * Guarda en IndexedDB los archivos que deben abrirse en la siguiente página:
 *   - "¿Y ahora?" (`NextSteps`): el resultado de una herramienta pasa a otra.
 *   - Compartir desde otra app (share target de la PWA): lo escribe
 *     `public/app-sw.js` con este mismo esquema, así que si se toca aquí hay
 *     que tocarlo allí.
 *   - La extensión de navegador (`extension/`).
 *
 * Una sola entrada (`pending`) con los archivos, la ruta de destino y la hora.
 * La recoge la página de destino y se borra al leerla. Pasados 10 minutos se
 * descarta: nunca se abre un archivo viejo por sorpresa.
 */

export const INBOX_DB = 'tf-inbox';
export const INBOX_STORE = 'files';
const KEY = 'pending';
const TTL_MS = 10 * 60 * 1000;

interface InboxEntry {
  files: File[];
  /** Ruta donde deben abrirse (`/comprimir`), o `*` para la primera que los acepte. */
  target: string;
  ts: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(INBOX_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(INBOX_STORE)) req.result.createObjectStore(INBOX_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(INBOX_STORE, mode);
    const req = fn(tx.objectStore(INBOX_STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  }));
}

/** Deja archivos en el buzón para que los abra la página `target`. */
export async function stashFiles(files: File[], target = '*'): Promise<void> {
  const entry: InboxEntry = { files, target, ts: Date.now() };
  await run('readwrite', (s) => s.put(entry, KEY));
}

/** Lee el buzón sin vaciarlo (para la página de compartir). */
export async function peekStashedFiles(): Promise<File[]> {
  try {
    const entry = await run<InboxEntry | undefined>('readonly', (s) => s.get(KEY) as IDBRequest<InboxEntry | undefined>);
    if (!entry || Date.now() - entry.ts > TTL_MS) return [];
    return entry.files;
  } catch {
    return [];
  }
}

/**
 * Recoge los archivos destinados a la ruta `path` y vacía el buzón.
 * Devuelve [] si no hay nada, ha caducado o era para otra página.
 */
export async function takeStashedFiles(path: string): Promise<File[]> {
  try {
    const entry = await run<InboxEntry | undefined>('readonly', (s) => s.get(KEY) as IDBRequest<InboxEntry | undefined>);
    if (!entry) return [];
    const expired = Date.now() - entry.ts > TTL_MS;
    if (!expired && entry.target !== '*' && entry.target !== path) return [];
    await run('readwrite', (s) => s.delete(KEY));
    return expired ? [] : entry.files;
  } catch {
    return [];
  }
}
