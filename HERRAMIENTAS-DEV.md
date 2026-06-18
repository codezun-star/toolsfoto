> Parte de la documentación de ToolsFoto.
> Ver índice general en [HERRAMIENTAS.md](HERRAMIENTAS.md)

## Developer (32)

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
