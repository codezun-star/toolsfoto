/**
 * Páginas de cola larga: variantes de herramientas existentes con un preset
 * fijado y contenido propio ("comprimir imagen a 50 KB", "foto tamaño
 * infantil", "PNG a WebP"…). Las sirve una sola ruta, `src/pages/[landing].astro`.
 *
 * Cada entrada necesita además su ficha en `tools.ts` y su SEO en `seo.ts`,
 * como cualquier herramienta (así salen en las categorías, el buscador, el
 * sitemap y `llms.txt`).
 *
 * El contenido tiene que ser propio de cada página: requisitos oficiales,
 * usos concretos y dudas reales de esa búsqueda. Páginas que solo cambian
 * dos palabras las trata Google como contenido escaso.
 */

export type LandingTool =
  | { kind: 'target-kb'; kb: number }
  | { kind: 'id-photo'; size: string }
  | { kind: 'image-format'; format: 'image/jpeg' | 'image/png' | 'image/webp'; dropLabel: string }
  | { kind: 'audio-wav' };

export interface Landing {
  slug: string;
  tool: LandingTool;
  answer: string;
  howTo: string[];
  faqs: Array<{ q: string; a: string }>;
  /** Bloques de texto bajo la herramienta. `body` admite HTML propio (enlaces, negritas). */
  sections: Array<{ title: string; body: string }>;
}

const link = (href: string, text: string) => `<a class="underline text-[var(--color-accent)]" href="${href}">${text}</a>`;
const strong = (text: string) => `<strong class="text-[var(--color-text)]">${text}</strong>`;

const PRIVACY_FAQ = {
  q: '¿Se suben mis imágenes a algún servidor?',
  a: 'No. Todo el proceso ocurre en tu navegador con la Canvas API: la imagen no sale de tu dispositivo, no se guarda en ningún sitio y la herramienta funciona sin registro ni límites.',
};

// ── Comprimir a un peso concreto ─────────────────────────────────────────────

function kbHowTo(label: string): string[] {
  return [
    'Arrastra la imagen o pégala con Ctrl+V.',
    `Comprueba que el objetivo es ${label} (puedes ajustarlo).`,
    `Pulsa «Comprimir a ${label}»: la herramienta busca la mejor calidad que cabe en ese peso.`,
    'Descarga el JPG resultante.',
  ];
}

const KB: Landing[] = [
  {
    slug: 'comprimir-imagen-20kb',
    tool: { kind: 'target-kb', kb: 20 },
    answer: 'Sube la imagen y pulsa «Comprimir a 20 KB»: la herramienta busca la mayor calidad JPEG que cabe en 20 KB y, si no basta, reduce las dimensiones lo justo. Todo ocurre en tu navegador.',
    howTo: kbHowTo('20 KB'),
    faqs: [
      { q: '¿Cómo reduzco una foto a menos de 20 KB?', a: 'Sube la imagen y pulsa «Comprimir a 20 KB». La herramienta prueba distintas calidades JPEG hasta dar con la más alta que no pasa de 20 KB. Como 20 KB es muy poco para una foto de móvil (suelen pesar entre 2 y 5 MB), normalmente también reduce el tamaño en píxeles, y te avisa de las dimensiones finales.' },
      { q: '¿Para qué se piden fotos de 20 KB?', a: 'Es un límite habitual en formularios oficiales y plataformas antiguas: firmas escaneadas, fotos para inscripciones en oposiciones y exámenes, carnés de bibliotecas o gimnasios y avatares de foros. Suelen pedir JPG de entre 10 y 20 KB.' },
      { q: '¿Se verá bien una foto de 20 KB?', a: 'Para una foto tipo carné o una firma, sí: con unos 300-400 px de lado y calidad media una cara se distingue perfectamente. Lo que no admite es ampliarse ni imprimirse en grande. Recorta antes la imagen a la zona que importa (la cara, la firma): cuantos menos píxeles sobren, más calidad cabrá en los 20 KB.' },
      { q: '¿Y si el formulario pide también unas medidas concretas?', a: 'Primero ajusta las medidas con «Redimensionar imagen» o, si es una foto de documento, con «Foto carnet», y después comprímela aquí a 20 KB. Hacerlo en ese orden da mejor calidad que comprimir primero.' },
      { q: '¿Por qué el resultado es JPG?', a: 'Porque el JPG es el formato que mejor comprime fotografías y el que aceptan prácticamente todos los formularios. Si la imagen tenía transparencia, se rellena de blanco.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Firmas y fotos para formularios estrictos', body: `Muchas sedes electrónicas y portales de inscripción rechazan cualquier archivo que pase de 20 KB sin explicar por qué. Esta herramienta te garantiza ${strong('un archivo por debajo del límite')} con la máxima calidad posible. Si es una firma, pásala antes por ${link('/quitar-fondo-blanco', 'Quitar fondo blanco')} o ${link('/blancoynegro', 'Blanco y negro')}: una firma en dos tonos ocupa mucho menos.` },
      { title: '¿Necesitas otro peso?', body: `Tienes páginas preparadas para ${link('/comprimir-imagen-50kb', '50 KB')}, ${link('/comprimir-imagen-100kb', '100 KB')} y ${link('/comprimir-imagen-200kb', '200 KB')}, y el control deslizante te deja fijar cualquier valor entre 10 KB y 5 MB.` },
    ],
  },
  {
    slug: 'comprimir-imagen-50kb',
    tool: { kind: 'target-kb', kb: 50 },
    answer: 'Sube la foto y pulsa «Comprimir a 50 KB»: se calcula la mejor calidad JPEG que cabe en 50 KB, reduciendo las dimensiones solo si hace falta. Gratis, sin registro y en tu navegador.',
    howTo: kbHowTo('50 KB'),
    faqs: [
      { q: '¿Cómo comprimo una imagen a 50 KB?', a: 'Arrastra la imagen, deja el objetivo en 50 KB y pulsa el botón. En uno o dos segundos tendrás un JPG de 50 KB o menos con la mejor calidad posible. Si la foto es muy grande, se reduce también su tamaño en píxeles y se te indica el resultado.' },
      { q: '¿Dónde piden imágenes de menos de 50 KB?', a: 'En solicitudes de becas y matrículas, inscripciones a exámenes, plataformas educativas, portales de empleo público y algunas apps de empresa para la foto de perfil. También es un buen peso para fotos de perfil y miniaturas en webs.' },
      { q: '¿Cuántos píxeles caben en 50 KB con buena calidad?', a: 'Como referencia, una foto de unos 600-800 px de lado con calidad del 60-75 %. Para retratos y fotos carné sobra; para paisajes con mucho detalle conviene recortar o aceptar algo menos de calidad.' },
      { q: 'Mi imagen ya pesa menos de 50 KB, ¿qué pasa?', a: 'La herramienta te avisa de que ya cumple el límite. Puedes descargarla tal cual o comprimirla igualmente para ganar margen, por ejemplo si el formulario suma el peso de varios archivos.' },
      { q: '¿Puedo comprimir varias imágenes a la vez?', a: 'Para un peso exacto se trabaja imagen a imagen. Si lo que necesitas es aligerar muchas fotos de golpe, usa «Comprimir varias imágenes», que procesa hasta 200 y las descarga en un ZIP.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'El peso justo, sin probar a ciegas', body: `Con un editor normal tendrías que exportar una y otra vez bajando la calidad hasta acertar. Aquí una búsqueda binaria encuentra en un segundo ${strong('la calidad más alta que cabe en 50 KB')}, así que no pierdes nitidez de más.` },
      { title: 'Otros tamaños habituales', body: `Si el límite es más estricto, prueba ${link('/comprimir-imagen-20kb', 'comprimir a 20 KB')}; si es más generoso, ${link('/comprimir-imagen-100kb', 'a 100 KB')} o ${link('/comprimir-imagen-200kb', 'a 200 KB')}. Para fotos de documento con medidas oficiales, empieza por ${link('/foto-carnet', 'Foto carnet')}.` },
    ],
  },
  {
    slug: 'comprimir-imagen-100kb',
    tool: { kind: 'target-kb', kb: 100 },
    answer: 'Sube la imagen y pulsa «Comprimir a 100 KB»: obtendrás un JPG de 100 KB o menos con la mayor calidad posible. La compresión se hace en tu navegador, sin subir el archivo.',
    howTo: kbHowTo('100 KB'),
    faqs: [
      { q: '¿Cómo reduzco el peso de una foto a 100 KB?', a: 'Sube la foto y pulsa «Comprimir a 100 KB». La herramienta ajusta la calidad JPEG hasta encontrar el punto en el que el archivo no supera los 100 KB. Una foto de móvil de 3 MB suele quedarse en 100 KB a tamaño casi completo con calidad media-alta.' },
      { q: '¿Para qué sirve una imagen de 100 KB?', a: 'Es el límite típico de formularios de solicitud, foto del currículum en portales de empleo, fotos de producto en algunos marketplaces y adjuntos en plataformas de administración. También es un peso razonable para imágenes de blog que deben cargar rápido.' },
      { q: '¿Pierde mucha calidad?', a: 'Menos de lo que parece: el JPG descarta primero los detalles que el ojo no aprecia. A 100 KB una foto de 1200-1500 px se ve bien en pantalla. Pulsa sobre el resultado para compararlo y, si no te convence, recorta la imagen para que todo el peso se dedique a lo importante.' },
      { q: '¿Qué hago si la imagen tiene texto o es una captura?', a: 'Las capturas con texto se ven peor en JPG muy comprimido (aparecen manchas alrededor de las letras). Si el formulario lo permite, prueba antes «Imagen a WebP» o «Comprimir imagen» en PNG; si exige JPG, reduce las dimensiones de la captura antes de comprimir.' },
      { q: '¿Se conservan los datos EXIF de la foto?', a: 'No: al volver a codificar la imagen se eliminan los metadatos (modelo del móvil, fecha, ubicación GPS). Es una ventaja si vas a publicarla.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Cumple el límite a la primera', body: `Nada más frustrante que un formulario que rechaza tu foto por pesar 130 KB. Con esta herramienta ${strong('el resultado nunca pasa del objetivo')}, y verás el peso original, el final y la calidad usada.` },
      { title: 'Antes de comprimir', body: `Si te piden además unas medidas, ${link('/redimensionar', 'redimensiona')} primero; si la foto está girada, ${link('/girar', 'gírala')}. Para fotos de documento, prepara el recorte con ${link('/foto-carnet', 'Foto carnet')} y comprímela después.` },
    ],
  },
  {
    slug: 'comprimir-imagen-200kb',
    tool: { kind: 'target-kb', kb: 200 },
    answer: 'Sube tu imagen y pulsa «Comprimir a 200 KB»: la herramienta encuentra la mejor calidad JPEG por debajo de 200 KB. Sirve, por ejemplo, para la foto del formulario de visado de EE. UU. (máx. 240 KB). En tu navegador y gratis.',
    howTo: kbHowTo('200 KB'),
    faqs: [
      { q: '¿Cómo comprimo una imagen a menos de 200 KB?', a: 'Arrastra la imagen y pulsa «Comprimir a 200 KB». En la mayoría de fotos de móvil el resultado mantiene su tamaño original en píxeles y una calidad alta, porque 200 KB da bastante margen.' },
      { q: '¿Sirve para la foto del formulario DS-160 del visado de EE. UU.?', a: 'Sí. El formulario DS-160 exige una foto JPEG cuadrada de entre 600 × 600 y 1200 × 1200 píxeles y de 240 KB como máximo. Prepara la foto con «Foto visa Estados Unidos» (600 × 600 px, fondo blanco) y, si pasara de 240 KB, comprímela aquí a 200 KB para ir con margen.' },
      { q: '¿Qué otros sitios piden 200 KB?', a: 'Portales de empleo y universidades para la foto de perfil, sedes electrónicas para adjuntar documentos escaneados en imagen, foros y plataformas de anuncios. También es un buen peso para fotos de producto en una tienda online.' },
      { q: '¿Puedo elegir otro peso?', a: 'Sí. Además de los botones de 100 KB, 200 KB, 500 KB y 1 MB, el control deslizante permite cualquier objetivo entre 10 KB y 5 MB.' },
      { q: '¿Qué pasa con las fotos HEIC del iPhone?', a: 'Primero conviértelas a JPG con «HEIC a JPG» (o en lote con «Convertir varias imágenes») y después comprímelas aquí.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Calidad alta con un límite razonable', body: `200 KB es un límite cómodo: una foto de 2000 px de lado suele caber con calidad del 75-85 %, ${strong('sin diferencia visible')} respecto al original en pantalla.` },
      { title: 'Trámites con foto', body: `Para visados y pasaportes usa las medidas exactas: ${link('/foto-visa-estados-unidos', 'Foto visa Estados Unidos')}, ${link('/foto-visado-schengen', 'Foto visado Schengen')} o ${link('/foto-dni', 'Foto DNI')}. Si tu límite es menor, prueba ${link('/comprimir-imagen-100kb', 'a 100 KB')}.` },
    ],
  },
  {
    slug: 'comprimir-imagen-500kb',
    tool: { kind: 'target-kb', kb: 500 },
    answer: 'Sube la imagen y pulsa «Comprimir a 500 KB»: obtendrás un JPG de 500 KB o menos manteniendo prácticamente toda la calidad. Sin subir archivos: todo ocurre en tu navegador.',
    howTo: kbHowTo('500 KB'),
    faqs: [
      { q: '¿Cómo dejo una foto en menos de 500 KB?', a: 'Sube la foto y pulsa «Comprimir a 500 KB». Una foto de móvil de 12 megapíxeles suele caber en 500 KB a tamaño completo con calidad alta, así que no se reduce su resolución.' },
      { q: '¿Para qué se usa el límite de 500 KB?', a: 'Para adjuntos en plataformas de empresa y administración, fotos en portales inmobiliarios y de anuncios, portfolios y webs que limitan el tamaño de subida. También para enviar muchas fotos por correo sin superar el límite de adjuntos.' },
      { q: '¿Se nota la compresión a 500 KB?', a: 'En pantalla, prácticamente no. 500 KB es un peso generoso para un JPG: lo que se elimina son detalles finos que el ojo no percibe. Incluso se puede imprimir en tamaño 10 × 15 cm sin problemas.' },
      { q: '¿Es mejor comprimir o reducir el tamaño en píxeles?', a: 'Para fotos que solo se verán en pantalla, reducir a 1920 px de ancho y comprimir da archivos mucho más ligeros. Si necesitas conservar la resolución completa (para imprimir), comprimir a un peso como 500 KB es la mejor opción.' },
      { q: '¿Puedo hacerlo con muchas fotos a la vez?', a: 'Para un peso exacto se trabaja de una en una. Para aligerar un álbum completo usa «Comprimir varias imágenes», que procesa hasta 200 con la calidad que elijas.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Fotos ligeras sin perder resolución', body: `Reducir una foto de 4 MB a 500 KB divide su peso entre ocho ${strong('sin tocar sus dimensiones')}: ideal para subirla a una web, enviarla por correo o guardarla ocupando menos.` },
      { title: 'Más opciones', body: `Para webs, plantéate ${link('/imagen-a-webp', 'convertir a WebP')}, que pesa un 25-35 % menos que JPG con la misma calidad. Para varios archivos, ${link('/comprimir-varias-imagenes', 'comprime en lote')}.` },
    ],
  },
  {
    slug: 'comprimir-imagen-1mb',
    tool: { kind: 'target-kb', kb: 1024 },
    answer: 'Sube la imagen y pulsa «Comprimir a 1 MB»: se ajusta la calidad JPEG para que el archivo no pase de 1 MB conservando la resolución. Gratis, sin registro y en tu navegador.',
    howTo: kbHowTo('1 MB'),
    faqs: [
      { q: '¿Cómo reduzco una imagen a menos de 1 MB?', a: 'Arrastra la imagen y pulsa «Comprimir a 1 MB». Con 1 MB de margen casi cualquier foto conserva su resolución original y una calidad muy alta: solo se ajusta la compresión JPEG.' },
      { q: '¿Dónde piden imágenes de menos de 1 MB?', a: 'Es el límite más común en webs y aplicaciones: formularios de contacto con adjuntos, WordPress y otros gestores con configuración por defecto, plataformas educativas, foros, tiendas online y muchas sedes electrónicas.' },
      { q: '¿Cuánto ocupa 1 MB?', a: '1 MB son 1024 KB, es decir, algo más de un millón de bytes. Una foto de móvil actual pesa entre 2 y 6 MB en JPG y bastante más en HEIC, así que casi siempre hay que comprimirla para bajar de 1 MB.' },
      { q: '¿Y si mi imagen es un PNG o una captura de pantalla?', a: 'La herramienta la convierte a JPG, que es mucho más eficiente con fotos. En capturas con mucho texto, si el sitio admite PNG, puede ser mejor reducir sus dimensiones con «Redimensionar imagen» en lugar de convertirla.' },
      { q: '¿Funciona en el móvil?', a: 'Sí, en cualquier navegador moderno de Android o iPhone. Si tus fotos son HEIC (iPhone), conviértelas antes a JPG con «HEIC a JPG».' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'El límite de subida más habitual', body: `«El archivo no puede superar 1 MB» es el aviso más frecuente al subir una foto a una web. Aquí la dejas por debajo ${strong('sin perder resolución')} y en segundos.` },
      { title: 'Si necesitas menos peso', body: `Prueba ${link('/comprimir-imagen-500kb', 'a 500 KB')} o ${link('/comprimir-imagen-200kb', 'a 200 KB')}, o usa ${link('/comprimir', 'Comprimir imagen')} para controlar la calidad con vista previa.` },
    ],
  },
];

// ── Fotos de documento ──────────────────────────────────────────────────────

function photoHowTo(size: string): string[] {
  return [
    'Haz una foto de frente, con buena luz y sobre una pared clara, y súbela.',
    `Comprueba que está seleccionado «${size}» y elige el color de fondo.`,
    'Pulsa «Generar foto carnet»: se recorta centrada al tamaño exacto.',
    'Descarga la foto o la hoja de 10 × 15 cm con varias copias para imprimir.',
  ];
}

const PRINT_FAQ = {
  q: '¿Cómo la imprimo?',
  a: 'Pulsa «Descargar hoja para imprimir»: se genera una imagen de 10 × 15 cm a 300 ppp con varias copias y guías de corte. Llévala a cualquier tienda de revelado o máquina de fotos (es el tamaño estándar) o imprímela en casa en papel fotográfico a tamaño real, sin «ajustar a la página».',
};

const PHOTOS: Landing[] = [
  {
    slug: 'foto-dni',
    tool: { kind: 'id-photo', size: 'dni' },
    answer: 'Sube una foto de frente y la herramienta la recorta a 26 × 32 mm, el tamaño del DNI y del pasaporte de España, con fondo blanco. Descárgala o imprime una hoja de 10 × 15 cm con varias copias.',
    howTo: photoHowTo('DNI y pasaporte de España'),
    faqs: [
      { q: '¿Qué tamaño tiene la foto del DNI?', a: 'La foto del DNI y del pasaporte español mide 26 mm de ancho por 32 mm de alto. Debe ser reciente, en color, de frente, con la cabeza descubierta y sobre un fondo blanco, liso y uniforme. La herramienta genera exactamente ese tamaño a 300 ppp (307 × 378 píxeles).' },
      { q: '¿Qué requisitos debe cumplir la foto?', a: 'Rostro completo y centrado, mirando a la cámara, con expresión neutra y la boca cerrada; sin gafas de sol ni prendas que oculten la cara (salvo motivos religiosos, siempre que el óvalo facial se vea entero); buena iluminación sin sombras ni reflejos, y nítida. El fondo debe ser blanco y uniforme: si tu pared no lo es, quita el fondo antes con «Eliminar fondo».' },
      PRINT_FAQ,
      { q: '¿Me la aceptarán en la comisaría?', a: 'Si cumple los requisitos de encuadre, fondo e iluminación y está impresa en papel fotográfico de calidad, sí: lo que se valora es la foto, no dónde se hizo. Aun así, el funcionario puede rechazar una foto que no cumpla las condiciones; si tienes dudas, repítela con mejor luz.' },
      { q: '¿Sirve también para el NIE, el TIE o el carné de conducir?', a: 'El TIE y el permiso de conducir usan también una foto de 26 × 32 mm con fondo claro, así que normalmente sí. Para el pasaporte español la medida es la misma que para el DNI.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Ahórrate la tienda de fotos', body: `Con una foto hecha en casa con el móvil, buena luz natural y una pared blanca detrás tienes todo lo necesario. La herramienta ${strong('recorta al tamaño oficial y monta la hoja de copias')}; imprimir una foto de 10 × 15 cuesta unos céntimos en cualquier tienda.` },
      { title: 'Consejos para que salga bien', body: `Ponte a un metro de la pared para que no haya sombras, con la luz de frente (una ventana delante de ti) y la cámara a la altura de los ojos. Si el fondo no queda blanco, usa ${link('/eliminar-fondo', 'Eliminar fondo')} o ${link('/cambiar-fondo', 'Cambiar fondo')} antes de recortar. Más detalles en nuestra guía ${link('/blog/hacer-foto-carnet-digital-en-casa', 'para hacer la foto carnet en casa')}.` },
    ],
  },
  {
    slug: 'foto-tamano-pasaporte',
    tool: { kind: 'id-photo', size: 'mx-pasaporte' },
    answer: 'Sube una foto de frente y la herramienta la recorta al tamaño pasaporte de 3,5 × 4,5 cm con fondo blanco, el que piden muchos trámites en México y Latinoamérica. Descárgala o imprime varias copias en una hoja 10 × 15.',
    howTo: photoHowTo('Tamaño pasaporte 3,5 × 4,5 cm'),
    faqs: [
      { q: '¿Cuánto mide una foto tamaño pasaporte?', a: 'El tamaño pasaporte más extendido mide 3,5 cm de ancho por 4,5 cm de alto (35 × 45 mm), la medida que recomienda la Organización de Aviación Civil Internacional. La herramienta la genera a 300 ppp: 413 × 531 píxeles.' },
      { q: '¿Para qué trámites se usa?', a: 'Además de pasaportes y visados de muchos países, el tamaño pasaporte se pide para títulos y cédulas profesionales, credenciales escolares y de trabajo, licencias, solicitudes de empleo y trámites consulares. Comprueba siempre en la convocatoria si piden fondo blanco y si la foto debe ser a color o en blanco y negro.' },
      { q: '¿Qué diferencia hay con el tamaño infantil?', a: 'El tamaño infantil es más pequeño: 2,5 × 3 cm. Se usa sobre todo en credenciales escolares, expedientes y algunos documentos en México. Si te piden «tamaño infantil», usa la página Foto tamaño infantil.' },
      PRINT_FAQ,
      { q: '¿Puedo poner el fondo blanco si mi foto no lo tiene?', a: 'Sí: elimina el fondo con «Eliminar fondo» (IA) y después vuelve aquí; en el selector de color de fondo deja el blanco. El resultado tendrá un fondo blanco uniforme.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'La medida más pedida en trámites', body: `«Fotos tamaño pasaporte» es una de las frases que más se repiten en requisitos de trámites. Con esta herramienta ${strong('las haces en casa')} con el móvil y te llevas una hoja con varias copias lista para revelar.` },
      { title: 'Otros tamaños', body: `Si te piden otra medida, tienes ${link('/foto-tamano-infantil', 'tamaño infantil (2,5 × 3 cm)')}, ${link('/foto-4x4', 'foto 4 × 4 cm')}, ${link('/foto-visa-estados-unidos', 'visa de Estados Unidos (2 × 2 in)')} y el selector completo en ${link('/foto-carnet', 'Foto carnet')}.` },
    ],
  },
  {
    slug: 'foto-tamano-infantil',
    tool: { kind: 'id-photo', size: 'mx-infantil' },
    answer: 'Sube una foto de frente y la herramienta la recorta al tamaño infantil de 2,5 × 3 cm, con fondo blanco. Descárgala o imprime una hoja de 10 × 15 cm con muchas copias.',
    howTo: photoHowTo('Tamaño infantil (México)'),
    faqs: [
      { q: '¿Cuánto mide una foto tamaño infantil?', a: 'La foto tamaño infantil mide 2,5 cm de ancho por 3 cm de alto. La herramienta la genera a 300 ppp (295 × 354 píxeles), la resolución adecuada para imprimirla nítida.' },
      { q: '¿Para qué se piden fotos tamaño infantil?', a: 'Sobre todo en México: inscripciones y credenciales escolares, expedientes, credenciales de bibliotecas y clubes, y algunos trámites administrativos. Muchas escuelas piden varias copias, normalmente en blanco y negro o a color con fondo blanco.' },
      { q: '¿Cuántas fotos caben en la hoja de 10 × 15?', a: 'Con el tamaño infantil caben 15 copias (5 columnas por 3 filas) con separación para recortar. Imprimir una sola foto de 10 × 15 te da todas las copias que suele pedir una inscripción.' },
      { q: '¿Las piden en blanco y negro?', a: 'Algunos centros sí. Si es tu caso, convierte la foto con «Blanco y negro» antes de subirla aquí, o después sobre la hoja ya montada.' },
      PRINT_FAQ,
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Fotos para la escuela en un momento', body: `Inscripciones, credenciales, expedientes: el inicio de curso suele pedir ${strong('varias fotos tamaño infantil')}. Hazlas con el móvil sobre una pared blanca, recórtalas aquí y revela una sola hoja con 15 copias.` },
      { title: '¿Te piden otro tamaño?', body: `El tamaño pasaporte es ${link('/foto-tamano-pasaporte', '3,5 × 4,5 cm')}; también tienes ${link('/foto-4x4', '4 × 4 cm')} y más opciones en ${link('/foto-carnet', 'Foto carnet')}.` },
    ],
  },
  {
    slug: 'foto-visa-estados-unidos',
    tool: { kind: 'id-photo', size: 'pasaporte-usa' },
    answer: 'Sube una foto de frente y la herramienta la recorta a 2 × 2 pulgadas (600 × 600 px) con fondo blanco, el formato de la visa y el pasaporte de Estados Unidos. Sirve para el formulario DS-160 y para imprimir.',
    howTo: photoHowTo('Pasaporte y visa de EE. UU.'),
    faqs: [
      { q: '¿Qué tamaño tiene la foto para la visa americana?', a: 'La foto mide 2 × 2 pulgadas (51 × 51 mm), cuadrada. En formato digital, para el formulario DS-160, debe ser un JPEG de entre 600 × 600 y 1200 × 1200 píxeles y pesar como máximo 240 KB. La herramienta genera 600 × 600 px, que cumple ambos requisitos.' },
      { q: '¿Qué requisitos tiene la foto?', a: 'Tomada en los últimos 6 meses, a color, de frente, con expresión neutra y los ojos abiertos, sobre fondo blanco o blanquecino y sin sombras. La cabeza debe ocupar entre 1 y 1 3/8 pulgadas (25-35 mm) desde la barbilla hasta la parte superior del pelo. Desde 2016 no se admiten gafas, ni siquiera graduadas.' },
      { q: '¿Cómo encuadro bien la cabeza?', a: 'Haz la foto con la cabeza centrada y dejando algo de espacio por encima del pelo y por debajo de los hombros. Como el recorte es cuadrado y centrado, la cabeza debe ocupar aproximadamente la mitad o algo más del alto de la foto final; si queda pequeña, recorta antes la foto original más cerca de la cara.' },
      { q: '¿Cómo la subo al DS-160 si pesa más de 240 KB?', a: 'La foto que genera la herramienta suele pesar bastante menos. Si superase el límite, pásala por «Comprimir imagen a 200 KB» y súbela.' },
      PRINT_FAQ,
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Lista para el formulario DS-160', body: `El sistema del Departamento de Estado rechaza las fotos que no cumplen medidas, fondo o peso. Esta herramienta ${strong('genera directamente un JPEG de 600 × 600 px con fondo blanco')}; solo tienes que cuidar la luz y el encuadre al hacer la foto.` },
      { title: 'Fondo blanco perfecto', body: `Si tu pared no es blanca, quita el fondo con ${link('/eliminar-fondo', 'Eliminar fondo')} y vuelve aquí: el fondo se rellena de blanco. Para otros destinos: ${link('/foto-visado-schengen', 'visado Schengen')} o ${link('/foto-tamano-pasaporte', 'tamaño pasaporte')}.` },
    ],
  },
  {
    slug: 'foto-visado-schengen',
    tool: { kind: 'id-photo', size: 'visa' },
    answer: 'Sube una foto de frente y la herramienta la recorta a 35 × 45 mm con fondo claro, el formato del visado Schengen para viajar a Europa. Descárgala o imprime varias copias en una hoja 10 × 15.',
    howTo: photoHowTo('Visado Schengen'),
    faqs: [
      { q: '¿Qué tamaño tiene la foto del visado Schengen?', a: 'La foto mide 35 × 45 mm (ancho por alto), siguiendo la norma ICAO que aplican los consulados de los países Schengen. La herramienta la genera a 300 ppp: 413 × 531 píxeles.' },
      { q: '¿Qué requisitos debe cumplir?', a: 'Reciente (normalmente de los últimos 6 meses), a color, de frente, con expresión neutra y la boca cerrada, sobre fondo claro y uniforme (blanco o gris claro) y sin sombras. La cara debe ocupar entre el 70 y el 80 % del alto de la foto, es decir, de 32 a 36 mm desde la barbilla hasta la coronilla.' },
      { q: '¿Se pueden llevar gafas?', a: 'Se admiten gafas graduadas si los ojos se ven con claridad, sin reflejos y sin montura gruesa que los tape, aunque muchos consulados recomiendan quitárselas. Las gafas de sol y tintadas no se aceptan.' },
      { q: '¿Sirve para otros documentos europeos?', a: 'Sí: 35 × 45 mm es también el tamaño del pasaporte en muchos países de la Unión Europea y del Reino Unido, y el de numerosos visados de otros países. El pasaporte español, en cambio, usa 26 × 32 mm (página Foto DNI).' },
      PRINT_FAQ,
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Prepara tu solicitud de visado', body: `Los consulados devuelven solicitudes por fotos que no cumplen la norma. Genera la tuya ${strong('al tamaño exacto y con fondo uniforme')}, imprime la hoja de copias y guarda también el archivo digital por si te lo piden en la cita.` },
      { title: 'Más fotos para viajar', body: `Si viajas a Estados Unidos necesitas ${link('/foto-visa-estados-unidos', 'foto de 2 × 2 pulgadas')}; para el pasaporte español, ${link('/foto-dni', '26 × 32 mm')}. Otros formatos (Canadá, China…) en ${link('/foto-carnet', 'Foto carnet')}.` },
    ],
  },
  {
    slug: 'foto-4x4',
    tool: { kind: 'id-photo', size: '4x4' },
    answer: 'Sube una foto de frente y la herramienta la recorta a 4 × 4 cm con el fondo que elijas. Descárgala o imprime una hoja de 10 × 15 cm con varias copias listas para recortar.',
    howTo: photoHowTo('Carnet 4 × 4 cm'),
    faqs: [
      { q: '¿Cuánto mide una foto 4 × 4?', a: 'Es una foto cuadrada de 4 cm de lado. La herramienta la genera a 300 ppp, es decir, 472 × 472 píxeles, para que se imprima nítida.' },
      { q: '¿Para qué se piden fotos 4 × 4?', a: 'Para numerosos carnés y credenciales en Latinoamérica y España: carnés universitarios y de estudiante, credenciales de trabajo, licencias, carnés deportivos y de asociaciones, y algunos trámites administrativos. Revisa en cada caso si piden fondo blanco o de color.' },
      { q: '¿Puedo poner el fondo azul o celeste?', a: 'Sí. Algunos trámites piden fondo celeste o azul claro. Usa el selector de color de fondo antes de generar la foto. Si tu foto original tiene un fondo distinto, quítalo primero con «Eliminar fondo» para que el color se vea uniforme.' },
      { q: '¿Cuántas fotos 4 × 4 caben en una hoja 10 × 15?', a: 'Seis copias (3 × 2) con separación para recortar.' },
      PRINT_FAQ,
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Cuadrada y lista para recortar', body: `El formato 4 × 4 es habitual en carnés de estudiante y credenciales. ${strong('Hazla en casa')} con el móvil, elige el color de fondo que te pidan y revela una sola foto de 10 × 15 con seis copias.` },
      { title: 'Otros formatos', body: `Consulta también ${link('/foto-tamano-pasaporte', 'tamaño pasaporte 3,5 × 4,5 cm')}, ${link('/foto-tamano-infantil', 'tamaño infantil 2,5 × 3 cm')} o ${link('/foto-dni', 'foto DNI 26 × 32 mm')}.` },
    ],
  },
];

// ── Conversiones de formato ─────────────────────────────────────────────────

function convertHowTo(from: string, to: string): string[] {
  return [
    `Arrastra una o varias imágenes ${from}.`,
    to === 'PNG' ? 'Comprueba el formato de salida (PNG, sin pérdida).' : 'Ajusta la calidad si quieres (85-90 % es un buen punto de partida).',
    `Pulsa «Convertir»: cada imagen pasa a ${to} en tu navegador.`,
    'Descarga las imágenes una a una o todas juntas en un ZIP.',
  ];
}

const FORMATS: Landing[] = [
  {
    slug: 'png-a-webp',
    tool: { kind: 'image-format', format: 'image/webp', dropLabel: 'Arrastra tus imágenes PNG o haz clic' },
    answer: 'Arrastra tus PNG y pulsa «Convertir»: se pasan a WebP conservando la transparencia y pesando bastante menos. Puedes convertir hasta 200 a la vez y descargarlas en un ZIP.',
    howTo: convertHowTo('PNG', 'WebP'),
    faqs: [
      { q: '¿Cuánto pesa menos un WebP que un PNG?', a: 'Depende de la imagen: en fotografías guardadas como PNG la reducción suele superar el 70-80 %; en logotipos, iconos y capturas, entre un 25 y un 50 %. El WebP con pérdida a calidad alta es visualmente idéntico en la mayoría de los casos.' },
      { q: '¿Se conserva la transparencia?', a: 'Sí. WebP admite canal alfa, así que los fondos transparentes de tus PNG se mantienen. Es la gran ventaja frente a convertir a JPG.' },
      { q: '¿Qué calidad elijo?', a: 'Para fotos y gráficos con degradados, un 80-90 %. Para logotipos y capturas con texto, sube al 95-100 % para que los bordes queden perfectos. Puedes convertir una imagen de prueba y comparar antes de procesar todo el lote.' },
      { q: '¿Funciona WebP en todos los navegadores?', a: 'Sí: Chrome, Edge, Firefox, Safari (desde la versión 14) y todos los navegadores móviles actuales muestran WebP. Para una web es el formato recomendado por Google para mejorar la velocidad de carga.' },
      { q: '¿Puedo convertir muchos PNG a la vez?', a: 'Sí, hasta 200 por lote. Al terminar puedes descargarlos individualmente o todos juntos en un ZIP.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Webs más rápidas', body: `Las imágenes son la mayor parte del peso de una web. Pasar los PNG a WebP ${strong('acelera la carga y mejora las Core Web Vitals')} sin perder la transparencia de logotipos e iconos.` },
      { title: 'Otras conversiones', body: `Para fotos JPG usa ${link('/jpg-a-webp', 'JPG a WebP')}; para el camino inverso, ${link('/webp-a-png', 'WebP a PNG')}. Si buscas el mínimo peso posible, prueba también ${link('/comprimir', 'Comprimir imagen')}.` },
    ],
  },
  {
    slug: 'jpg-a-webp',
    tool: { kind: 'image-format', format: 'image/webp', dropLabel: 'Arrastra tus fotos JPG o haz clic' },
    answer: 'Arrastra tus fotos JPG y pulsa «Convertir»: se pasan a WebP con la calidad que elijas, normalmente con un 25-35 % menos de peso. Hasta 200 a la vez, descarga en ZIP.',
    howTo: convertHowTo('JPG', 'WebP'),
    faqs: [
      { q: '¿Por qué convertir JPG a WebP?', a: 'Porque WebP comprime mejor: con la misma calidad visual, un WebP pesa entre un 25 y un 35 % menos que un JPG. En una web eso significa páginas más rápidas y mejor posicionamiento.' },
      { q: '¿Pierden calidad mis fotos?', a: 'Un JPG ya está comprimido, y volver a comprimirlo siempre pierde algo de información. Con calidad del 85-90 % la diferencia no se aprecia a simple vista y el archivo sigue siendo más ligero. Conserva siempre tus originales.' },
      { q: '¿Qué calidad usar para una web?', a: 'Un 80 % es el punto de equilibrio habitual: buena calidad y peso muy reducido. Para fotos de producto donde importa el detalle, 85-90 %.' },
      { q: '¿Se pueden abrir los WebP en Windows o en el móvil?', a: 'Sí. Windows 10 y 11, macOS, Android, iOS y todos los navegadores actuales abren WebP. Algunos programas antiguos de edición no lo admiten; para ellos, mantén el JPG.' },
      { q: '¿Se conservan los datos EXIF?', a: 'No: al convertir se eliminan los metadatos (cámara, fecha, ubicación GPS). Para publicar en internet es una ventaja de privacidad.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Lote completo para tu web o tienda', body: `Convierte de una vez todas las fotos de tu catálogo o tu blog: ${strong('mismo aspecto, menos peso')}, y una web que carga más rápido en el móvil.` },
      { title: 'Relacionadas', body: `Si además necesitas cambiar el tamaño, usa ${link('/redimensionar-varias-imagenes', 'Redimensionar varias imágenes')}, que también exporta en WebP. Para PNG con transparencia, ${link('/png-a-webp', 'PNG a WebP')}.` },
    ],
  },
  {
    slug: 'avif-a-jpg',
    tool: { kind: 'image-format', format: 'image/jpeg', dropLabel: 'Arrastra tus imágenes AVIF o haz clic' },
    answer: 'Arrastra tus imágenes AVIF y pulsa «Convertir»: se pasan a JPG, el formato que abre cualquier programa o dispositivo. Hasta 200 a la vez, con descarga en ZIP y sin subir nada.',
    howTo: convertHowTo('AVIF', 'JPG'),
    faqs: [
      { q: '¿Qué es un archivo AVIF?', a: 'AVIF es un formato de imagen moderno basado en el códec de vídeo AV1. Comprime incluso mejor que WebP, y cada vez más webs lo usan; por eso al guardar una imagen de internet puede descargarse como .avif.' },
      { q: '¿Por qué convertir AVIF a JPG?', a: 'Porque muchos programas, editores antiguos, redes sociales y formularios todavía no aceptan AVIF. El JPG es universal: lo abre cualquier ordenador, móvil o impresora.' },
      { q: '¿Qué pasa con la transparencia?', a: 'El JPG no admite transparencia, así que las zonas transparentes se rellenan de blanco. Si necesitas conservarla, usa AVIF a PNG.' },
      { q: '¿Mi navegador puede leer AVIF?', a: 'Chrome, Edge, Firefox y Safari (desde la versión 16) leen AVIF, que es lo necesario para la conversión. Si tu navegador es muy antiguo, actualízalo.' },
      { q: '¿Qué calidad elijo?', a: 'Un 90 % mantiene la calidad del AVIF original con un tamaño razonable. El JPG pesará algo más que el AVIF: es el precio de la compatibilidad.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Abre tus AVIF en cualquier sitio', body: `¿Has descargado una imagen y no se abre? Conviértela a JPG ${strong('en un segundo y sin instalar nada')}, también en el móvil.` },
      { title: 'Otras conversiones', body: `Para conservar la transparencia usa ${link('/avif-a-png', 'AVIF a PNG')}. Si tus archivos son WebP, ${link('/webp-a-jpg', 'WebP a JPG')}; si son del iPhone, ${link('/heic-a-jpg', 'HEIC a JPG')}.` },
    ],
  },
  {
    slug: 'avif-a-png',
    tool: { kind: 'image-format', format: 'image/png', dropLabel: 'Arrastra tus imágenes AVIF o haz clic' },
    answer: 'Arrastra tus imágenes AVIF y pulsa «Convertir»: se pasan a PNG sin pérdida y conservando la transparencia. Hasta 200 a la vez, con descarga en ZIP.',
    howTo: convertHowTo('AVIF', 'PNG'),
    faqs: [
      { q: '¿Cuándo convertir AVIF a PNG en vez de a JPG?', a: 'Cuando la imagen tiene transparencia (logotipos, iconos, recortes) o texto y bordes nítidos (capturas, gráficos), o cuando vas a seguir editándola. El PNG no pierde calidad al guardar.' },
      { q: '¿Se mantiene la transparencia?', a: 'Sí, el PNG conserva el canal alfa de la imagen AVIF original.' },
      { q: '¿Por qué el PNG pesa mucho más?', a: 'Porque el PNG guarda la imagen sin pérdida, mientras que el AVIF la comprime con mucha eficiencia. Si el peso importa y no necesitas transparencia, convierte a JPG; si necesitas transparencia y poco peso, WebP es un buen término medio.' },
      { q: '¿Qué programas abren PNG?', a: 'Todos: navegadores, editores de imagen, procesadores de texto, presentaciones y redes sociales.' },
      { q: '¿Puedo convertir varias a la vez?', a: 'Sí, hasta 200 imágenes por lote, que puedes descargar en un ZIP.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Compatibilidad total sin perder calidad', body: `El PNG es ${strong('el formato más seguro para editar')} una imagen descargada en AVIF: no añade artefactos y respeta la transparencia.` },
      { title: 'Relacionadas', body: `Para un archivo más ligero, ${link('/avif-a-jpg', 'AVIF a JPG')}; para webs, ${link('/png-a-webp', 'PNG a WebP')}.` },
    ],
  },
  {
    slug: 'bmp-a-jpg',
    tool: { kind: 'image-format', format: 'image/jpeg', dropLabel: 'Arrastra tus imágenes BMP o haz clic' },
    answer: 'Arrastra tus archivos BMP y pulsa «Convertir»: se pasan a JPG y su peso se reduce de forma drástica. Hasta 200 a la vez, descarga en ZIP, sin subir nada.',
    howTo: convertHowTo('BMP', 'JPG'),
    faqs: [
      { q: '¿Qué es un archivo BMP?', a: 'BMP (mapa de bits) es un formato de imagen de Windows que guarda cada píxel sin comprimir. Por eso los BMP ocupan muchísimo: una captura de pantalla Full HD puede pesar más de 6 MB.' },
      { q: '¿Cuánto se reduce el peso?', a: 'Muchísimo: pasar un BMP a JPG suele reducir su peso entre un 90 y un 98 %, con una calidad visual prácticamente igual.' },
      { q: '¿Y si mi BMP tiene texto o gráficos?', a: 'Para capturas con texto, esquemas o gráficos con bordes nítidos, el JPG puede mostrar pequeñas manchas alrededor de las letras. Sube la calidad al 95 % o convierte a PNG, que es sin pérdida y también mucho más ligero que el BMP.' },
      { q: '¿Por qué convertir BMP?', a: 'Para poder enviarlos por correo o WhatsApp, subirlos a webs y formularios (que casi nunca aceptan BMP) y ahorrar espacio en el disco.' },
      { q: '¿Puedo convertir una carpeta entera?', a: 'Selecciona todos los archivos BMP de la carpeta (Ctrl+A en el selector) y arrástralos: se convierten hasta 200 de una vez y se descargan en un ZIP.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'De megas a kilobytes', body: `Los BMP vienen de escáneres antiguos, programas de dibujo y capturas de Windows. Convertirlos a JPG ${strong('los hace compatibles con todo')} y libera espacio.` },
      { title: 'Relacionadas', body: `Si quieres reducir aún más el peso, ${link('/comprimir-varias-imagenes', 'comprime en lote')}; para cambiar el tamaño, ${link('/redimensionar-varias-imagenes', 'redimensiona en lote')}.` },
    ],
  },
  {
    slug: 'heic-a-png',
    tool: { kind: 'image-format', format: 'image/png', dropLabel: 'Arrastra tus fotos HEIC del iPhone o haz clic' },
    answer: 'Arrastra tus fotos HEIC del iPhone y pulsa «Convertir»: se pasan a PNG sin pérdida, compatibles con Windows, Android y cualquier programa. Hasta 200 a la vez, descarga en ZIP.',
    howTo: convertHowTo('HEIC', 'PNG'),
    faqs: [
      { q: '¿Qué es un archivo HEIC?', a: 'HEIC (o HEIF) es el formato en el que el iPhone guarda las fotos desde iOS 11. Ocupa la mitad que un JPG con la misma calidad, pero muchos programas, webs y ordenadores con Windows no lo abren.' },
      { q: '¿PNG o JPG para mis fotos del iPhone?', a: 'Para compartir o subir fotos, JPG: pesa mucho menos. Elige PNG si vas a editarlas y quieres evitar cualquier pérdida de calidad al guardar, o si un programa te pide expresamente PNG. Para JPG tienes la herramienta HEIC a JPG.' },
      { q: '¿Por qué el PNG pesa tanto?', a: 'Porque guarda la foto sin pérdida: una foto de 12 megapíxeles puede ocupar 15-25 MB en PNG, frente a 2-3 MB en HEIC. Es normal.' },
      { q: '¿Puedo evitar que el iPhone haga fotos HEIC?', a: 'Sí: en Ajustes > Cámara > Formatos, elige «Más compatible» y el iPhone guardará en JPG. Además, al enviar fotos por correo o AirDrop a un PC, iOS suele convertirlas automáticamente.' },
      { q: '¿Se conservan la fecha y la ubicación?', a: 'No: al convertir se eliminan los metadatos EXIF, incluida la ubicación GPS. Es una ventaja si vas a publicar las fotos.' },
      PRIVACY_FAQ,
    ],
    sections: [
      { title: 'Tus fotos del iPhone, en cualquier ordenador', body: `Convierte de golpe ${strong('todas las fotos HEIC')} que has pasado al ordenador y que Windows no muestra. Sin instalar extensiones ni programas.` },
      { title: 'Relacionadas', body: `Para archivos más ligeros, ${link('/heic-a-jpg', 'HEIC a JPG')} o ${link('/convertir-varias-imagenes', 'Convertir varias imágenes')} a JPG o WebP.` },
    ],
  },
];

// ── Audio ───────────────────────────────────────────────────────────────────

const AUDIO: Landing[] = [
  {
    slug: 'mp3-a-wav',
    tool: { kind: 'audio-wav' },
    answer: 'Sube tu archivo MP3 y pulsa «Convertir»: se descomprime a WAV PCM sin pérdida adicional, el formato que piden los editores de audio, DAW y muchas centralitas. Todo en tu navegador.',
    howTo: [
      'Sube el archivo MP3.',
      'Elige la frecuencia de muestreo: 44,1 kHz (CD) o 48 kHz (vídeo).',
      'Pulsa «Convertir» y espera unos segundos.',
      'Descarga el archivo WAV.',
    ],
    faqs: [
      { q: '¿Mejora la calidad al pasar de MP3 a WAV?', a: 'No. El MP3 ya descartó información al comprimirse y esa información no se recupera. Lo que consigues es el mismo sonido en un formato sin compresión, que no perderá más calidad al editarlo y volver a guardarlo.' },
      { q: '¿Para qué necesito un WAV?', a: 'Para editar en programas como Audacity, Adobe Audition o cualquier DAW sin pérdidas acumuladas, para importar audio en centralitas telefónicas y sistemas de megafonía, para algunos programas de vídeo y para grabar un CD de audio.' },
      { q: '¿Por qué el WAV ocupa tanto?', a: 'Porque guarda el audio sin comprimir: a calidad de CD (44,1 kHz, 16 bits, estéreo) un minuto ocupa unos 10 MB, frente a menos de 1 MB en MP3.' },
      { q: '¿Puedo convertir otros formatos a WAV?', a: 'Sí: la herramienta Audio a WAV acepta también M4A, OGG, AAC y FLAC. Y para el camino inverso tienes WAV a MP3.' },
      { q: '¿Se sube mi audio a un servidor?', a: 'No. La conversión se hace con FFmpeg compilado a WebAssembly dentro de tu navegador. La primera vez se descarga el procesador (unos 30 MB); después es instantáneo.' },
    ],
    sections: [
      { title: 'Audio listo para editar', body: `Antes de cortar, mezclar o aplicar efectos, pasar el MP3 a WAV ${strong('evita que cada guardado degrade el sonido')}. Después podrás exportar el resultado final al formato que quieras.` },
      { title: 'Relacionadas', body: `Para volver a comprimir, ${link('/wav-a-mp3', 'WAV a MP3')}; para cortar el audio, ${link('/cortar-audio', 'Cortar audio')}; para otros formatos, ${link('/convertir-audio', 'Convertir audio')}.` },
    ],
  },
];

export const LANDINGS: Landing[] = [...KB, ...PHOTOS, ...FORMATS, ...AUDIO];
