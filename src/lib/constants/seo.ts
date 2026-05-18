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
    title: 'ToolsFoto — Herramientas de imágenes online gratis',
    description: 'Comprime, redimensiona, recorta, convierte y edita imágenes online sin registro. 11 herramientas gratis. Tus imágenes nunca salen de tu dispositivo.',
    canonical: 'https://toolsfoto.com/',
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
    title: 'Extraer paleta de colores de imagen online gratis | ToolsFoto',
    description: 'Detecta los colores dominantes de cualquier imagen. Obtén códigos hexadecimales y descarga la paleta. Herramienta gratuita para diseñadores.',
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
    title: 'Extraer colores de imagen (hex, RGB, HSL) gratis | ToolsFoto',
    description: 'Analiza cualquier imagen y obtén sus colores dominantes con hex, RGB y HSL. Copia los valores con un clic. Ideal para diseñadores y desarrolladores front-end.',
    canonical: 'https://toolsfoto.com/colores-imagen',
  },
  'eliminar-exif': {
    title: 'Eliminar metadatos EXIF de imágenes gratis | ToolsFoto',
    description: 'Borra GPS, modelo de cámara, fecha y todos los metadatos EXIF de tus fotos antes de publicarlas. Procesamiento 100% local, sin subir imágenes al servidor.',
    canonical: 'https://toolsfoto.com/eliminar-exif',
  },
  'imagen-a-base64': {
    title: 'Convertir imagen a Base64 online gratis | ToolsFoto',
    description: 'Codifica cualquier imagen en Base64 para incrustarla en HTML, CSS o JSON. Copia la cadena con un clic y ve ejemplos de uso listos. Sin registro.',
    canonical: 'https://toolsfoto.com/imagen-a-base64',
  },
  'generar-favicon': {
    title: 'Generar favicon online gratis | ToolsFoto',
    description: 'Genera los tamaños estándar de favicon (16×16, 32×32, 48×48, 180×180) desde cualquier imagen. Descarga los PNG y copia las etiquetas HTML para tu web.',
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
    title: 'Capturar fotograma de vídeo online gratis | ToolsFoto',
    description: 'Extrae cualquier fotograma de un vídeo como imagen PNG. Elige el segundo exacto y descarga la captura en alta calidad. FFmpeg.wasm, 100% local. Sin registro, completamente gratis.',
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
};
