/**
 * ToolsFoto — content script (solo en toolsfoto.com).
 *
 * Si esta pestaña se abrió desde el menú contextual, pide la imagen al
 * service worker y se la entrega a la página con postMessage en cuanto la
 * página avisa de que tiene un uploader listo (`tf-ready`). La página la
 * recibe en src/lib/utils/incoming.ts como si se hubiera pegado.
 */
(async () => {
  const params = new URLSearchParams(location.search);
  const token = params.get('tf_ext');
  if (!token) return;
  // Quita el token de la barra de direcciones (no debe compartirse ni recargarse).
  params.delete('tf_ext');
  history.replaceState(history.state, '', location.pathname + (params.toString() ? `?${params}` : '') + location.hash);

  let res;
  try {
    res = await chrome.runtime.sendMessage({ type: 'tf-get-pending', token });
  } catch {
    return;
  }
  if (!res?.ok || !res.file) return;

  const { name, mime, data } = res.file;
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  let sent = false;
  const send = () => {
    if (sent) return;
    sent = true;
    window.postMessage({ type: 'tf-ext-file', name, mime, buffer: bytes.buffer }, location.origin, [bytes.buffer]);
  };

  if (document.documentElement.dataset.tfReady === '1') {
    send();
  } else {
    window.addEventListener('message', (e) => {
      if (e.source === window && e.data?.type === 'tf-ready') send();
    });
  }
})();
