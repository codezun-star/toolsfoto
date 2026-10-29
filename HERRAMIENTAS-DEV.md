> Parte de la documentación de ToolsFoto.
> Ver índice general en [HERRAMIENTAS.md](HERRAMIENTAS.md)

## Developer (52)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/svg-a-png` | `SvgAPngTool.tsx` | Básicas | Canvas API + `new Image()` con blob URL SVG |
| `/colores-imagen` | `ColoresImagenTool.tsx` | Básicas | Canvas 200×200 sampleo + cuantización 4-bit |
| `/eliminar-exif` | `EliminarExifTool.tsx` | Básicas | Canvas API re-export (strips all metadata) |
| `/imagen-a-base64` | `ImagenABase64Tool.tsx` | Básicas | `FileReader.readAsArrayBuffer` + `btoa` |
| `/generar-favicon` | `GenerarFaviconTool.tsx` | Básicas | Canvas múltiples tamaños + HTML tags generator |
| `/generar-qr` | `GenerarQRTool.tsx` | Básicas | `qrcode` (import dinámico) — `QRCode.toCanvas()` |
| `/formatear-json` | `FormatearJSONTool.tsx` | Básicas | `JSON.parse/stringify` nativo |
| `/codificar-url` | `CodificarURLTool.tsx` | Básicas | `encodeURIComponent/decodeURIComponent` |
| `/convertir-color` | `ConvertirColorTool.tsx` | Básicas | Conversión pura HEX↔RGB↔HSL↔HSB |
| `/base64-texto` | `Base64TextoTool.tsx` | Básicas | `btoa/atob` con TextEncoder para Unicode |
| `/minificador-css` | `MinificadorCSSTool.tsx` | Básicas | Minificación y formateo CSS puro en JS |
| `/csv-a-json` | `CsvAJsonTool.tsx` | Básicas | Parser CSV propio con soporte de comillas |
| `/calcular-hash` | `CalcularHashTool.tsx` | Básicas | Web Crypto API — SHA-1/256/384/512 |
| `/regex-tester` | `RegexTesterTool.tsx` | Básicas | `RegExp` nativo JS — resaltado de coincidencias |
| `/generador-uuid` | `GeneradorUUIDTool.tsx` | Básicas | `crypto.randomUUID()` — UUID v4 |
| `/contador-palabras` | `ContadorPalabrasTool.tsx` | Básicas | JS puro — palabras, chars, frases, párrafos |
| `/convertir-timestamp` | `ConvertirTimestampTool.tsx` | Básicas | `Date` nativo — Unix↔fecha local/UTC/ISO 8601 |
| `/minificador-html` | `MinificadorHTMLTool.tsx` | Básicas | JS puro regex — elimina comments y whitespace |
| `/generador-contrasenas` | `GeneradorContrasenasTool.tsx` | Básicas | `crypto.getRandomValues(Uint32Array)` |
| `/lorem-ipsum` | `LoremIpsumTool.tsx` | Básicas | JS puro — párrafos/frases/palabras, corpus latino |
| `/gradiente-css` | `GradienteCssTool.tsx` | Básicas | CSS gradient builder — lineal/radial, hasta 5 stops |
| `/minificador-js` | `MinificadorJSTool.tsx` | Básicas | JS puro regex — elimina comentarios y espacios |
| `/formateador-sql` | `FormateadorSQLTool.tsx` | Básicas | JS puro — keywords en mayúsculas, saltos de línea |
| `/jwt-decoder` | `JwtDecoderTool.tsx` | Básicas | `atob` + base64url decode — header, payload, signature |
| `/esquema-colores` | `EsquemaColoresTool.tsx` | Básicas | JS puro HSL — 6 esquemas de color armoniosos |
| `/comparar-texto` | `CompararTextoTool.tsx` | Básicas | Algoritmo LCS — diff línea a línea con resaltado |
| `/conversor-base` | `ConversorBaseTool.tsx` | Básicas | `parseInt/toString` nativo — dec/bin/hex/oct + nibbles |
| `/entidades-html` | `EntidadesHTMLTool.tsx` | Básicas | JS puro + `textarea.innerHTML` — codificar/decodificar |
| `/minificador-svg` | `MinificadorSVGTool.tsx` | Básicas | JS regex puro — elimina metadatos, comentarios, attrs Inkscape/RDF |
| `/og-image` | `OGImageTool.tsx` | Básicas | Canvas API 1200×630 — título, subtítulo, colores, logo opcional |
| `/convertir-fuente` | `ConvertirFuenteTool.tsx` | Básicas | Binary SFNT parser — TTF/OTF ↔ WOFF sin pérdida, sin librería |
| `/formatear-xml` | `FormatearXMLTool.tsx` | Básicas | JS puro — indentación jerárquica + minify + validación con DOMParser |
| `/slugify` | `SlugifyTool.tsx` | Básicas | JS puro — normalize NFD + regex de slug |
| `/mayusculas-minusculas` | `CambiarMayusculasTool.tsx` | Básicas | JS puro — transformaciones de caso Unicode |
| `/base64-a-imagen` | `Base64AImagenTool.tsx` | Básicas | `atob` → Blob → object URL descargable |
| `/contraste-color` | `ContrasteColorTool.tsx` | Básicas | JS puro — luminancia relativa + ratio WCAG AA/AAA |
| `/sombra-css` | `SombraCssTool.tsx` | Básicas | JS puro — generador box-shadow + preview en vivo |
| `/meta-tags` | `MetaTagsTool.tsx` | Básicas | JS puro — plantillas OG/Twitter + escape HTML |
| `/convertir-bytes` | `ConvertirBytesTool.tsx` | Básicas | JS puro — conversión binaria (1 KB = 1024 B) |
| `/texto-a-binario` | `TextoABinarioTool.tsx` | Básicas | `TextEncoder/TextDecoder` + base 2 |
| `/codigo-morse` | `CodigoMorseTool.tsx` | Básicas | JS puro — mapa morse bidireccional |
| `/json-a-typescript` | `JsonATypescriptTool.tsx` | Básicas | JS puro — generador recursivo de interfaces TS |
| `/generador-cron` | `GeneradorCronTool.tsx` | Básicas | JS puro — parser de 5 campos + descripción en español + próximas ejecuciones |
| `/formatear-yaml` | `FormatearYamlTool.tsx` | Básicas | `yaml` (YAML 1.2) `parseDocument` → errores con línea/columna en español (`yaml-errors.ts`), sangría 2/4 conservando comentarios, ordenar claves |
| `/json-a-yaml` | `JsonYamlTool.tsx (`initial="json-yaml"`)` | Básicas | `yaml.stringify` con reglas 1.1 (entrecomilla yes/on/fechas) y botón de intercambio |
| `/yaml-a-json` | `JsonYamlTool.tsx (`initial="yaml-json"`)` | Básicas | `yaml.parse` (1.2, resuelve anclas y alias) → `JSON.stringify` |
| `/json-a-csv` | `JsonACsvTool.tsx` | Básicas | Aplanado con notación de puntos, unión de claves, separador , ; o tab y BOM para Excel |
| `/comparar-json` | `CompararJsonTool.tsx` | Básicas | Diff estructural recursivo con rutas JSONPath ($.a.b[2]), cambios de tipo y opción de ignorar el orden de arrays |
| `/curl-a-codigo` | `CurlACodigoTool.tsx` | Básicas | Tokenizador estilo bash (comillas, escapes, \ y ^) → fetch, axios, Node.js, Python requests y PHP cURL |
| `/markdown-a-html` | `MarkdownAHtmlTool.tsx` | Básicas | `marked` (GFM) con vista previa en iframe `sandbox` sin scripts; fragmento o página completa con estilos |
| `/decodificar-certificado` | `DecodificarCertificadoTool.tsx` | Avanzadas | Lector ASN.1 DER propio: sujeto, emisor, validez, SAN, clave (RSA bits / curva EC), firma, EKU; huellas con `crypto.subtle`; PEM, DER y cadenas |
| `/simulador-daltonismo` | `SimuladorDaltonismoTool.tsx` | Básicas | Matrices de Machado 2009 sobre RGB lineal (protanopia, deuteranopia, tritanopia) + acromatopsia; descarga a tamaño real |
