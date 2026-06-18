export const SITE = {
  name: 'ToolsFoto',
  url: 'https://toolsfoto.com',
  description: 'Herramientas online para imágenes, PDF y developers. Gratis, sin registro y sin subir archivos al servidor. Todo se procesa en tu navegador.',
  ogImage: 'https://toolsfoto.com/og-image.png',
  twitterHandle: '@toolsfoto',
};

export interface PageSEO {
  title: string;
  description: string;
  canonical: string;
}

export const PAGE_SEO: Record<string, PageSEO> = {
  home: {
    title: 'ToolsFoto — Herramientas online para imagen, PDF, vídeo y audio',
    description: '184 herramientas online gratis para imagen, PDF, vídeo, audio y developers. Comprime, convierte, recorta y edita sin registro. Todo se procesa en tu navegador.',
    canonical: 'https://toolsfoto.com',
  },
  comprimir: {
    title: 'Comprimir imágenes online gratis | ToolsFoto',
    description: 'Reduce el tamaño de tus imágenes JPG, PNG y WebP sin perder calidad. Compresión 100% en el navegador, sin subir archivos al servidor. Rápido y gratis.',
    canonical: 'https://toolsfoto.com/comprimir',
  },
  redimensionar: {
    title: 'Redimensionar imágenes online gratis | ToolsFoto',
    description: 'Cambia el tamaño de tus imágenes por píxeles o porcentaje. Mantén la proporción automáticamente. Sin registro, sin límites, 100% gratis.',
    canonical: 'https://toolsfoto.com/redimensionar',
  },
  recortar: {
    title: 'Recortar imágenes online gratis | ToolsFoto',
    description: 'Recorta tus imágenes con precisión usando nuestra herramienta drag & drop. Presets de proporción: 1:1, 16:9, 4:3, 9:16. Gratis y sin registro.',
    canonical: 'https://toolsfoto.com/recortar',
  },
  convertir: {
    title: 'Convertir imágenes online gratis: JPG, PNG, WebP, AVIF | ToolsFoto',
    description: 'Convierte tus imágenes entre JPG, PNG, WebP y AVIF en segundos. Sin programas, sin registro. Ve el tamaño estimado antes de convertir.',
    canonical: 'https://toolsfoto.com/convertir',
  },
  girar: {
    title: 'Girar y voltear imágenes online gratis | ToolsFoto',
    description: 'Rota tus imágenes 90°, 180° o 270° y voltéalas horizontal o verticalmente. Preview en tiempo real. Gratis y sin registro.',
    canonical: 'https://toolsfoto.com/girar',
  },
  'marca-de-agua': {
    title: 'Añadir marca de agua a imágenes online gratis | ToolsFoto',
    description: 'Añade marca de agua de texto o imagen a tus fotos. Controla opacidad, posición y tamaño. Sin registro, sin marcas de terceros.',
    canonical: 'https://toolsfoto.com/marca-de-agua',
  },
  meme: {
    title: 'Creador de memes online gratis | ToolsFoto',
    description: 'Crea memes con texto superior e inferior estilo clásico. Fuente Impact, outline negro, tamaño ajustable. Descarga en JPG o PNG.',
    canonical: 'https://toolsfoto.com/meme',
  },
  editor: {
    title: 'Editor de imágenes online gratis | ToolsFoto',
    description: 'Ajusta brillo, contraste, saturación, temperatura y nitidez. 6 presets profesionales: vintage, B&N, vivid, fade, cinematic, cool. Gratis.',
    canonical: 'https://toolsfoto.com/editor',
  },
  'eliminar-fondo': {
    title: 'Eliminar fondo de imagen con IA gratis | ToolsFoto',
    description: 'Elimina el fondo de tus fotos automáticamente con inteligencia artificial. Descarga en PNG transparente o con fondo de color. Sin registro.',
    canonical: 'https://toolsfoto.com/eliminar-fondo',
  },
  'html-a-imagen': {
    title: 'Convertir HTML a imagen PNG gratis | ToolsFoto',
    description: 'Convierte código HTML y CSS en imágenes PNG o JPG. Ideal para OG images, banners y capturas de componentes. Sin registro ni instalación.',
    canonical: 'https://toolsfoto.com/html-a-imagen',
  },
  pixelar: {
    title: 'Pixelar zonas de una imagen online gratis | ToolsFoto',
    description: 'Censura caras, datos sensibles o aplica efecto pixel art. Selecciona la zona y ajusta la intensidad. Gratis, sin subir imágenes al servidor.',
    canonical: 'https://toolsfoto.com/pixelar',
  },
  redondear: {
    title: 'Redondear esquinas de imagen online gratis | ToolsFoto',
    description: 'Añade esquinas redondeadas a tus imágenes y exporta como PNG transparente. Control total del radio. Sin registro, sin subir archivos al servidor.',
    canonical: 'https://toolsfoto.com/redondear',
  },
  'recorte-circular': {
    title: 'Recorte circular de imagen online gratis | ToolsFoto',
    description: 'Recorta tu imagen en forma de círculo o elipse perfecta. Exporta como PNG con fondo transparente. Ideal para fotos de perfil y avatares.',
    canonical: 'https://toolsfoto.com/recorte-circular',
  },
  marco: {
    title: 'Añadir marco o borde a imagen online gratis | ToolsFoto',
    description: 'Rodea tu imagen con un marco de color y grosor ajustables. Elige entre múltiples estilos de borde. Gratis y sin registro.',
    canonical: 'https://toolsfoto.com/marco',
  },
  desenfoque: {
    title: 'Desenfocar imagen online gratis | ToolsFoto',
    description: 'Aplica desenfoque gaussiano a tus imágenes con intensidad ajustable. Perfecto para fondos borrosos y proteger información sensible. Sin registro.',
    canonical: 'https://toolsfoto.com/desenfoque',
  },
  blancoynegro: {
    title: 'Convertir imagen a blanco y negro online gratis | ToolsFoto',
    description: 'Transforma tus fotos a escala de grises con ajuste de brillo y contraste. Conversión profesional con ponderación luminosa correcta. Gratis.',
    canonical: 'https://toolsfoto.com/blancoynegro',
  },
  invertir: {
    title: 'Invertir colores de imagen online gratis | ToolsFoto',
    description: 'Aplica el efecto negativo a tus imágenes invirtiendo todos los colores. Ideal para efectos artísticos y análisis. Sin registro, 100% gratis.',
    canonical: 'https://toolsfoto.com/invertir',
  },
  paleta: {
    title: 'Extraer la paleta de colores de una imagen online gratis | ToolsFoto',
    description: 'Saca los colores dominantes de cualquier foto y descarga su paleta lista para moodboards, branding e inspiración de diseño. Códigos HEX incluidos. Sin registro, 100% en tu navegador.',
    canonical: 'https://toolsfoto.com/paleta',
  },
  collage: {
    title: 'Crear collage de imágenes online gratis | ToolsFoto',
    description: 'Combina 2 a 6 imágenes en un collage con cuadrículas personalizables. Ajusta espaciado y fondo. Gratis, sin registro, sin subir imágenes.',
    canonical: 'https://toolsfoto.com/collage',
  },
  texto: {
    title: 'Añadir texto a imagen online gratis | ToolsFoto',
    description: 'Escribe texto sobre tus imágenes con control de fuente, tamaño, color y posición. Ideal para subtítulos, etiquetas y títulos. Sin registro.',
    canonical: 'https://toolsfoto.com/texto',
  },
  sombra: {
    title: 'Añadir sombra a imagen online gratis | ToolsFoto',
    description: 'Agrega un efecto de sombra paralela a tus imágenes. Ajusta desplazamiento, desenfoque y color. Exporta como PNG transparente. Gratis.',
    canonical: 'https://toolsfoto.com/sombra',
  },
  privacidad: {
    title: 'Política de Privacidad | ToolsFoto',
    description: 'Política de privacidad de ToolsFoto. Ninguna imagen ni dato personal sale de tu dispositivo. No hay servidores, no hay registro, no hay seguimiento.',
    canonical: 'https://toolsfoto.com/privacidad',
  },
  terminos: {
    title: 'Términos de Uso | ToolsFoto',
    description: 'Términos y condiciones de uso de ToolsFoto. Herramientas de edición de imágenes gratuitas y online. Uso permitido, limitaciones de responsabilidad.',
    canonical: 'https://toolsfoto.com/terminos',
  },
  cookies: {
    title: 'Política de Cookies | ToolsFoto',
    description: 'ToolsFoto no usa cookies de seguimiento ni publicidad. Consulta qué almacenamiento usa el navegador para el correcto funcionamiento de las herramientas.',
    canonical: 'https://toolsfoto.com/cookies',
  },
  'aviso-legal': {
    title: 'Aviso Legal | ToolsFoto',
    description: 'Aviso legal de ToolsFoto. Información sobre el titular del sitio, propiedad intelectual y condiciones de uso del servicio.',
    canonical: 'https://toolsfoto.com/aviso-legal',
  },
  contacto: {
    title: 'Contacto | ToolsFoto',
    description: 'Contacta con el equipo de ToolsFoto para consultas, sugerencias o reportar problemas. Respondemos a todos los mensajes.',
    canonical: 'https://toolsfoto.com/contacto',
  },

  // ── PDF tools ──────────────────────────────────────────────
  'comprimir-pdf': {
    title: 'Comprimir PDF online gratis | ToolsFoto',
    description: 'Reduce el tamaño de tus PDFs sin pérdida de calidad. Compresión 100% en el navegador, sin subir archivos. Ideal para emails y formularios con límite de peso.',
    canonical: 'https://toolsfoto.com/comprimir-pdf',
  },
  'unir-pdfs': {
    title: 'Unir PDFs online gratis | ToolsFoto',
    description: 'Combina varios archivos PDF en uno solo. Reordena los documentos antes de fusionarlos. Sin registro, sin servidores, 100% privado.',
    canonical: 'https://toolsfoto.com/unir-pdfs',
  },
  'dividir-pdf': {
    title: 'Dividir PDF online gratis | ToolsFoto',
    description: 'Divide un PDF en páginas individuales o extrae un rango de páginas. Sin instalación ni registro. El procesamiento es 100% local en tu navegador.',
    canonical: 'https://toolsfoto.com/dividir-pdf',
  },
  'pdf-a-jpg': {
    title: 'Convertir PDF a JPG online gratis | ToolsFoto',
    description: 'Convierte cada página de tu PDF en una imagen JPG de alta calidad. Descarga las páginas individualmente. Sin registro, sin subir archivos al servidor.',
    canonical: 'https://toolsfoto.com/pdf-a-jpg',
  },
  'jpg-a-pdf': {
    title: 'Convertir JPG a PDF online gratis | ToolsFoto',
    description: 'Crea un PDF a partir de imágenes JPG, PNG o WebP. Selecciona el tamaño de página (A4, Carta o automático). Sin registro, procesamiento 100% local.',
    canonical: 'https://toolsfoto.com/jpg-a-pdf',
  },
  'extraer-texto-pdf': {
    title: 'Extraer texto de PDF online gratis | ToolsFoto',
    description: 'Copia todo el texto de un PDF al instante. Descarga el contenido como .txt o cópialo al portapapeles. Sin OCR para PDFs escaneados. Gratis y sin registro.',
    canonical: 'https://toolsfoto.com/extraer-texto-pdf',
  },
  'rotar-pdf': {
    title: 'Rotar PDF online gratis | ToolsFoto',
    description: 'Gira las páginas de tu PDF 90°, 180° o 270°. Corrige la orientación de documentos escaneados. Sin registro, procesamiento 100% en tu navegador.',
    canonical: 'https://toolsfoto.com/rotar-pdf',
  },
  'proteger-pdf': {
    title: 'Proteger PDF con contraseña online gratis | ToolsFoto',
    description: 'Añade contraseña a tu PDF para proteger su contenido. El cifrado se aplica en tu navegador: la contraseña nunca se envía a ningún servidor.',
    canonical: 'https://toolsfoto.com/proteger-pdf',
  },
  'eliminar-password-pdf': {
    title: 'Eliminar contraseña de PDF online gratis | ToolsFoto',
    description: 'Desbloquea un PDF protegido con contraseña. Introduce la contraseña actual y descarga el PDF sin protección. 100% local, sin servidores.',
    canonical: 'https://toolsfoto.com/eliminar-password-pdf',
  },
  'extraer-paginas-pdf': {
    title: 'Extraer páginas de PDF online gratis | ToolsFoto',
    description: 'Selecciona páginas concretas o rangos (1-3, 5, 8-10) y extráelas como nuevo PDF. Sin registro, sin subir archivos. Gratis y sin límite de páginas.',
    canonical: 'https://toolsfoto.com/extraer-paginas-pdf',
  },

  // ── Video tools ─────────────────────────────────────────────
  'comprimir-video': {
    title: 'Comprimir vídeo online gratis | ToolsFoto',
    description: 'Reduce el tamaño de tu vídeo MP4 o WebM ajustando la calidad CRF. Procesamiento 100% en el navegador con FFmpeg.wasm. Sin subir archivos al servidor.',
    canonical: 'https://toolsfoto.com/comprimir-video',
  },
  'convertir-video': {
    title: 'Convertir vídeo online gratis: MP4, WebM | ToolsFoto',
    description: 'Convierte tus vídeos entre MP4 (H.264) y WebM (VP8) sin instalar nada. Procesamiento 100% local con FFmpeg.wasm. Sin registro, sin límites.',
    canonical: 'https://toolsfoto.com/convertir-video',
  },
  'extraer-audio': {
    title: 'Extraer audio de vídeo online gratis | ToolsFoto',
    description: 'Extrae la pista de audio de cualquier vídeo MP4 o WebM como MP3 o WAV. Procesamiento 100% en el navegador con FFmpeg.wasm. Sin registro.',
    canonical: 'https://toolsfoto.com/extraer-audio',
  },
  'video-a-gif': {
    title: 'Convertir vídeo a GIF online gratis | ToolsFoto',
    description: 'Transforma un clip de vídeo en un GIF animado. Ajusta el inicio, duración, FPS y tamaño. Procesamiento 100% local con FFmpeg.wasm. Gratis y sin registro.',
    canonical: 'https://toolsfoto.com/video-a-gif',
  },
  'recortar-video': {
    title: 'Recortar vídeo online gratis | ToolsFoto',
    description: 'Recorta un fragmento de vídeo seleccionando el segundo de inicio y fin. Sin pérdida de calidad. Procesamiento 100% local con FFmpeg.wasm. Gratis.',
    canonical: 'https://toolsfoto.com/recortar-video',
  },

  // ── Audio tools ─────────────────────────────────────────────
  'comprimir-audio': {
    title: 'Comprimir audio online gratis | ToolsFoto',
    description: 'Reduce el tamaño de archivos MP3, WAV y OGG ajustando el bitrate. Procesamiento 100% en el navegador con FFmpeg.wasm. Sin subir archivos al servidor.',
    canonical: 'https://toolsfoto.com/comprimir-audio',
  },
  'convertir-audio': {
    title: 'Convertir audio online gratis: MP3, WAV, OGG, AAC | ToolsFoto',
    description: 'Convierte tus archivos de audio entre MP3, WAV, OGG y AAC. Procesamiento 100% local con FFmpeg.wasm. Sin registro, sin límites, completamente gratis.',
    canonical: 'https://toolsfoto.com/convertir-audio',
  },
  'cortar-audio': {
    title: 'Cortar audio online gratis | ToolsFoto',
    description: 'Extrae un fragmento de audio definiendo el tiempo de inicio y fin. Perfecto para clips, tonos y extractos. 100% local con FFmpeg.wasm. Sin registro.',
    canonical: 'https://toolsfoto.com/cortar-audio',
  },
  'unir-audios': {
    title: 'Unir audios online gratis | ToolsFoto',
    description: 'Combina varios archivos de audio en uno solo. Reordena las pistas antes de fusionarlas. Procesamiento 100% local con FFmpeg.wasm. Gratis y sin registro.',
    canonical: 'https://toolsfoto.com/unir-audios',
  },
  'cambiar-volumen': {
    title: 'Cambiar volumen de audio online gratis | ToolsFoto',
    description: 'Sube o baja el volumen de cualquier audio entre -20 dB y +20 dB. También normaliza al nivel máximo. Procesamiento 100% local con FFmpeg.wasm. Gratis.',
    canonical: 'https://toolsfoto.com/cambiar-volumen',
  },

  // ── Developer tools ─────────────────────────────────────────
  'svg-a-png': {
    title: 'Convertir SVG a PNG online gratis | ToolsFoto',
    description: 'Convierte archivos SVG a PNG con el tamaño y fondo que necesites. Ideal para exportar iconos y logos para web, apps y documentos. Sin registro.',
    canonical: 'https://toolsfoto.com/svg-a-png',
  },
  'colores-imagen': {
    title: 'Sacar códigos de color HEX, RGB y HSL de una imagen | ToolsFoto',
    description: 'Obtén los códigos HEX, RGB y HSL de los colores de cualquier imagen, con variables CSS listas para copiar. Cuentagotas online para developers y maquetadores. Sin registro, 100% gratis.',
    canonical: 'https://toolsfoto.com/colores-imagen',
  },
  'eliminar-exif': {
    title: 'Eliminar metadatos EXIF de imágenes gratis | ToolsFoto',
    description: 'Borra GPS, modelo de cámara, fecha y todos los metadatos EXIF de tus fotos antes de publicarlas en redes sociales, marketplaces o tu web. Protege tu privacidad. Canvas API, 100% local. Sin registro.',
    canonical: 'https://toolsfoto.com/eliminar-exif',
  },
  'imagen-a-base64': {
    title: 'Convertir imagen a Base64 online gratis | ToolsFoto',
    description: 'Codifica cualquier imagen en Base64 para incrustarla en HTML, CSS, JSON o JavaScript. Genera Data URIs listos para usar en webs, correos HTML y APIs. Muestra HTML, CSS, JSON, JS y Base64 puro. Sin registro.',
    canonical: 'https://toolsfoto.com/imagen-a-base64',
  },
  'generar-favicon': {
    title: 'Generar favicon PNG online gratis — todos los tamaños | ToolsFoto',
    description: 'Genera los 5 tamaños estándar de favicon (16×16, 32×32, 48×48, 96×96, 180×180) desde cualquier imagen. Descarga todos los PNG y copia las etiquetas HTML listas para WordPress, Wix, Shopify o webs estáticas. Sin registro.',
    canonical: 'https://toolsfoto.com/generar-favicon',
  },

  // ── Nuevas herramientas de imagen ────────────────────────────
  espejo: {
    title: 'Voltear imagen online gratis — espejo horizontal y vertical | ToolsFoto',
    description: 'Voltea o refleja tu imagen en espejo horizontal, vertical o en ambos ejes. Preview instantáneo, sin registro, sin subir archivos. 100% gratis en el navegador.',
    canonical: 'https://toolsfoto.com/espejo',
  },
  'foto-carnet': {
    title: 'Foto carnet online gratis — DNI, pasaporte, visado | ToolsFoto',
    description: 'Crea fotos de carnet para DNI, pasaporte, carnet de conducir y visado con los tamaños oficiales. Recorte automático, descarga en PNG. Sin registro, completamente gratis.',
    canonical: 'https://toolsfoto.com/foto-carnet',
  },
  'redimensionar-redes': {
    title: 'Redimensionar imagen para redes sociales gratis | ToolsFoto',
    description: 'Ajusta tus fotos al tamaño perfecto para Instagram, YouTube, Twitter, Facebook, TikTok y LinkedIn con un clic. Sin registro, sin subir archivos al servidor. 100% gratis.',
    canonical: 'https://toolsfoto.com/redimensionar-redes',
  },
  'efecto-vintage': {
    title: 'Efecto vintage a fotos online gratis — sepia, retro, polaroid | ToolsFoto',
    description: 'Aplica efectos vintage profesionales a tus fotos: sepia, vintage clásico, efecto cine, polaroid y noir. Slider de intensidad ajustable. Gratis, sin registro, sin subir imágenes.',
    canonical: 'https://toolsfoto.com/efecto-vintage',
  },
  'thumbnail-youtube': {
    title: 'Crear miniatura para YouTube gratis (1280×720) | ToolsFoto',
    description: 'Diseña miniaturas profesionales para YouTube en 1280×720. Sube tu fondo, añade texto con fuente y color personalizables. Descarga en PNG. Sin registro, completamente gratis.',
    canonical: 'https://toolsfoto.com/thumbnail-youtube',
  },
  'imagenes-a-gif': {
    title: 'Crear GIF animado desde imágenes online gratis | ToolsFoto',
    description: 'Convierte varias imágenes JPG o PNG en un GIF animado. Ajusta la velocidad, el tamaño y hasta 20 fotogramas. Optimización de paleta con FFmpeg.wasm. Sin registro.',
    canonical: 'https://toolsfoto.com/imagenes-a-gif',
  },

  // ── Nuevas herramientas de PDF ────────────────────────────────
  'marca-agua-pdf': {
    title: 'Añadir marca de agua a PDF online gratis | ToolsFoto',
    description: 'Añade texto en marca de agua diagonal a todas las páginas de tu PDF. Controla la opacidad, color y tamaño. Sin subir archivos al servidor. 100% privado y gratis.',
    canonical: 'https://toolsfoto.com/marca-agua-pdf',
  },
  'numerar-paginas-pdf': {
    title: 'Numerar páginas de PDF online gratis | ToolsFoto',
    description: 'Añade numeración automática a las páginas de tu PDF. Elige posición, número inicial y formato. Procesamiento 100% local en el navegador. Sin registro, completamente gratis.',
    canonical: 'https://toolsfoto.com/numerar-paginas-pdf',
  },
  'firmar-pdf': {
    title: 'Firmar PDF online gratis — firma digital | ToolsFoto',
    description: 'Dibuja tu firma con el ratón o el dedo y colócala en cualquier página de tu PDF. Firma digital 100% local, sin servidores ni registro. Completamente gratis.',
    canonical: 'https://toolsfoto.com/firmar-pdf',
  },
  'pdf-a-png': {
    title: 'Convertir PDF a PNG online gratis — alta calidad | ToolsFoto',
    description: 'Convierte cada página de tu PDF en una imagen PNG de alta calidad sin pérdida. Ideal para PDFs con texto y gráficos vectoriales. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/pdf-a-png',
  },
  'reordenar-paginas-pdf': {
    title: 'Reordenar páginas de PDF online gratis | ToolsFoto',
    description: 'Cambia el orden de las páginas de tu PDF de forma visual. Mueve páginas arriba o abajo y descarga el PDF reordenado. Sin registro, sin subir archivos al servidor. Gratis.',
    canonical: 'https://toolsfoto.com/reordenar-paginas-pdf',
  },
  'recortar-pdf': {
    title: 'Recortar márgenes de PDF online gratis | ToolsFoto',
    description: 'Elimina los márgenes en blanco de todas las páginas de tu PDF ajustando el recorte en milímetros. Ideal para documentos escaneados. Sin registro, 100% local. Gratis.',
    canonical: 'https://toolsfoto.com/recortar-pdf',
  },

  // ── Nuevas herramientas developer ─────────────────────────────
  'generar-qr': {
    title: 'Generador de código QR online gratis | ToolsFoto',
    description: 'Crea códigos QR para URLs, textos o contactos al instante. Personaliza el tamaño, colores y corrección de errores. Descarga en PNG. Sin registro, completamente gratis.',
    canonical: 'https://toolsfoto.com/generar-qr',
  },
  'formatear-json': {
    title: 'Formatear y validar JSON online gratis | ToolsFoto',
    description: 'Formatea, valida y minifica JSON en segundos. Indentación con 2 o 4 espacios, minificado o validación con detección de errores. Copia o descarga el resultado. 100% gratis.',
    canonical: 'https://toolsfoto.com/formatear-json',
  },
  'codificar-url': {
    title: 'Codificar y decodificar URL online gratis | ToolsFoto',
    description: 'Codifica o decodifica URLs y componentes de URL al instante con encodeURI y encodeURIComponent. Resultado en tiempo real. Sin registro, sin subir datos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/codificar-url',
  },
  'convertir-color': {
    title: 'Conversor de colores HEX RGB HSL online gratis | ToolsFoto',
    description: 'Convierte colores entre HEX, RGB, HSL y HSB al instante. Previsualización en tiempo real y copia con un clic. Herramienta gratuita para diseñadores y desarrolladores.',
    canonical: 'https://toolsfoto.com/convertir-color',
  },

  // ── Nuevas herramientas de vídeo ──────────────────────────────
  'cambiar-velocidad': {
    title: 'Cambiar velocidad de vídeo online gratis | ToolsFoto',
    description: 'Acelera o ralentiza tu vídeo de 0.25x a 2x con corrección de tono en el audio. Procesamiento 100% local con FFmpeg.wasm. Sin registro, sin subir archivos al servidor.',
    canonical: 'https://toolsfoto.com/cambiar-velocidad',
  },
  'anadir-audio-video': {
    title: 'Añadir audio a vídeo online gratis | ToolsFoto',
    description: 'Reemplaza o mezcla el audio de tu vídeo con otro archivo de audio. El vídeo no se re-codifica. Procesamiento 100% local con FFmpeg.wasm. Sin registro, completamente gratis.',
    canonical: 'https://toolsfoto.com/anadir-audio-video',
  },

  // ── Nuevas herramientas de audio ──────────────────────────────
  'velocidad-audio': {
    title: 'Cambiar velocidad de audio online gratis | ToolsFoto',
    description: 'Acelera o ralentiza el audio entre 0.5x y 2x conservando el tono original. Ideal para podcasts, audiolibros y estudio musical. FFmpeg.wasm, 100% local. Gratis.',
    canonical: 'https://toolsfoto.com/velocidad-audio',
  },
  'revertir-audio': {
    title: 'Revertir audio online gratis — efecto reverse | ToolsFoto',
    description: 'Invierte cualquier archivo de audio para reproducirlo de atrás hacia adelante. Efecto reverse para producción musical y audio creativo. FFmpeg.wasm, 100% local. Gratis.',
    canonical: 'https://toolsfoto.com/revertir-audio',
  },

  // ── Nuevas herramientas de vídeo (2ª tanda) ──────────────────
  'rotar-video': {
    title: 'Rotar vídeo online gratis — girar 90° 180° 270° | ToolsFoto',
    description: 'Gira tu vídeo grabado en orientación incorrecta: 90° a la derecha, 90° a la izquierda o 180°. El audio se preserva. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos.',
    canonical: 'https://toolsfoto.com/rotar-video',
  },
  'unir-videos': {
    title: 'Unir vídeos online gratis — fusionar clips en uno solo | ToolsFoto',
    description: 'Combina varios vídeos MP4, WebM o MOV en un único archivo. Reordena los clips antes de unirlos. Procesamiento 100% local con FFmpeg.wasm. Sin registro, sin límite de tamaño.',
    canonical: 'https://toolsfoto.com/unir-videos',
  },
  'silenciar-video': {
    title: 'Silenciar vídeo online gratis — eliminar audio de vídeo | ToolsFoto',
    description: 'Elimina el audio de cualquier vídeo con un solo clic. El vídeo se copia sin re-codificar para preservar la calidad original. FFmpeg.wasm, 100% local. Gratis, sin registro.',
    canonical: 'https://toolsfoto.com/silenciar-video',
  },
  'capturar-fotograma': {
    title: 'Extraer un fotograma exacto de un vídeo como imagen PNG | ToolsFoto',
    description: 'Saca el fotograma de un segundo exacto de tu vídeo como imagen PNG en alta calidad, ideal para capturas y screenshots. FFmpeg.wasm, 100% local. Sin registro, completamente gratis.',
    canonical: 'https://toolsfoto.com/capturar-fotograma',
  },

  // ── Nuevas herramientas developer (2ª tanda) ─────────────────
  'base64-texto': {
    title: 'Codificar texto en Base64 online gratis | ToolsFoto',
    description: 'Convierte texto a Base64 y decodifica Base64 a texto al instante. Soporta Unicode y emojis. Sin registro, sin instalar nada. Completamente gratis en el navegador.',
    canonical: 'https://toolsfoto.com/base64-texto',
  },
  'minificador-css': {
    title: 'Minificador CSS online gratis — comprimir CSS al instante | ToolsFoto',
    description: 'Minifica tu CSS eliminando espacios, comentarios y saltos de línea. Muestra el porcentaje de reducción. También formatea CSS minificado. Sin registro, 100% gratuito y en el navegador.',
    canonical: 'https://toolsfoto.com/minificador-css',
  },
  'csv-a-json': {
    title: 'Convertir CSV a JSON online gratis | ToolsFoto',
    description: 'Transforma datos CSV a JSON estructurado y viceversa. Primera fila como cabecera automática. Resultado formateado y descargable. Sin registro, sin subir archivos. 100% gratuito.',
    canonical: 'https://toolsfoto.com/csv-a-json',
  },
  'calcular-hash': {
    title: 'Calcular hash SHA-256 SHA-1 SHA-512 online gratis | ToolsFoto',
    description: 'Genera el hash criptográfico de texto o archivos con SHA-1, SHA-256, SHA-384 y SHA-512. Usa la Web Crypto API nativa. Sin registro, sin subir archivos al servidor. 100% gratuito.',
    canonical: 'https://toolsfoto.com/calcular-hash',
  },

  // ── Nueva herramienta imagen (2ª tanda) ───────────────────────
  'imagen-a-webp': {
    title: 'Convertir imagen a WebP online gratis — JPG PNG a WebP | ToolsFoto',
    description: 'Convierte tus imágenes JPG o PNG a formato WebP y reduce el tamaño hasta un 30% sin perder calidad. Elige la calidad de compresión. Sin registro, sin subir archivos. 100% gratis.',
    canonical: 'https://toolsfoto.com/imagen-a-webp',
  },

  // ── Nueva herramienta PDF (2ª tanda) ─────────────────────────
  'anadir-texto-pdf': {
    title: 'Añadir texto a PDF online gratis | ToolsFoto',
    description: 'Inserta texto personalizado en cualquier posición de tu PDF. Elige página, posición X/Y, tamaño de fuente y color. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/anadir-texto-pdf',
  },

  // ── 20 herramientas nuevas ────────────────────────────────────
  'ajustar-hsb': {
    title: 'Ajustar tono, saturación y brillo de imagen gratis | ToolsFoto',
    description: 'Ajusta el tono (hue), saturación, brillo y contraste de tus imágenes con sliders en tiempo real. Preview instantáneo, sin registro, sin subir archivos. 100% gratis en el navegador.',
    canonical: 'https://toolsfoto.com/ajustar-hsb',
  },
  'efecto-boceto': {
    title: 'Efecto boceto a lápiz online gratis | ToolsFoto',
    description: 'Convierte tus fotos en bocetos artísticos a lápiz con la técnica color dodge. Ajusta la suavidad del trazo. Sin registro, sin subir imágenes. 100% gratis en el navegador.',
    canonical: 'https://toolsfoto.com/efecto-boceto',
  },
  'cambiar-fondo': {
    title: 'Cambiar fondo de imagen PNG online gratis — e-commerce y diseño | ToolsFoto',
    description: 'Rellena el fondo de PNGs transparentes con cualquier color sólido: blanco para e-commerce (Amazon, Mercado Libre), color corporativo para presentaciones o el tono exacto de tu marca. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/cambiar-fondo',
  },
  mosaico: {
    title: 'Crear mosaico de imagen online gratis | ToolsFoto',
    description: 'Repite tu imagen en una cuadrícula de hasta 6×6 tiles. Perfecto para fondos, papeles de pared y diseño gráfico. Sin registro, sin subir imágenes al servidor. 100% gratis.',
    canonical: 'https://toolsfoto.com/mosaico',
  },
  'efecto-duotono': {
    title: 'Efecto duotono a imagen online gratis | ToolsFoto',
    description: 'Aplica efectos duotono profesionales de dos colores a tus imágenes. 5 presets populares y colores personalizados. Sin registro, sin subir archivos. 100% gratis en el navegador.',
    canonical: 'https://toolsfoto.com/efecto-duotono',
  },
  'eliminar-paginas-pdf': {
    title: 'Eliminar páginas de PDF online gratis | ToolsFoto',
    description: 'Borra páginas específicas o rangos de un PDF (ej: 1, 3, 5-7). Sin registro, sin subir archivos al servidor. Procesamiento 100% local. Completamente gratis.',
    canonical: 'https://toolsfoto.com/eliminar-paginas-pdf',
  },
  'anadir-imagen-pdf': {
    title: 'Añadir imagen a PDF online gratis | ToolsFoto',
    description: 'Inserta imágenes JPG o PNG en cualquier página de tu PDF con control de posición y tamaño. Perfecto para firmas y sellos. Sin registro, sin subir archivos al servidor. Gratis.',
    canonical: 'https://toolsfoto.com/anadir-imagen-pdf',
  },
  'pdf-en-blanco': {
    title: 'Crear PDF en blanco online gratis | ToolsFoto',
    description: 'Genera PDFs en blanco en A4, A3, Carta, Legal y A5. Elige la orientación y el número de páginas. Sin registro, sin instalación. Procesamiento 100% local. Completamente gratis.',
    canonical: 'https://toolsfoto.com/pdf-en-blanco',
  },
  'voltear-video': {
    title: 'Voltear vídeo online gratis — espejo horizontal y vertical | ToolsFoto',
    description: 'Voltea tu vídeo en espejo horizontal, vertical o en ambos ejes. El audio se preserva. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/voltear-video',
  },
  'recortar-area-video': {
    title: 'Recortar área de vídeo online gratis | ToolsFoto',
    description: 'Recorta un área específica de tu vídeo definiendo ancho, alto y posición en píxeles. El audio se preserva. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/recortar-area-video',
  },
  'cambiar-resolucion-video': {
    title: 'Cambiar resolución de vídeo online gratis — 1080p 720p 480p | ToolsFoto',
    description: 'Escala tu vídeo a 4K, 1080p, 720p, 480p, 360p o resolución personalizada. Mantiene la proporción. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/cambiar-resolucion-video',
  },
  'marca-agua-video': {
    title: 'Añadir marca de agua a vídeo online gratis | ToolsFoto',
    description: 'Incrusta texto como marca de agua permanente en tu vídeo. Posición, tamaño y opacidad ajustables. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Gratis.',
    canonical: 'https://toolsfoto.com/marca-agua-video',
  },
  'agregar-fade-audio': {
    title: 'Añadir fade in y fade out a audio online gratis | ToolsFoto',
    description: 'Aplica entrada y salida gradual (fade in/fade out) a cualquier audio. Duración configurable de forma independiente. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/agregar-fade-audio',
  },
  'mezclar-audios': {
    title: 'Mezclar dos audios online gratis | ToolsFoto',
    description: 'Combina dos pistas de audio en una sola con control de volumen independiente. Perfecto para música de fondo y locución. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/mezclar-audios',
  },
  'cambiar-tono': {
    title: 'Cambiar tono de audio online gratis — pitch shifter | ToolsFoto',
    description: 'Sube o baja el tono musical de tu audio en semitonos sin cambiar la velocidad. De -12 a +12 semitonos. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/cambiar-tono',
  },
  'regex-tester': {
    title: 'Tester de expresiones regulares (Regex) online gratis | ToolsFoto',
    description: 'Prueba tus expresiones regulares JavaScript con resaltado de coincidencias en tiempo real. Soporta flags g, i, m, s y grupos de captura. Sin registro, 100% en el navegador. Gratis.',
    canonical: 'https://toolsfoto.com/regex-tester',
  },
  'generador-uuid': {
    title: 'Generador de UUID v4 online gratis | ToolsFoto',
    description: 'Genera UUIDs v4 criptográficamente seguros al instante. Hasta 100 UUIDs de una vez, con opciones de formato. Web Crypto API. Sin registro, sin subir datos. 100% gratuito.',
    canonical: 'https://toolsfoto.com/generador-uuid',
  },
  'contador-palabras': {
    title: 'Contador de palabras online gratis | ToolsFoto',
    description: 'Cuenta palabras, caracteres, frases, párrafos y tiempo de lectura en tiempo real. Estadísticas instantáneas sin hacer clic. Sin registro, sin subir texto. 100% gratuito.',
    canonical: 'https://toolsfoto.com/contador-palabras',
  },
  'convertir-timestamp': {
    title: 'Convertir Unix timestamp a fecha online gratis | ToolsFoto',
    description: 'Convierte timestamps Unix a fechas legibles y viceversa. Detecta segundos o milisegundos automáticamente. Muestra local, UTC e ISO 8601. Sin registro, 100% gratuito.',
    canonical: 'https://toolsfoto.com/convertir-timestamp',
  },
  'minificador-html': {
    title: 'Minificador HTML online gratis — comprimir HTML al instante | ToolsFoto',
    description: 'Minifica HTML eliminando comentarios, espacios y saltos de línea. También formatea HTML comprimido. Muestra el porcentaje de reducción. Sin registro, 100% en el navegador. Gratis.',
    canonical: 'https://toolsfoto.com/minificador-html',
  },

  // ── 10 nuevas herramientas ────────────────────────────────────
  'generador-contrasenas': {
    title: 'Generador de contraseñas seguras online gratis | ToolsFoto',
    description: 'Genera contraseñas seguras con la Web Crypto API. Longitud, mayúsculas, minúsculas, números y símbolos configurables. Hasta 20 contraseñas a la vez. Sin registro, sin subir datos. 100% gratis.',
    canonical: 'https://toolsfoto.com/generador-contrasenas',
  },
  'lorem-ipsum': {
    title: 'Generador de Lorem Ipsum online gratis — párrafos y palabras | ToolsFoto',
    description: 'Genera texto Lorem Ipsum en párrafos, frases o palabras. Cantidad ajustable, descarga como .txt. Perfecto para maquetas y prototipos. Sin registro, sin subir datos. 100% gratis en el navegador.',
    canonical: 'https://toolsfoto.com/lorem-ipsum',
  },
  'gradiente-css': {
    title: 'Generador de gradientes CSS online gratis | ToolsFoto',
    description: 'Crea gradientes CSS lineales y radiales con preview en tiempo real. Hasta 5 colores, control de ángulo y posición. Copia el código CSS listo para usar. Sin registro, sin subir datos. 100% gratis.',
    canonical: 'https://toolsfoto.com/gradiente-css',
  },
  'minificador-js': {
    title: 'Minificador JavaScript online gratis — comprimir JS al instante | ToolsFoto',
    description: 'Minifica JavaScript eliminando comentarios y espacios. También formatea código comprimido. Muestra el porcentaje de reducción. Sin registro, 100% en el navegador. Completamente gratis.',
    canonical: 'https://toolsfoto.com/minificador-js',
  },
  'anadir-silencio': {
    title: 'Añadir silencio a audio online gratis | ToolsFoto',
    description: 'Añade segundos de silencio al inicio y/o al final de cualquier archivo de audio. Configurable hasta 10 segundos en cada extremo. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/anadir-silencio',
  },
  'convertir-a-mono': {
    title: 'Convertir audio estéreo a mono online gratis | ToolsFoto',
    description: 'Mezcla los canales estéreo de cualquier audio en uno solo (mono). Reduce el tamaño del archivo a la mitad. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/convertir-a-mono',
  },
  'comprimir-objetivo': {
    title: 'Comprimir imagen a tamaño máximo en KB online gratis | ToolsFoto',
    description: 'Comprime tu imagen hasta un tamaño exacto en KB: 100 KB, 200 KB, 500 KB o el que necesites. Ideal para formularios, portales de empleo y trámites online con límite de peso. Búsqueda binaria automática. 100% gratis en el navegador.',
    canonical: 'https://toolsfoto.com/comprimir-objetivo',
  },
  'fondo-degradado': {
    title: 'Añadir fondo degradado a imagen online gratis | ToolsFoto',
    description: 'Añade un fondo con degradado lineal o radial a tu imagen o PNG transparente. 5 presets y colores personalizables. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/fondo-degradado',
  },
  // ── Nuevas 20 herramientas ────────────────────────────────────
  nitidez: {
    title: 'Aumentar nitidez de imagen online gratis — unsharp mask | ToolsFoto',
    description: 'Enfoca y aumenta la nitidez de tus imágenes con el algoritmo unsharp mask. Intensidad ajustable con slider. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/nitidez',
  },
  'ajustar-niveles': {
    title: 'Ajustar niveles de imagen online gratis — punto negro, blanco y gamma | ToolsFoto',
    description: 'Corrige la exposición con precisión: ajusta punto negro, punto blanco y gamma para fotos oscuras, sobreexpuestas o con bajo contraste. Ideal para fotos escaneadas y fotografía de producto. Canvas API, 100% gratis en el navegador.',
    canonical: 'https://toolsfoto.com/ajustar-niveles',
  },
  'efecto-oleo': {
    title: 'Efecto pintura al óleo en imagen online gratis | ToolsFoto',
    description: 'Transforma tus fotos en pinturas al óleo artísticas. Radio de pincel ajustable. Canvas API con análisis de vecindades de píxeles, 100% en el navegador. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/efecto-oleo',
  },
  'desvanecer-bordes': {
    title: 'Desvanecer bordes de imagen online gratis — viñeta y fade edges | ToolsFoto',
    description: 'Aplica desvanecimiento gradual en los bordes de tu imagen: modo elipse para viñeta fotográfica o modo rectangular para fundir con el fondo. Exporta como PNG transparente. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/desvanecer-bordes',
  },
  'intercalar-pdfs': {
    title: 'Intercalar páginas de dos PDFs online gratis | ToolsFoto',
    description: 'Combina dos PDFs alternando sus páginas (A1, B1, A2, B2…). Ideal para escaneos de anverso y reverso. pdf-lib, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/intercalar-pdfs',
  },
  'escalar-pdf': {
    title: 'Escalar PDF a A4, Carta o tamaño estándar online gratis | ToolsFoto',
    description: 'Redimensiona todas las páginas de tu PDF a un tamaño estándar (A4, A3, Carta, Legal) manteniendo las proporciones. pdf-lib, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/escalar-pdf',
  },
  'encabezado-pie-pdf': {
    title: 'Añadir encabezado y pie de página a PDF online gratis | ToolsFoto',
    description: 'Inserta texto personalizado en la cabecera y el pie de cada página de tu PDF. Tamaño de fuente y márgenes configurables. pdf-lib, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/encabezado-pie-pdf',
  },
  'duplicar-paginas-pdf': {
    title: 'Duplicar páginas de PDF online gratis | ToolsFoto',
    description: 'Duplica páginas específicas de tu PDF el número de veces que necesites. Las copias se insertan tras la página original. pdf-lib, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/duplicar-paginas-pdf',
  },
  'bucle-video': {
    title: 'Bucle de vídeo online gratis — repetir vídeo N veces | ToolsFoto',
    description: 'Crea un vídeo en bucle repitiendo tu clip el número de veces que quieras en un único MP4. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/bucle-video',
  },
  'audio-a-video': {
    title: 'Convertir audio a vídeo online gratis — audio a MP4 | ToolsFoto',
    description: 'Convierte cualquier audio en vídeo MP4 con imagen de fondo o color sólido. Perfecto para subir podcasts y música a YouTube. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/audio-a-video',
  },
  'revertir-video': {
    title: 'Revertir vídeo online gratis — reproducir vídeo al revés | ToolsFoto',
    description: 'Invierte el orden de los fotogramas de tu vídeo para reproducirlo al revés. El audio también se invierte. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/revertir-video',
  },
  'reducir-fps': {
    title: 'Reducir FPS de vídeo online gratis — cambiar fotogramas por segundo | ToolsFoto',
    description: 'Reduce los fotogramas por segundo de tu vídeo para disminuir el tamaño. Presets: 60, 30, 25, 24, 15 FPS. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/reducir-fps',
  },
  'eco-audio': {
    title: 'Añadir eco a audio online gratis — efecto echo y reverb | ToolsFoto',
    description: 'Aplica efecto de eco configurable a tu audio. Controla el retardo y decaimiento. FFmpeg aecho, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/eco-audio',
  },
  'convertir-a-estereo': {
    title: 'Convertir audio mono a estéreo online gratis | ToolsFoto',
    description: 'Convierte cualquier audio mono en estéreo duplicando el canal. Compatible con MP3, WAV, OGG, AAC y FLAC. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/convertir-a-estereo',
  },
  'eliminar-silencio': {
    title: 'Eliminar silencios de audio online gratis — silence removal | ToolsFoto',
    description: 'Recorta automáticamente los silencios de tu audio. Configura el umbral en dB y la duración mínima. FFmpeg silenceremove, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/eliminar-silencio',
  },
  'normalizar-audio': {
    title: 'Normalizar audio online gratis — EBU R128 loudnorm | ToolsFoto',
    description: 'Normaliza el volumen de tu audio al estándar EBU R128. Presets: streaming (-14 LUFS), podcast (-16 LUFS), broadcast (-23 LUFS). FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/normalizar-audio',
  },
  'formateador-sql': {
    title: 'Formateador SQL online gratis — formatear y minificar SQL | ToolsFoto',
    description: 'Formatea consultas SQL con indentación automática y palabras clave en mayúsculas. También minifica SQL a una línea. Sin dependencias externas. Sin registro, sin subir datos. 100% gratuito.',
    canonical: 'https://toolsfoto.com/formateador-sql',
  },
  'jwt-decoder': {
    title: 'Decodificador JWT online gratis — leer tokens JSON Web Token | ToolsFoto',
    description: 'Decodifica y visualiza el header y payload de cualquier token JWT. Decodificación base64url con soporte Unicode. Sin necesidad de clave privada. Sin registro, sin subir datos. 100% gratuito.',
    canonical: 'https://toolsfoto.com/jwt-decoder',
  },
  'esquema-colores': {
    title: 'Generador de esquemas de colores online gratis — paletas armoniosas | ToolsFoto',
    description: 'Genera esquemas de colores complementario, análogo, triádico, split-complementario y tetrádico desde un color base. Códigos HEX, RGB y HSL. Sin registro, sin subir datos. 100% gratuito.',
    canonical: 'https://toolsfoto.com/esquema-colores',
  },
  'comparar-texto': {
    title: 'Comparar texto online gratis — diff de texto línea a línea | ToolsFoto',
    description: 'Compara dos textos línea a línea y resalta las diferencias con colores. Algoritmo LCS. Muestra líneas añadidas, eliminadas e iguales. Sin registro, sin subir datos. 100% gratuito en el navegador.',
    canonical: 'https://toolsfoto.com/comparar-texto',
  },

  // ── 20 herramientas nuevas (2ª tanda) ────────────────────────
  ruido: {
    title: 'Añadir efecto ruido a imagen online gratis — film grain | ToolsFoto',
    description: 'Aplica ruido aleatorio y efecto de grano fotográfico a tus imágenes. Intensidad y modo monocromático configurables. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/ruido',
  },
  posterizar: {
    title: 'Posterizar imagen online gratis — efecto póster artístico | ToolsFoto',
    description: 'Reduce los niveles de color de tu imagen con efecto posterización. De 2 a 8 niveles ajustables. Canvas API, 100% en el navegador. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/posterizar',
  },
  vigneta: {
    title: 'Añadir viñeta a imagen online gratis — vignette effect | ToolsFoto',
    description: 'Aplica efecto de viñeteado en los bordes de tu imagen. Intensidad y color ajustables. Canvas API, 100% en el navegador. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/vigneta',
  },
  solarizar: {
    title: 'Solarizar imagen online gratis — efecto Sabattier | ToolsFoto',
    description: 'Aplica el efecto de solarización fotográfica (Sabattier) a tu imagen. Umbral ajustable con 3 presets. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/solarizar',
  },
  'insertar-pagina-pdf': {
    title: 'Insertar páginas en blanco en PDF online gratis | ToolsFoto',
    description: 'Añade una o varias páginas en blanco dentro de tu PDF en la posición que elijas. pdf-lib, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/insertar-pagina-pdf',
  },
  'fondo-color-pdf': {
    title: 'Añadir fondo de color a PDF online gratis | ToolsFoto',
    description: 'Aplica un color de fondo sólido a todas las páginas de tu PDF conservando el contenido original. pdf-lib embedPage, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/fondo-color-pdf',
  },
  'aplanar-pdf': {
    title: 'Aplanar formulario PDF online gratis — flatten PDF form | ToolsFoto',
    description: 'Convierte los campos interactivos de formularios PDF en texto estático no editable. pdf-lib form.flatten(), 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/aplanar-pdf',
  },
  'convertir-vertical': {
    title: 'Convertir vídeo a vertical 9:16 online gratis — Reels TikTok | ToolsFoto',
    description: 'Convierte vídeos horizontales al formato vertical 9:16 o cuadrado 1:1 para Instagram Reels, TikTok y YouTube Shorts. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/convertir-vertical',
  },
  'boomerang-video': {
    title: 'Efecto boomerang de vídeo online gratis | ToolsFoto',
    description: 'Crea el clásico efecto boomerang: el vídeo avanza y retrocede en un bucle continuo. Configura el número de ciclos. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/boomerang-video',
  },
  'ajustar-volumen-video': {
    title: 'Ajustar volumen de vídeo online gratis | ToolsFoto',
    description: 'Sube o baja el volumen del audio de un vídeo en dB sin re-codificar el stream de vídeo. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/ajustar-volumen-video',
  },
  'ecualizador-audio': {
    title: 'Ecualizador de audio online gratis — EQ 3 bandas | ToolsFoto',
    description: 'Ajusta graves, medios y agudos de tu audio con un ecualizador de 3 bandas. Presets Rock, Pop, Voz y Clásica. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/ecualizador-audio',
  },
  'reducir-ruido-audio': {
    title: 'Reducir ruido de audio online gratis — noise reduction | ToolsFoto',
    description: 'Elimina el ruido de fondo de tus grabaciones con el filtro anlmdn de FFmpeg. Tres niveles de reducción. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/reducir-ruido-audio',
  },
  'generar-tono': {
    title: 'Generador de tonos de audio online gratis — sine square triangle | ToolsFoto',
    description: 'Genera tonos de audio puro (sinusoidal, cuadrado, triangular, diente de sierra) con frecuencia y duración configurables. FFmpeg.wasm lavfi, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/generar-tono',
  },
  'conversor-base': {
    title: 'Conversor de bases numéricas online gratis — decimal binario hex | ToolsFoto',
    description: 'Convierte números entre decimal, binario, hexadecimal y octal al instante. El binario se agrupa en nibbles. Sin registro, sin instalar nada. 100% gratuito en el navegador.',
    canonical: 'https://toolsfoto.com/conversor-base',
  },
  'entidades-html': {
    title: 'Codificar y decodificar entidades HTML online gratis | ToolsFoto',
    description: 'Convierte texto plano a entidades HTML y viceversa. Tabla de las 23 entidades más frecuentes. Sin registro, sin instalar nada. 100% gratuito en el navegador.',
    canonical: 'https://toolsfoto.com/entidades-html',
  },

  'metadatos-pdf': {
    title: 'Ver y editar metadatos de PDF online gratis | ToolsFoto',
    description: 'Lee y modifica el título, autor, asunto y palabras clave de cualquier PDF. Guarda el PDF con los nuevos metadatos. pdf-lib, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/metadatos-pdf',
  },

  // ── 20 herramientas nuevas (3ª tanda) ─────────────────────────
  'comparar-imagenes': {
    title: 'Comparar imágenes online gratis — slider antes/después | ToolsFoto',
    description: 'Compara dos imágenes con un slider interactivo de antes/después: evalúa compresión, retoques, edición de color o cambios de diseño. Arrastra la línea para revelar cada zona. 100% en el navegador. Sin registro, gratis.',
    canonical: 'https://toolsfoto.com/comparar-imagenes',
  },
  placeholder: {
    title: 'Generador de imágenes placeholder online gratis | ToolsFoto',
    description: 'Crea imágenes placeholder con el tamaño, color y texto que necesites. Presets 16:9, 1:1, 4:3, OG y Banner. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/placeholder',
  },
  'efecto-glitch': {
    title: 'Efecto glitch en imagen online gratis — RGB shift | ToolsFoto',
    description: 'Aplica un efecto glitch artístico con desplazamiento de canales RGB y cortes aleatorios. Genera variaciones únicas. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/efecto-glitch',
  },
  'tilt-shift': {
    title: 'Efecto tilt-shift online gratis — miniatura fotográfica | ToolsFoto',
    description: 'Simula el efecto tilt-shift de maqueta miniatura con desenfoque gaussiano fuera de la banda de enfoque. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/tilt-shift',
  },
  'imagen-a-ico': {
    title: 'Convertir imagen a ICO online gratis — favicon .ico | ToolsFoto',
    description: 'Convierte cualquier imagen a formato .ico con múltiples tamaños (16, 32, 48, 64, 128, 256 px). ICO moderno con PNG embebido. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/imagen-a-ico',
  },
  'sellar-pdf': {
    title: 'Sellar PDF online gratis — añadir sello de texto | ToolsFoto',
    description: 'Estampa un sello de texto diagonal (BORRADOR, CONFIDENCIAL, APROBADO…) en todas las páginas de tu PDF. Color y opacidad ajustables. pdf-lib, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/sellar-pdf',
  },
  'pdf-a-svg': {
    title: 'Convertir PDF a SVG online gratis | ToolsFoto',
    description: 'Convierte cada página de tu PDF a un archivo SVG. Descarga páginas individuales o todas en un ZIP. pdfjs-dist, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/pdf-a-svg',
  },
  'comparar-pdfs': {
    title: 'Comparar dos PDFs online gratis — vista en paralelo | ToolsFoto',
    description: 'Compara dos PDFs página a página en una vista sincronizada. Navegación paralela y escala ajustable. pdfjs-dist, 100% en el navegador. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/comparar-pdfs',
  },
  'indice-pdf': {
    title: 'Extraer índice de PDF online gratis — tabla de contenidos | ToolsFoto',
    description: 'Obtén el índice o tabla de contenidos de cualquier PDF con sus números de página. Usa los marcadores integrados o detecta encabezados automáticamente. pdfjs-dist, 100% local. Sin registro. Gratis.',
    canonical: 'https://toolsfoto.com/indice-pdf',
  },
  'anadir-subtitulos': {
    title: 'Añadir subtítulos a vídeo online gratis — incrustar SRT | ToolsFoto',
    description: 'Incrusta subtítulos de un archivo .SRT en tu vídeo permanentemente. Los subtítulos se renderizan en canvas y se superponen con FFmpeg.wasm. 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/anadir-subtitulos',
  },
  'extraer-fotogramas': {
    title: 'Extraer fotogramas de vídeo online gratis — frames a ZIP | ToolsFoto',
    description: 'Exporta fotogramas de tu vídeo en JPG o PNG a la tasa de FPS elegida. Se descargan en un archivo ZIP. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/extraer-fotogramas',
  },
  'ajuste-color-video': {
    title: 'Ajuste de color de vídeo online gratis — brillo contraste saturación | ToolsFoto',
    description: 'Ajusta brillo, contraste, saturación y gamma de tu vídeo con presets Vivid, Cine, Vintage y B&N. FFmpeg.wasm eq filter, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/ajuste-color-video',
  },
  'miniatura-video': {
    title: 'Sacar la miniatura o portada de un vídeo online gratis | ToolsFoto',
    description: 'Crea la miniatura o portada de cualquier vídeo al instante en PNG o JPG con un slider de tiempo. Rápido, sin FFmpeg ni subir archivos. Sin registro, completamente gratis.',
    canonical: 'https://toolsfoto.com/miniatura-video',
  },
  'fundido-video': {
    title: 'Fundido a negro en vídeo online gratis — fade in fade out | ToolsFoto',
    description: 'Añade transiciones de fundido a negro (fade in y fade out) al inicio y final de tu vídeo. Configura la duración de cada efecto. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/fundido-video',
  },
  'escala-grises-video': {
    title: 'Vídeo en escala de grises online gratis — sepia y negativo | ToolsFoto',
    description: 'Convierte tu vídeo a escala de grises, sepia o negativo. Efectos de color clásicos aplicados con FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/escala-grises-video',
  },
  'fotogramas-a-video': {
    title: 'Fotos a vídeo online gratis — crear slideshow MP4 | ToolsFoto',
    description: 'Convierte tus fotos en un vídeo slideshow MP4. Configura la duración por imagen, la resolución y el orden. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/fotogramas-a-video',
  },
  'gif-a-video': {
    title: 'GIF a MP4 online gratis — convertir GIF animado a vídeo | ToolsFoto',
    description: 'Convierte GIFs animados a vídeo MP4 hasta 10 veces más ligero. H.264, compatible con todas las plataformas. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/gif-a-video',
  },
  'denoise-video': {
    title: 'Reducir ruido de vídeo online gratis — eliminar grano digital | ToolsFoto',
    description: 'Elimina el grano y ruido digital de tus vídeos con 3 niveles de intensidad. Filtro hqdn3d de FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/denoise-video',
  },
  'detector-bpm': {
    title: 'Detector de BPM online gratis — calcular tempo de audio | ToolsFoto',
    description: 'Detecta automáticamente los BPM (beats per minute) de tu música o audio. Análisis de energía con Web Audio API, sin IA ni servidores. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/detector-bpm',
  },
  'separar-voz': {
    title: 'Separar voz de música online gratis — vocal remover | ToolsFoto',
    description: 'Extrae la voz y el instrumental de cualquier audio estéreo con el algoritmo de cancelación de canal central. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/separar-voz',
  },
  'transcribir-audio': {
    title: 'Transcribir audio a texto online gratis — voz a texto | ToolsFoto',
    description: 'Convierte voz a texto en tiempo real con la Web Speech API. Soporta español, inglés, francés, alemán, italiano, portugués y catalán. Sin registro, sin subir archivos. 100% gratuito en el navegador.',
    canonical: 'https://toolsfoto.com/transcribir-audio',
  },
  'afinar-audio': {
    title: 'Afinar audio y voz online gratis — corrige la afinación | ToolsFoto',
    description: 'Corrige la afinación de voz e instrumentos desafinados ajustando el tono en semitonos sin cambiar la velocidad, con vibrato opcional. FFmpeg.wasm, 100% local. Sin registro, gratis.',
    canonical: 'https://toolsfoto.com/afinar-audio',
  },
  'minificador-svg': {
    title: 'Minificador SVG online gratis — comprimir SVG | ToolsFoto',
    description: 'Reduce el tamaño de tus SVGs eliminando metadatos, comentarios y atributos de Inkscape/Sodipodi. Pega código o sube un archivo. Sin dependencias. Sin registro, sin subir archivos. 100% gratuito.',
    canonical: 'https://toolsfoto.com/minificador-svg',
  },
  'og-image': {
    title: 'Generador de imágenes Open Graph online gratis — OG Image 1200×630 | ToolsFoto',
    description: 'Crea imágenes Open Graph 1200×630 px para redes sociales con título, subtítulo, colores y logo opcional. Canvas API, 100% en el navegador. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/og-image',
  },
  'convertir-fuente': {
    title: 'Convertir fuentes TTF OTF WOFF online gratis | ToolsFoto',
    description: 'Convierte fuentes tipográficas entre TTF, OTF y WOFF directamente en el navegador. Conversión sin pérdida: todas las tablas SFNT se preservan. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/convertir-fuente',
  },

  // ── 19 herramientas nuevas de audio ───────────────────────────
  'visualizar-forma-onda': {
    title: 'Visualizar forma de onda de audio online gratis — waveform PNG | ToolsFoto',
    description: 'Genera una imagen PNG de la forma de onda de tu audio. Personaliza colores. Web Audio API + Canvas, 100% en el navegador. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/visualizar-forma-onda',
  },
  'convertir-a-m4a': {
    title: 'Convertir audio a M4A online gratis — audio AAC para iPhone | ToolsFoto',
    description: 'Convierte cualquier audio a M4A (AAC) con calidad 128k, 192k o 320k. Compatible con iPhone e iTunes. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/convertir-a-m4a',
  },
  'robotizar-voz': {
    title: 'Robotizar voz online gratis — efecto voz robótica | ToolsFoto',
    description: 'Aplica efecto de voz robótica, metálica o alienígena a cualquier audio con 4 presets. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/robotizar-voz',
  },
  'dividir-audio': {
    title: 'Dividir audio en dos partes online gratis | ToolsFoto',
    description: 'Divide cualquier audio en dos partes en el punto de tiempo exacto que elijas. Descarga ambas partes. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/dividir-audio',
  },
  'audio-a-fragmentos': {
    title: 'Dividir audio en fragmentos iguales online gratis | ToolsFoto',
    description: 'Divide un audio en 2 a 10 fragmentos de igual duración automáticamente. Descarga cada fragmento por separado. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/audio-a-fragmentos',
  },
  'recortar-silencio-inicio': {
    title: 'Recortar silencio del inicio y final de audio online gratis | ToolsFoto',
    description: 'Elimina los silencios del principio y el final de tu audio, manteniendo el interior intacto. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/recortar-silencio-inicio',
  },
  'insertar-audio': {
    title: 'Insertar audio dentro de otro audio online gratis | ToolsFoto',
    description: 'Inserta un audio secundario en el interior de otro en el tiempo exacto que elijas. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/insertar-audio',
  },
  'reemplazar-segmento': {
    title: 'Reemplazar segmento de audio con silencio online gratis | ToolsFoto',
    description: 'Silencia un intervalo de tiempo de tu audio manteniendo la duración total. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/reemplazar-segmento',
  },
  'audio-a-base64': {
    title: 'Convertir audio a Base64 online gratis — audio a data URI | ToolsFoto',
    description: 'Codifica cualquier archivo de audio en Base64 o data URI. También decodifica Base64 a archivo. Sin servidores, 100% en el navegador. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/audio-a-base64',
  },
  'convertir-a-flac': {
    title: 'Convertir audio a FLAC online gratis — formato lossless | ToolsFoto',
    description: 'Convierte cualquier audio a FLAC sin pérdida. Ideal para archivos máster y alta fidelidad. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/convertir-a-flac',
  },
  'analizar-espectro': {
    title: 'Analizar espectro de audio online gratis — frecuencias PNG | ToolsFoto',
    description: 'Visualiza el espectro de frecuencias de tu audio como gráfica de barras descargable en PNG. Web Audio API + Canvas, 100% en el navegador. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/analizar-espectro',
  },
  'detectar-tono': {
    title: 'Detectar tono y nota musical de audio online gratis | ToolsFoto',
    description: 'Detecta la nota musical dominante y su frecuencia en Hz de cualquier audio. Algoritmo de autocorrelación. Web Audio API, 100% en el navegador. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/detectar-tono',
  },
  'medir-duracion': {
    title: 'Medir duración y metadata de audio online gratis | ToolsFoto',
    description: 'Obtén la duración, sample rate, canales y bitrate de cualquier archivo de audio. Web Audio API, 100% en el navegador. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/medir-duracion',
  },
  'cambiar-pitch-sin-tempo': {
    title: 'Cambiar pitch sin cambiar tempo online gratis — cents precisos | ToolsFoto',
    description: 'Ajusta el tono de tu audio en centésimas de semitono (±1200 cents) sin cambiar la velocidad. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/cambiar-pitch-sin-tempo',
  },
  'compresor-audio': {
    title: 'Compresor de audio online gratis — compresión dinámica | ToolsFoto',
    description: 'Aplica compresión dinámica con control de umbral, ratio, ataque y release. Presets Suave, Podcast, Máster y Heavy. FFmpeg acompressor, 100% local. Sin registro, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/compresor-audio',
  },
  'distorsion-audio': {
    title: 'Distorsión de audio online gratis — overdrive y bitcrush | ToolsFoto',
    description: 'Aplica distorsión, overdrive o bitcrush a tu audio con 4 presets. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/distorsion-audio',
  },
  'coro-audio': {
    title: 'Efecto coro de audio online gratis — chorus effect | ToolsFoto',
    description: 'Aplica efecto de coro (chorus) para dar profundidad y amplitud a voces e instrumentos con 3 presets. FFmpeg achorus, 100% local. Sin registro, sin subir archivos. Completamente gratis.',
    canonical: 'https://toolsfoto.com/coro-audio',
  },
  'telefono-audio': {
    title: 'Efecto teléfono en audio online gratis — telephone sound | ToolsFoto',
    description: 'Simula el sonido de teléfono, radio AM o intercomunicador con filtros de banda estrecha. FFmpeg.wasm, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/telefono-audio',
  },
  'generar-ruido-blanco': {
    title: 'Generador de ruido blanco online gratis — white pink brown noise | ToolsFoto',
    description: 'Genera ruido blanco, rosa o marrón de cualquier duración para masking, pruebas y sleep sounds. FFmpeg lavfi, 100% local. Sin registro, sin subir archivos al servidor. Completamente gratis.',
    canonical: 'https://toolsfoto.com/generar-ruido-blanco',
  },

  // ── 5 herramientas nuevas (1 por categoría) ──────────────────
  'heic-a-jpg': {
    title: 'Convertir HEIC a JPG online gratis — fotos de iPhone | ToolsFoto',
    description: 'Convierte fotos HEIC y HEIF de iPhone a JPG o PNG compatibles con cualquier dispositivo. Elige la calidad. 100% en tu navegador, sin subir tus fotos. Gratis y sin registro.',
    canonical: 'https://toolsfoto.com/heic-a-jpg',
  },
  'pdf-escala-grises': {
    title: 'Convertir PDF a escala de grises (blanco y negro) gratis | ToolsFoto',
    description: 'Convierte un PDF a escala de grises para imprimir ahorrando tinta o unificar documentos. Procesamiento 100% local con pdf.js y pdf-lib. Sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/pdf-escala-grises',
  },
  'comprimir-gif': {
    title: 'Comprimir GIF online gratis — reducir el tamaño de un GIF | ToolsFoto',
    description: 'Reduce el peso de tus GIF animados ajustando ancho, FPS y colores con paleta optimizada de FFmpeg. Mantiene la animación. 100% en el navegador, sin subir archivos. Gratis.',
    canonical: 'https://toolsfoto.com/comprimir-gif',
  },
  'grabar-audio': {
    title: 'Grabar audio y voz online gratis — grabadora de voz | ToolsFoto',
    description: 'Graba voz o sonido desde el micrófono en el navegador y descárgalo en WebM o MP3. Sin instalar apps y sin que tu voz salga de tu dispositivo. Gratis y sin registro.',
    canonical: 'https://toolsfoto.com/grabar-audio',
  },
  'formatear-xml': {
    title: 'Formatear y minificar XML online gratis | ToolsFoto',
    description: 'Formatea XML con indentación jerárquica o minifícalo a una sola línea, con validación de sintaxis. Sin subir datos, 100% en el navegador. Ideal para SOAP, sitemaps y RSS. Gratis.',
    canonical: 'https://toolsfoto.com/formatear-xml',
  },

  // ── Páginas de categoría ──────────────────────────────────────
  imagen: {
    title: 'Herramientas de imagen online gratis — JPG, PNG, WebP | ToolsFoto',
    description: 'Comprime, redimensiona, recorta, convierte y edita imágenes online gratis. 48 herramientas: JPG, PNG, WebP, AVIF. Elimina fondos con IA. Sin registro, todo en tu navegador.',
    canonical: 'https://toolsfoto.com/imagen',
  },
  pdf: {
    title: 'Herramientas de PDF online gratis — comprimir, unir, firmar | ToolsFoto',
    description: 'Comprime, une, divide, convierte, firma y protege PDFs online gratis. 32 herramientas de PDF. Sin registro, sin subir archivos al servidor, todo en tu navegador.',
    canonical: 'https://toolsfoto.com/pdf',
  },
  video: {
    title: 'Herramientas de vídeo online gratis — MP4, WebM, GIF | ToolsFoto',
    description: 'Comprime, convierte, recorta, rota y edita vídeos online gratis. 31 herramientas de vídeo: MP4, WebM, GIF. Sin registro, todo se procesa en tu navegador.',
    canonical: 'https://toolsfoto.com/video',
  },
  audio: {
    title: 'Herramientas de audio online gratis — MP3, WAV, OGG | ToolsFoto',
    description: 'Comprime, convierte, corta, mezcla, normaliza y edita audio online gratis. 42 herramientas: MP3, WAV, OGG, AAC, FLAC. Sin registro, todo en tu navegador.',
    canonical: 'https://toolsfoto.com/audio',
  },
  developer: {
    title: 'Herramientas para developers online gratis — JSON, QR, Base64 | ToolsFoto',
    description: 'Formatea JSON, genera QR, convierte colores, codifica URLs, calcula hashes y más. 31 herramientas para developers. Sin registro, todo en tu navegador.',
    canonical: 'https://toolsfoto.com/developer',
  },
};
