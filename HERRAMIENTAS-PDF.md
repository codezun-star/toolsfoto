> Parte de la documentación de ToolsFoto.
> Ver índice general en [HERRAMIENTAS.md](HERRAMIENTAS.md)

## PDF (33)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/comprimir-pdf` | `ComprimirPDFTool.tsx` | Básicas | pdf-lib `save({ useObjectStreams: true })` |
| `/unir-pdfs` | `UnirPDFsTool.tsx` | Básicas | pdf-lib `copyPages` multi-doc |
| `/dividir-pdf` | `DividirPDFTool.tsx` | Básicas | pdf-lib `copyPages` por página o rango |
| `/pdf-a-jpg` | `PDFaJPGTool.tsx` | Básicas | pdfjs-dist `getPage().render()` + canvas + CDN worker |
| `/jpg-a-pdf` | `JPGaPDFTool.tsx` | Básicas | pdf-lib `embedJpg/embedPng` + `addPage` |
| `/rotar-pdf` | `RotarPDFTool.tsx` | Básicas | pdf-lib `page.setRotation(degrees(n))` |
| `/extraer-paginas-pdf` | `ExtraerPaginasPDFTool.tsx` | Básicas | pdf-lib `copyPages` con rango personalizado |
| `/extraer-texto-pdf` | `ExtraerTextoPDFTool.tsx` | Avanzadas | pdfjs-dist `getTextContent()` + CDN worker |
| `/proteger-pdf` | `ProtegerPDFTool.tsx` | Avanzadas | pdf-lib `doc.encrypt({ userPassword, ownerPassword })` |
| `/eliminar-password-pdf` | `EliminarPasswordPDFTool.tsx` | Avanzadas | pdf-lib `PDFDocument.load(bytes, { password })` + save |
| `/marca-agua-pdf` | `MarcaAguaPDFTool.tsx` | Básicas | pdf-lib `page.drawText()` con `rotate: degrees(45)` + opacity |
| `/numerar-paginas-pdf` | `NumerarPaginasPDFTool.tsx` | Básicas | pdf-lib `page.drawText()` — posición, formato y número inicial |
| `/firmar-pdf` | `FirmarPDFTool.tsx` | Avanzadas | Canvas drawing pad → `embedPng` → `page.drawImage()` |
| `/pdf-a-png` | `PDFaPNGTool.tsx` | Básicas | pdfjs-dist `render()` + `canvas.toBlob('image/png')` |
| `/reordenar-paginas-pdf` | `ReordenarPaginasPDFTool.tsx` | Básicas | pdfjs-dist thumbnails + pdf-lib `copyPages(src, order)` |
| `/recortar-pdf` | `RecortarPDFTool.tsx` | Básicas | pdf-lib `page.setCropBox()` — márgenes en mm → pt (×2.8346) |
| `/anadir-texto-pdf` | `AnadirTextoPDFTool.tsx` | Básicas | pdf-lib `page.drawText()` — hasta 5 bloques, posición X/Y%, color |
| `/eliminar-paginas-pdf` | `EliminarPaginasPDFTool.tsx` | Básicas | pdf-lib `copyPages` conservando solo páginas no eliminadas |
| `/anadir-imagen-pdf` | `AnadirImagenPDFTool.tsx` | Básicas | pdf-lib `embedJpg/embedPng` + `page.drawImage()` con posición % |
| `/pdf-en-blanco` | `PDFEnBlancoTool.tsx` | Básicas | pdf-lib `addPage([w, h])` con tamaños estándar y orientación |
| `/metadatos-pdf` | `MetadatosPDFTool.tsx` | Básicas | pdf-lib `getTitle/setTitle/getAuthor/setAuthor…` |
| `/intercalar-pdfs` | `IntercalarPDFsTool.tsx` | Básicas | pdf-lib `copyPages` alternando páginas A1, B1, A2, B2… |
| `/escalar-pdf` | `EscalarPDFTool.tsx` | Básicas | pdf-lib `embedPage` + `drawPage` — fit to page |
| `/encabezado-pie-pdf` | `EncabezadoPiePDFTool.tsx` | Básicas | pdf-lib `page.drawText()` centrado en cabecera y pie |
| `/duplicar-paginas-pdf` | `DuplicarPaginasPDFTool.tsx` | Básicas | pdf-lib `copyPages` — inserta N copias tras la página original |
| `/insertar-pagina-pdf` | `InsertarPaginaPDFTool.tsx` | Básicas | pdf-lib — inserta páginas en blanco en posición elegida |
| `/fondo-color-pdf` | `FondoColorPDFTool.tsx` | Básicas | pdf-lib `drawRectangle` + `embedPage` — fondo de color |
| `/aplanar-pdf` | `AplanarPDFTool.tsx` | Básicas | pdf-lib `doc.getForm().flatten()` — aplana formularios |
| `/sellar-pdf` | `SellarPDFTool.tsx` | Básicas | pdf-lib `page.drawText()` — sello diagonal con `rotate: degrees(35)` |
| `/pdf-a-svg` | `PDFaSVGTool.tsx` | Básicas | pdfjs-dist → canvas → SVG con PNG embebido + ZIP builder puro |
| `/comparar-pdfs` | `CompararPDFsTool.tsx` | Básicas | pdfjs-dist — renderizado paralelo sincronizado, escala ajustable |
| `/indice-pdf` | `IndicePDFTool.tsx` | Básicas | pdfjs-dist `getOutline()` + detección por tamaño de fuente fallback |
| `/pdf-escala-grises` | `PdfEscalaGrisesTool.tsx` | Avanzadas | pdfjs render → grayscale por luminancia → pdf-lib `embedJpg` |
