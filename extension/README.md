# Extensión de navegador de ToolsFoto

Extensión Manifest V3 para Chrome, Edge, Brave y Opera. Añade **«Abrir en ToolsFoto»** al
menú contextual de cualquier imagen (comprimir, quitar el fondo, convertir, redimensionar,
recortar, mejorar calidad, OCR, borrar objetos y pasar a PDF) y una ventana emergente con
accesos directos.

## Cómo funciona

1. `background.js` crea el menú. Al elegir una herramienta guarda la URL de la imagen en
   `chrome.storage.session` con un token y abre `https://toolsfoto.com/<herramienta>?tf_ext=<token>`.
2. `content.js` (solo en toolsfoto.com) lee el token, lo quita de la URL y pide la imagen al
   service worker, que la descarga (los permisos de host permiten leer imágenes de cualquier
   web aunque no envíe CORS) y se la devuelve en base64.
3. El content script espera a que la página tenga un uploader listo (`data-tf-ready` / mensaje
   `tf-ready`) y se la entrega con `postMessage({ type: 'tf-ext-file' })`. La página la recibe en
   `src/lib/utils/incoming.ts` como si se hubiera pegado con Ctrl+V.

La imagen nunca pasa por un servidor: va de la web de origen a la pestaña de ToolsFoto dentro
del propio navegador.

## Probarla en local

1. Abre `chrome://extensions`, activa el **modo de desarrollador**.
2. **Cargar extensión sin empaquetar** → elige esta carpeta `extension/`.
3. Clic derecho en cualquier imagen de cualquier web → **Abrir en ToolsFoto**.

Para probar contra `npm run preview`, cambia `SITE` en `background.js` y `matches` en
`manifest.json` a `http://localhost:4321` (no lo subas así).

## Publicarla en la Chrome Web Store

1. Sube la versión en `manifest.json` (`version`).
2. Empaqueta: desde la raíz del repo,
   `cd extension && zip -r ../toolsfoto-extension.zip . -x README.md`
3. En el [panel de desarrollador de Chrome Web Store](https://chrome.google.com/webstore/devconsole)
   (alta única de 5 USD) crea el elemento, sube el ZIP y rellena la ficha. Justificación de
   permisos que pide la revisión:
   - `contextMenus`: el menú «Abrir en ToolsFoto» sobre las imágenes.
   - `storage`: guardar durante unos segundos qué imagen hay que abrir (`storage.session`, se
     borra al leerla).
   - Permiso de host `<all_urls>`: descargar la imagen elegida desde la web en la que está, para
     pasársela a la herramienta. No se lee ni se modifica ninguna otra cosa de las páginas.
4. Política de privacidad: `https://toolsfoto.com/privacidad`.

La misma carpeta sirve para Edge Add-ons y para la tienda de Opera sin cambios.
