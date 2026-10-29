/**
 * ToolsFoto — service worker de la extensión.
 *
 * Añade "Abrir en ToolsFoto" al menú contextual de las imágenes. Al elegir una
 * herramienta guarda la imagen pendiente con un token, abre la página de la
 * herramienta con `?tf_ext=<token>` y el content script de toolsfoto.com la
 * pide con `tf-get-pending`; aquí se descarga (los permisos de host permiten leer
 * imágenes de cualquier web, también sin CORS) y se le pasa en base64.
 *
 * La imagen nunca va a ningún servidor: viaja de la web de origen a la
 * pestaña de ToolsFoto dentro del propio navegador.
 */

const SITE = 'https://toolsfoto.com';

const TOOLS = [
  ['comprimir', 'Comprimir'],
  ['eliminar-fondo', 'Quitar el fondo (IA)'],
  ['convertir', 'Convertir formato'],
  ['redimensionar', 'Redimensionar'],
  ['recortar', 'Recortar'],
  ['mejorar-calidad-imagen', 'Mejorar calidad (IA)'],
  ['imagen-a-texto', 'Extraer texto (OCR)'],
  ['borrar-objetos-foto', 'Borrar objetos (IA)'],
  ['jpg-a-pdf', 'Pasar a PDF'],
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'tf-root', title: 'Abrir en ToolsFoto', contexts: ['image'] });
    for (const [slug, title] of TOOLS) {
      chrome.contextMenus.create({ id: `tf:${slug}`, parentId: 'tf-root', title, contexts: ['image'] });
    }
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (typeof info.menuItemId !== 'string' || !info.menuItemId.startsWith('tf:') || !info.srcUrl) return;
  const slug = info.menuItemId.slice(3);
  // Se guarda antes de abrir la pestaña (con un token que viaja en la URL)
  // para que el content script nunca llegue antes que la imagen pendiente.
  const token = crypto.randomUUID();
  await chrome.storage.session.set({ [`pending:${token}`]: { srcUrl: info.srcUrl, ts: Date.now() } });
  await chrome.tabs.create({ url: `${SITE}/${slug}?utm_source=extension&tf_ext=${token}` });
});

function base64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function fileName(url, mime) {
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg' }[mime] || 'jpg';
  try {
    const last = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    const base = last.replace(/\.[a-z0-9]+$/i, '').replace(/[^\w\-. ]+/g, '').slice(0, 60);
    return `${base || 'imagen'}.${ext}`;
  } catch {
    return `imagen.${ext}`;
  }
}

async function takePending(token) {
  const key = `pending:${token}`;
  const store = await chrome.storage.session.get(key);
  const pending = store[key];
  await chrome.storage.session.remove(key);
  if (!pending || Date.now() - pending.ts > 10 * 60 * 1000) return null;
  const res = await fetch(pending.srcUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const mime = blob.type || 'image/jpeg';
  return { name: fileName(pending.srcUrl, mime), mime, data: base64(await blob.arrayBuffer()) };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== 'tf-get-pending' || typeof msg.token !== 'string' || !sender.tab) return false;
  takePending(msg.token)
    .then((file) => sendResponse({ ok: true, file }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true; // respuesta asíncrona
});
