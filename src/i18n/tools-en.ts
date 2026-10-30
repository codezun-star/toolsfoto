/**
 * Versión en inglés de las herramientas (`/en/<slug>`). Cada entrada apunta a
 * la herramienta española (`es`, la clave de `TOOLS`) y aporta su ficha, SEO
 * y contenido en inglés. Las sirve `src/pages/en/[tool].astro`, y
 * `ToolLayout` enlaza ambas versiones con `hreflang`.
 *
 * Solo deben figurar herramientas cuyo componente esté traducido (exporta
 * `withLang(...)` y todas sus frases están en `src/i18n/en.ts`).
 */

export interface EnTool {
  /** Slug de la herramienta en español (`TOOLS`). */
  es: string;
  /** Slug de la URL en inglés: /en/<slug>. */
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  title: string;
  metaDescription: string;
  answer: string;
  howTo: string[];
  faqs: Array<{ q: string; a: string }>;
  /** Bloques bajo la herramienta; `body` admite HTML propio (enlaces). */
  sections: Array<{ title: string; body: string }>;
  /** Slugs en español de herramientas relacionadas (solo se muestran las que tienen versión en inglés). */
  related: string[];
}

const a = (href: string, text: string) => `<a class="underline text-[var(--color-accent)]" href="${href}">${text}</a>`;
const b = (text: string) => `<strong class="text-[var(--color-text)]">${text}</strong>`;

const PRIVATE = {
  q: 'Are my files uploaded to a server?',
  a: 'No. Everything is processed inside your browser and your files never leave your device. There is no upload, no queue and no temporary storage, so the tool keeps working even if you go offline after the page has loaded.',
};
const FREE = {
  q: 'Is it really free?',
  a: 'Yes. There is no sign-up, no watermark and no daily limit. The site is funded by a few unobtrusive ads around the tools, never inside your files.',
};

export const EN_TOOLS: EnTool[] = [
  // ── Image ─────────────────────────────────────────────────────────────────
  {
    es: 'comprimir', slug: 'compress-image',
    name: 'Compress image',
    description: 'Reduce image file size without visible quality loss.',
    longDescription: 'Compress JPG, PNG and WebP images right in your browser. Pick the quality and see the size before and after, with no upload and no sign-up.',
    title: 'Compress Images Online for Free (JPG, PNG, WebP) | ToolsFoto',
    metaDescription: 'Reduce the file size of JPG, PNG and WebP images without visible quality loss. Free, no sign-up, and your images never leave your browser.',
    answer: 'Drop an image, pick a quality level and download a lighter file: photos usually shrink by 60–80% with no visible difference. Compression runs in your browser, so nothing is uploaded.',
    howTo: ['Drag your image or paste it with Ctrl+V.', 'Choose the quality (80% is a good default).', 'Press “Compress” and compare the size before and after.', 'Download the compressed image.'],
    faqs: [
      { q: 'How much can I reduce an image?', a: 'A typical phone photo (3–5 MB) usually drops to 300–900 KB at 80% quality with no difference you can see on screen. PNG screenshots shrink less unless you convert them to WebP or JPG.' },
      { q: 'Will my image lose quality?', a: 'JPG and WebP compression removes detail the eye barely notices. Between 75% and 85% quality the result looks identical on screen; below 60% you start to see artifacts around edges and text.' },
      { q: 'I need a file under a specific size. What should I do?', a: 'If a form requires, say, less than 200 KB, use “Compress to a target size” in the Spanish version of the site or lower the quality step by step here and check the size shown after each run.' },
      { q: 'Can I compress many images at once?', a: 'This tool works one image at a time so you can compare. For whole folders, use the batch tool “Compress multiple images”, which processes up to 200 files and downloads a ZIP.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Faster websites and lighter emails', body: `Images are usually the heaviest part of a web page or an email. Compressing them ${b('cuts load times and keeps you under attachment limits')} without changing how they look.` },
      { title: 'Related tools', body: `Change the dimensions with ${a('/en/resize-image', 'Resize image')}, switch formats with ${a('/en/convert-image', 'Convert image')} or process a whole folder with ${a('/en/compress-images', 'Compress multiple images')}.` },
    ],
    related: ['redimensionar', 'convertir', 'comprimir-varias-imagenes', 'recortar'],
  },
  {
    es: 'redimensionar', slug: 'resize-image',
    name: 'Resize image',
    description: 'Change image dimensions by pixels or percentage.',
    longDescription: 'Resize any image to exact pixel dimensions or by percentage, keeping the aspect ratio locked if you want. Works with JPG, PNG, WebP and more, entirely in your browser.',
    title: 'Resize Images Online for Free: Pixels or Percentage | ToolsFoto',
    metaDescription: 'Resize JPG, PNG and WebP images to exact pixels or by percentage, with the aspect ratio locked. Free, no sign-up, processed in your browser.',
    answer: 'Upload an image, type the width or height you need (or a percentage) and download it resized. The aspect ratio stays locked unless you unlock it, and nothing is uploaded.',
    howTo: ['Upload the image.', 'Enter the new width or height in pixels, or a percentage.', 'Keep the aspect ratio locked to avoid distortion.', 'Download the resized image.'],
    faqs: [
      { q: 'How do I resize an image without distorting it?', a: 'Keep the aspect-ratio lock on: when you change the width, the height is calculated automatically (and vice versa), so the image keeps its proportions.' },
      { q: 'What size should I use for the web?', a: 'For full-width banners, 1920 px wide; for blog and product photos, 1000–1600 px; for thumbnails, 300–600 px. Larger images only make the page slower.' },
      { q: 'Can I make an image larger?', a: 'Yes, but enlarging only stretches existing pixels, so it gets blurrier. To enlarge photos with real detail, use “Upscale image (AI)”.' },
      { q: 'Does resizing reduce the file size?', a: 'Yes. Fewer pixels means a lighter file: halving the width and height leaves roughly a quarter of the pixels.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Exact sizes for every use', body: `Meet the dimensions a form, a marketplace or a social network asks for ${b('in seconds')}, without installing an editor.` },
      { title: 'Related tools', body: `Crop to an exact area with ${a('/en/crop-image', 'Crop image')}, shrink the file with ${a('/en/compress-image', 'Compress image')} or enlarge with AI using ${a('/en/upscale-image', 'Upscale image')}.` },
    ],
    related: ['recortar', 'comprimir', 'mejorar-calidad-imagen', 'convertir'],
  },
  {
    es: 'recortar', slug: 'crop-image',
    name: 'Crop image',
    description: 'Select and crop the exact area you need.',
    longDescription: 'Drag the crop box to keep exactly the part of the image you want, or pick a preset ratio such as 1:1, 16:9, 4:3 or 9:16. Free and private: it runs in your browser.',
    title: 'Crop Images Online for Free (1:1, 16:9, 4:3, 9:16) | ToolsFoto',
    metaDescription: 'Crop images with a draggable box or preset ratios like 1:1, 16:9, 4:3 and 9:16. Free, no sign-up, and your photo never leaves your browser.',
    answer: 'Upload an image, drag the crop box over the area you want to keep (or choose a ratio like 1:1 or 16:9) and download the cropped image. It all happens in your browser.',
    howTo: ['Upload the image.', 'Choose a ratio or crop freely.', 'Drag and resize the crop box.', 'Download the cropped image.'],
    faqs: [
      { q: 'Which aspect ratio should I choose?', a: '1:1 for profile pictures and Instagram posts, 4:5 for vertical Instagram posts, 16:9 for YouTube thumbnails and presentations, and 9:16 for stories, Reels and TikTok.' },
      { q: 'Does cropping reduce quality?', a: 'No. Cropping only removes the pixels outside the box; the area you keep stays exactly as it was.' },
      { q: 'Can I crop to exact pixel dimensions?', a: 'Crop with the ratio you need first and then set the exact pixels with “Resize image”.' },
      { q: 'Does it work on phones?', a: 'Yes. You can drag the crop box with your finger on any modern mobile browser.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Frame the shot you meant to take', body: `Remove distracting edges, straighten your composition or fit a photo to a social network format ${b('in a couple of taps')}.` },
      { title: 'Related tools', body: `After cropping, ${a('/en/resize-image', 'resize')} or ${a('/en/compress-image', 'compress')} the image.` },
    ],
    related: ['redimensionar', 'comprimir', 'convertir', 'eliminar-fondo'],
  },
  {
    es: 'convertir', slug: 'convert-image',
    name: 'Convert image format',
    description: 'Convert between JPG, PNG, WebP and AVIF instantly.',
    longDescription: 'Change the format of any image to JPG, PNG, WebP or AVIF with one click and see the estimated size before you download. No software and no upload: it runs in your browser.',
    title: 'Convert Images Online: JPG, PNG, WebP and AVIF | ToolsFoto',
    metaDescription: 'Convert images between JPG, PNG, WebP and AVIF in seconds and see the output size first. Free, no sign-up, processed in your browser.',
    answer: 'Upload an image, choose JPG, PNG, WebP or AVIF and download the converted file. You see the estimated size before converting, and the image never leaves your browser.',
    howTo: ['Upload the image.', 'Choose the output format.', 'Adjust the quality if the format allows it.', 'Download the converted image.'],
    faqs: [
      { q: 'Which format should I choose?', a: 'JPG for photos you will share or print, PNG for logos, screenshots and anything with transparency, WebP for websites (25–35% lighter than JPG) and AVIF for the smallest files on modern browsers.' },
      { q: 'What happens to transparency when converting to JPG?', a: 'JPG has no transparency, so transparent areas are filled with white. Choose PNG or WebP to keep them.' },
      { q: 'Can I convert iPhone HEIC photos?', a: 'Use “HEIC to JPG”, which decodes Apple’s format, or the batch converter for many photos at once.' },
      { q: 'Does converting lose quality?', a: 'Converting to PNG is lossless. Converting to JPG, WebP or AVIF compresses the image; at 85–90% quality the difference is not visible.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'The right format for every job', body: `Get ${b('the file a website, app or printer accepts')} without installing an image editor.` },
      { title: 'Related tools', body: `Specific converters: ${a('/en/png-to-jpg', 'PNG to JPG')}, ${a('/en/jpg-to-png', 'JPG to PNG')}, ${a('/en/webp-to-jpg', 'WebP to JPG')} and ${a('/en/heic-to-jpg', 'HEIC to JPG')}.` },
    ],
    related: ['png-a-jpg', 'jpg-a-png', 'webp-a-jpg', 'heic-a-jpg'],
  },
  {
    es: 'eliminar-fondo', slug: 'remove-background',
    name: 'Remove background (AI)',
    description: 'Remove the background from any photo with AI.',
    longDescription: 'Remove the background from people, products, animals or objects with an AI model that runs in your browser, and download a transparent PNG. No upload, no sign-up and no watermark.',
    title: 'Remove Background from Image with AI, Free | ToolsFoto',
    metaDescription: 'Remove the background from any photo with AI and download a transparent PNG. Free, no watermark, and the image never leaves your browser.',
    answer: 'Upload a photo and the AI separates the subject from the background automatically; download the result as a transparent PNG. The model runs in your browser, so your photo is never uploaded.',
    howTo: ['Upload the photo.', 'Wait while the AI detects the subject (the first time it downloads the model).', 'Check the result on the checkerboard preview.', 'Download the transparent PNG.'],
    faqs: [
      { q: 'How does it work?', a: 'It uses an image segmentation model (ISNet) that runs in your browser with WebAssembly. It recognizes the main subject—people, products, pets, objects—and makes everything else transparent.' },
      { q: 'Why is it slow the first time?', a: 'The AI model (about 50 MB) is downloaded once and cached by your browser. After that, each image takes a few seconds.' },
      { q: 'What kind of photos work best?', a: 'Photos with a clear main subject and good contrast against the background. Hair, fur and transparent objects are the hardest cases; plain backgrounds are the easiest.' },
      { q: 'Why is the result a PNG?', a: 'Because PNG stores transparency. JPG cannot, and would fill the background with white or black again.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Product photos and profile pictures in seconds', body: `Create ${b('clean product shots, stickers, profile pictures or design cut-outs')} without spending time on manual selections.` },
      { title: 'Related tools', body: `Erase unwanted objects with ${a('/en/remove-objects', 'Remove objects from photo')} or improve a small photo with ${a('/en/upscale-image', 'Upscale image')}.` },
    ],
    related: ['borrar-objetos-foto', 'mejorar-calidad-imagen', 'recortar', 'comprimir'],
  },
  {
    es: 'heic-a-jpg', slug: 'heic-to-jpg',
    name: 'HEIC to JPG',
    description: 'Convert iPhone HEIC photos to JPG.',
    longDescription: 'Convert HEIC and HEIF photos from your iPhone or iPad to JPG or PNG so they open on Windows, Android and any website. Free, private and processed in your browser.',
    title: 'Convert HEIC to JPG Online for Free (iPhone Photos) | ToolsFoto',
    metaDescription: 'Convert iPhone HEIC and HEIF photos to JPG or PNG so they open anywhere. Free, no sign-up, and the conversion happens in your browser.',
    answer: 'Upload an HEIC photo from your iPhone, choose JPG (or PNG) and download a file that opens on any computer, phone or website. Nothing is uploaded.',
    howTo: ['Upload the HEIC or HEIF photo.', 'Choose JPG or PNG and the quality.', 'Press “Convert”.', 'Download the converted photo.'],
    faqs: [
      { q: 'What is a HEIC file?', a: 'HEIC (HEIF) is the format iPhones use to save photos since iOS 11. It takes about half the space of a JPG, but Windows, Android and many websites cannot open it.' },
      { q: 'Does converting lose quality?', a: 'At 90% JPG quality the result looks the same. Choose PNG if you want a lossless copy, at the cost of a much larger file.' },
      { q: 'Can I convert many HEIC photos at once?', a: 'Yes: use “Compress multiple images” or the Spanish batch converter, which accept HEIC and download everything as a ZIP.' },
      { q: 'How do I stop my iPhone from taking HEIC photos?', a: 'Go to Settings > Camera > Formats and choose “Most Compatible”. New photos will be saved as JPG.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Your iPhone photos, on any device', body: `${b('Open, share and upload your iPhone photos anywhere')} without installing codecs or extensions.` },
      { title: 'Related tools', body: `Shrink the converted photos with ${a('/en/compress-image', 'Compress image')} or convert other formats with ${a('/en/convert-image', 'Convert image')}.` },
    ],
    related: ['convertir', 'comprimir', 'png-a-jpg', 'comprimir-varias-imagenes'],
  },
  {
    es: 'png-a-jpg', slug: 'png-to-jpg',
    name: 'PNG to JPG',
    description: 'Convert PNG images to lighter JPG files.',
    longDescription: 'Convert PNG images to JPG and reduce their size by up to 80%. Choose the quality and the background color for transparent areas. Free and processed in your browser.',
    title: 'Convert PNG to JPG Online for Free | ToolsFoto',
    metaDescription: 'Convert PNG images to JPG and cut their file size by up to 80%. Choose the quality and the background for transparency. Free and private.',
    answer: 'Upload a PNG, choose the quality and a background color for transparent areas, and download a much lighter JPG. The conversion happens in your browser.',
    howTo: ['Upload the PNG image.', 'Choose the JPG quality and the background color.', 'Press “Convert”.', 'Download the JPG.'],
    faqs: [
      { q: 'How much smaller is a JPG than a PNG?', a: 'For photos, usually 60–80% smaller. PNG stores every pixel losslessly, which is very inefficient for images with many tones.' },
      { q: 'What happens to the transparency?', a: 'JPG has no transparency, so transparent areas are filled with the background color you pick (white by default).' },
      { q: 'When should I not convert to JPG?', a: 'For logos, screenshots with text or images with sharp edges, JPG compression creates artifacts. Keep PNG or use WebP.' },
      { q: 'Which quality should I choose?', a: '85–90% looks identical to the original for most photos; 70–80% gives even lighter files.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Lighter photos for sharing', body: `PNG photos are often ${b('five to ten times larger than they need to be')}. JPG makes them easy to email and upload.` },
      { title: 'Related tools', body: `Go the other way with ${a('/en/jpg-to-png', 'JPG to PNG')} or shrink the result further with ${a('/en/compress-image', 'Compress image')}.` },
    ],
    related: ['jpg-a-png', 'comprimir', 'convertir', 'webp-a-jpg'],
  },
  {
    es: 'jpg-a-png', slug: 'jpg-to-png',
    name: 'JPG to PNG',
    description: 'Convert JPG images to lossless PNG.',
    longDescription: 'Convert JPG photos to PNG, a lossless format that is ideal for editing, for adding transparency later or for files you will save many times. Free and processed in your browser.',
    title: 'Convert JPG to PNG Online for Free | ToolsFoto',
    metaDescription: 'Convert JPG photos to lossless PNG for editing or to add transparency later. Free, no sign-up, and nothing is uploaded to a server.',
    answer: 'Upload a JPG and download it as PNG, a lossless format that won’t lose more quality when you edit and save it again. Everything happens in your browser.',
    howTo: ['Upload the JPG image.', 'Press “Convert to PNG”.', 'Download the PNG.'],
    faqs: [
      { q: 'Does converting JPG to PNG improve quality?', a: 'No. Detail lost when the JPG was compressed cannot be recovered. The PNG keeps the image exactly as it is, without losing more each time you save it.' },
      { q: 'Why is the PNG larger?', a: 'PNG is lossless, so it stores every pixel. A photo can take several times more space than in JPG.' },
      { q: 'Does the PNG have a transparent background?', a: 'Not automatically: a JPG has no transparency to convert. To remove the background use “Remove background (AI)”.' },
      { q: 'When is PNG better?', a: 'For images you are going to keep editing, for screenshots and graphics with text, and when a website or program specifically asks for PNG.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'A safe format for editing', body: `PNG ${b('never adds compression artifacts')}, so it is the right format for images you will keep working on.` },
      { title: 'Related tools', body: `Remove the background with ${a('/en/remove-background', 'Remove background')} or go back with ${a('/en/png-to-jpg', 'PNG to JPG')}.` },
    ],
    related: ['png-a-jpg', 'eliminar-fondo', 'convertir', 'comprimir'],
  },
  {
    es: 'webp-a-jpg', slug: 'webp-to-jpg',
    name: 'WebP to JPG',
    description: 'Convert WebP images to JPG.',
    longDescription: 'Convert WebP images downloaded from the web to JPG so they open in any program, editor or social network. Choose the quality and the background color. Free and private.',
    title: 'Convert WebP to JPG Online for Free | ToolsFoto',
    metaDescription: 'Convert WebP images to JPG so they open in any program or app. Choose the quality and background color. Free, in your browser.',
    answer: 'Upload a WebP image, choose the quality and download a JPG that opens everywhere. The conversion happens in your browser.',
    howTo: ['Upload the WebP image.', 'Choose the quality and the background color.', 'Press “Convert”.', 'Download the JPG.'],
    faqs: [
      { q: 'Why do images download as WebP?', a: 'Many websites serve WebP because it is 25–35% lighter than JPG. When you save the image, you get the WebP file the site was using.' },
      { q: 'Why convert WebP to JPG?', a: 'Some older programs, editors, printers and forms still don’t accept WebP. JPG works everywhere.' },
      { q: 'What happens to transparency?', a: 'JPG has no transparency, so it is filled with the background color you choose. To keep it, convert to PNG instead.' },
      { q: 'Will the JPG be larger?', a: 'Usually a bit, because JPG compresses less efficiently than WebP. That is the price of compatibility.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Open any image you save', body: `${b('Turn web images into a format every app understands')} in one step.` },
      { title: 'Related tools', body: `Convert other formats with ${a('/en/convert-image', 'Convert image')} or iPhone photos with ${a('/en/heic-to-jpg', 'HEIC to JPG')}.` },
    ],
    related: ['convertir', 'png-a-jpg', 'heic-a-jpg', 'comprimir'],
  },
  {
    es: 'imagen-a-texto', slug: 'image-to-text',
    name: 'Image to text (OCR)',
    description: 'Extract text from a photo, screenshot or scan.',
    longDescription: 'Recognize the text in any image with OCR (Tesseract) right in your browser: document photos, screenshots, signs or notes. Supports English, Spanish, Portuguese, French, German, Italian and Catalan, and you can edit the result before copying it.',
    title: 'Image to Text (OCR) Online for Free | ToolsFoto',
    metaDescription: 'Extract text from photos, screenshots and scanned documents with OCR in your browser. English and other languages. No upload, free.',
    answer: 'Upload a photo or screenshot, choose the language and press “Extract text”: OCR recognizes the text in your browser and shows it ready to edit, copy or download. The image is not uploaded.',
    howTo: ['Drop the image or paste it with Ctrl+V.', 'Choose the language of the text.', 'Press “Extract text” and wait a few seconds.', 'Review, edit, copy or download the text.'],
    faqs: [
      { q: 'What is OCR?', a: 'Optical Character Recognition turns the text that appears in an image into real text you can copy, edit and search. This tool uses Tesseract, the open-source OCR engine, compiled to WebAssembly.' },
      { q: 'How can I get better results?', a: 'Use sharp, well-lit, straight images. Crop to the area with text, avoid shadows and reflections, and choose the right language. Screenshots and scans usually reach over 95% accuracy; handwriting is much harder.' },
      { q: 'Which languages are supported?', a: 'English, Spanish, Portuguese, French, German, Italian and Catalan, plus a combined Spanish + English option. Each language is downloaded once (2–15 MB) and cached.' },
      { q: 'Can I extract text from a scanned PDF?', a: 'Yes, with “OCR PDF”, which recognizes every page and can return a searchable PDF or the text only.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Stop retyping text from photos', body: `Copy text from ${b('notes, receipts, signs, book pages or screenshots')} straight into a document, an email or a translator.` },
      { title: 'Private OCR', body: `Most online OCR services upload your image. Here the engine ${b('runs in your browser')}, which makes it suitable for IDs, contracts or medical documents.` },
    ],
    related: ['ocr-pdf', 'recortar', 'comprimir', 'pdf-a-word'],
  },

  {
    es: 'mejorar-calidad-imagen', slug: 'upscale-image',
    name: 'Upscale image (AI)',
    description: 'Increase the resolution and sharpness of photos with AI.',
    longDescription: 'Improve blurry, small or pixelated photos with Real-ESRGAN, an AI model that rebuilds detail when enlarging ×2 or ×4 and removes noise and compression blocks. It runs in your browser, with no upload.',
    title: 'Upscale Images with AI for Free (×2, ×4) | ToolsFoto',
    metaDescription: 'Increase the resolution of blurry or small photos ×2 or ×4 with AI (Real-ESRGAN) and remove noise and pixelation. In your browser, free.',
    answer: 'Upload a small, blurry or pixelated photo and press “Enhance with AI”: Real-ESRGAN enlarges it ×2 or ×4, rebuilding detail and removing noise and compression blocks. Everything happens in your browser.',
    howTo: ['Upload the image you want to improve.', 'Choose the upscale factor: ×2 or ×4.', 'Press “Enhance with AI” and wait until it finishes.', 'Compare before and after and download the PNG.'],
    faqs: [
      { q: 'How is this different from a normal resize?', a: 'A normal (bicubic) enlargement only stretches existing pixels, so the photo gets bigger but stays just as blurry. The AI has learned what edges, textures and details look like and rebuilds them, removing blur, noise and JPG blocks.' },
      { q: 'Which photos work best?', a: 'Small or compressed photos: images downloaded from social networks or messaging apps, screenshots, old low-resolution scans, logos and product photos. With tiny faces or text the AI may invent detail, so always check the comparison slider.' },
      { q: 'Why is my image reduced first sometimes?', a: 'Upscaling ×4 multiplies the number of pixels by 16. To avoid running out of memory, the input is limited to about 2 megapixels with WebGPU and 0.6 megapixels on the CPU. You are told when this happens.' },
      { q: 'How long does it take?', a: 'The 5 MB model is downloaded once from our own domain. With WebGPU (recent Chrome, Edge or Safari) a photo takes seconds; on the CPU it can take a minute or two. A progress bar shows the status.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Rescue photos you thought were lost', body: `That photo you only have at chat size, the logo you need to print or the pixelated product shot: ${b('the AI restores sharpness and resolution')} so you can use them at a larger size.` },
      { title: 'Related tools', body: `After enhancing, ${a('/en/remove-background', 'remove the background')}, ${a('/en/remove-objects', 'erase unwanted objects')} or ${a('/en/compress-image', 'compress it')} for the web.` },
    ],
    related: ['eliminar-fondo', 'borrar-objetos-foto', 'redimensionar', 'comprimir'],
  },
  {
    es: 'borrar-objetos-foto', slug: 'remove-objects',
    name: 'Remove objects from photo (AI)',
    description: 'Erase people, objects or text from a photo by painting over them.',
    longDescription: 'Remove what doesn’t belong in your photos: people in the background, cables, bins, text or marks. Paint over them and the AI (LaMa) fills the area with what should be behind. The rest of the image keeps its original resolution.',
    title: 'Remove Objects or People from Photos with AI, Free | ToolsFoto',
    metaDescription: 'Erase people, objects, cables or text from your photos by painting over them: the AI fills in the background. No upload, free.',
    answer: 'Upload a photo, paint over the person, object or text you want gone and press “Erase marked area”: the AI (LaMa) fills it with the background that should be there. It runs in your browser without losing resolution.',
    howTo: ['Upload the photo.', 'Paint over what you want to erase.', 'Press “Erase marked area” and repeat if needed.', 'Download the clean photo.'],
    faqs: [
      { q: 'What technology does it use?', a: 'LaMa (Large Mask Inpainting), an open-source AI model specialized in filling large areas of an image consistently with their surroundings, in the optimized OpenCV version that runs in your browser with ONNX Runtime.' },
      { q: 'Why is it slow the first time?', a: 'The model weighs 92 MB and is downloaded once. After that it is cached by your browser and each erase takes 10–40 seconds depending on your device.' },
      { q: 'What results can I expect?', a: 'Great results on natural and repetitive backgrounds: people on a beach, tourists in front of a monument, cables against the sky, spots or marks on a wall. Very large objects over complex backgrounds may look blurry: erase in several passes.' },
      { q: 'Does the photo lose resolution?', a: 'No. The AI only works on a crop around what you painted and the result is blended back with a soft edge. The rest of the image is untouched. Photos larger than 2,400 px on their longest side are reduced to that size.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'The travel photo you wanted to take', body: `Remove strangers, parked cars or lamp posts from your shots. ${b('Paint generously')}, including the object’s shadow, and repeat if anything is left.` },
      { title: 'Related tools', body: `To replace the whole background use ${a('/en/remove-background', 'Remove background')}; if the photo is small, ${a('/en/upscale-image', 'upscale it with AI')}.` },
    ],
    related: ['eliminar-fondo', 'mejorar-calidad-imagen', 'recortar', 'comprimir'],
  },
  {
    es: 'comprimir-varias-imagenes', slug: 'compress-images',
    name: 'Compress multiple images',
    description: 'Compress up to 200 images at once and download them as a ZIP.',
    longDescription: 'Reduce the size of many photos at once: drop up to 200 JPG, PNG, WebP or HEIC images, choose the quality and maximum width, and download them all in a ZIP. You see each file’s size before and after. Nothing is uploaded.',
    title: 'Compress Multiple Images at Once, Free (ZIP) | ToolsFoto',
    metaDescription: 'Compress up to 200 JPG, PNG, WebP or HEIC photos at once and download them as a ZIP. No uploads: everything runs in your browser. Free.',
    answer: 'Drop up to 200 images, choose the quality and maximum width and press “Compress”: they are processed in your browser and you download them together in a ZIP, with the savings shown for each one.',
    howTo: ['Drop all your images (JPG, PNG, WebP or HEIC).', 'Choose the quality, maximum width and format.', 'Press “Compress” and wait for all of them to finish.', 'Download the ZIP with all the compressed images.'],
    faqs: [
      { q: 'How many images can I compress at once?', a: 'Up to 200 images per batch, up to 50 MB each. They are processed one after another to avoid running out of memory: a batch of 100 phone photos takes about a minute on a normal computer.' },
      { q: 'Which quality and maximum width should I choose?', a: 'For the web and social media, 70–80% quality with a 1920 px maximum width cuts a phone photo by 70–90% with no visible difference. For email, 1280 px and 70%. To keep print quality, keep the size and use 85–90%.' },
      { q: 'Can an image get bigger after compressing?', a: 'No. If compressing an image would produce a larger file (it happens with already optimized images), the original file is kept.' },
      { q: 'Does it support iPhone HEIC photos?', a: 'Yes. HEIC photos are decoded and compressed automatically, and saved as JPG so they open anywhere.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'The whole album at once', body: `Compressing photos one by one is a waste of time. ${b('Drop them all, set the options once and get a ZIP')}: ideal to free up space, email photos or speed up your website.` },
      { title: 'Related tools', body: `For a single image with a preview use ${a('/en/compress-image', 'Compress image')}; to change formats, ${a('/en/convert-image', 'Convert image')}.` },
    ],
    related: ['comprimir', 'convertir', 'redimensionar', 'heic-a-jpg'],
  },

  // ── PDF ───────────────────────────────────────────────────────────────────
  {
    es: 'comprimir-pdf', slug: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce the size of your PDF files.',
    longDescription: 'Make PDF files smaller so they fit email limits and upload forms, choosing between stronger compression or higher quality. Free, no sign-up, and the PDF never leaves your browser.',
    title: 'Compress PDF Online for Free: Reduce PDF Size | ToolsFoto',
    metaDescription: 'Reduce the size of PDF files to email or upload them, choosing the compression level. Free, no sign-up, processed in your browser.',
    answer: 'Upload a PDF, choose the compression level and download a lighter file. The PDF is processed in your browser, so it is never uploaded to a server.',
    howTo: ['Upload the PDF.', 'Choose the compression level.', 'Press “Compress PDF”.', 'Download the smaller PDF.'],
    faqs: [
      { q: 'How much can a PDF be reduced?', a: 'It depends on its content. PDFs with many photos or scanned pages shrink the most; text-only PDFs are already small and shrink little.' },
      { q: 'Will the text still be selectable?', a: 'It depends on the level you choose: stronger levels convert pages to images to save space. If you need selectable text, choose the lighter level.' },
      { q: 'Is there a file size limit?', a: 'You can process PDFs up to 100 MB. Very large files depend on your device’s memory.' },
      { q: 'Can I compress a password-protected PDF?', a: 'Remove the password first (you need to know it) and then compress it.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Fit email and upload limits', body: `Most email services cap attachments at 20–25 MB and many forms at a few MB. ${b('Shrink your PDF to fit')} without retyping anything.` },
      { title: 'Related tools', body: `Combine documents with ${a('/en/merge-pdf', 'Merge PDF')} or split them with ${a('/en/split-pdf', 'Split PDF')}.` },
    ],
    related: ['unir-pdfs', 'dividir-pdf', 'pdf-a-jpg', 'pdf-a-word'],
  },
  {
    es: 'unir-pdfs', slug: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine several PDFs into a single file.',
    longDescription: 'Merge two or more PDF files into one document, reordering them before you combine. Free, no limits, and your files are processed in your browser.',
    title: 'Merge PDF Files Online for Free | ToolsFoto',
    metaDescription: 'Combine several PDF files into one document and choose their order. Free, no sign-up, no limits, and nothing is uploaded to a server.',
    answer: 'Add your PDFs, put them in the order you want and press “Merge”: you get a single PDF with all the pages. It happens in your browser, so nothing is uploaded.',
    howTo: ['Add two or more PDF files.', 'Reorder them with the up and down arrows.', 'Press “Merge PDFs”.', 'Download the combined PDF.'],
    faqs: [
      { q: 'How many PDFs can I merge?', a: 'As many as your device’s memory allows. Dozens of normal documents are no problem.' },
      { q: 'Is the quality kept?', a: 'Yes. Pages are copied as they are, without recompressing images or changing text.' },
      { q: 'Can I merge images and PDFs together?', a: 'Convert the images first with “JPG to PDF” and then merge everything here.' },
      { q: 'Can I reorder or remove pages afterwards?', a: 'Yes, with the reorder and delete pages tools (available in the Spanish version of the site).' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'One file instead of ten attachments', body: `Send ${b('a single, well-ordered document')} instead of a pile of separate PDFs.` },
      { title: 'Related tools', body: `Shrink the result with ${a('/en/compress-pdf', 'Compress PDF')} or turn images into a PDF with ${a('/en/jpg-to-pdf', 'JPG to PDF')}.` },
    ],
    related: ['comprimir-pdf', 'dividir-pdf', 'jpg-a-pdf', 'pdf-a-word'],
  },
  {
    es: 'pdf-a-jpg', slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert each PDF page into a JPG image.',
    longDescription: 'Turn every page of a PDF into a high-quality JPG image, choosing the resolution. Download pages one by one or all together. Free and processed in your browser.',
    title: 'Convert PDF to JPG Online for Free | ToolsFoto',
    metaDescription: 'Convert every page of a PDF into a high-quality JPG image, choosing the resolution. Free, no sign-up, and nothing is uploaded.',
    answer: 'Upload a PDF, choose the resolution and get each page as a JPG image ready to download. The PDF is rendered in your browser.',
    howTo: ['Upload the PDF.', 'Choose the image resolution.', 'Press “Convert”.', 'Download the images.'],
    faqs: [
      { q: 'Which resolution should I choose?', a: 'Standard resolution is enough for screens and sharing; choose high resolution if you are going to print or zoom into the pages.' },
      { q: 'Can I convert only some pages?', a: 'Convert the PDF and download only the pages you need, or extract them first with the extract pages tool.' },
      { q: 'Does it work with scanned PDFs?', a: 'Yes. Each page is rendered as an image, whether it contains text or scans.' },
      { q: 'What about PNG?', a: 'There is also a PDF to PNG tool if you need lossless images.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Share pages as images', body: `Post a page on social media, put it in a presentation or send it by chat ${b('without the recipient needing a PDF reader')}.` },
      { title: 'Related tools', body: `Go the other way with ${a('/en/jpg-to-pdf', 'JPG to PDF')} or extract the text with ${a('/en/pdf-to-word', 'PDF to Word')}.` },
    ],
    related: ['jpg-a-pdf', 'pdf-a-word', 'comprimir-pdf', 'unir-pdfs'],
  },
  {
    es: 'jpg-a-pdf', slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Combine images into a single PDF.',
    longDescription: 'Convert JPG, PNG and WebP images into a PDF, with one image per page in A4, Letter or the image’s own size. Reorder them before creating it. Free and private.',
    title: 'Convert JPG to PDF Online for Free (Images to PDF) | ToolsFoto',
    metaDescription: 'Combine JPG, PNG and WebP images into one PDF in A4, Letter or original size, in the order you want. Free, processed in your browser.',
    answer: 'Add your images, put them in order, choose the page size and download a PDF with one image per page. Nothing is uploaded.',
    howTo: ['Add the images (JPG, PNG or WebP).', 'Reorder them.', 'Choose A4, Letter or automatic page size.', 'Press “Create PDF” and download it.'],
    faqs: [
      { q: 'Can I add several images?', a: 'Yes. Each image becomes one page, in the order you set.' },
      { q: 'Which page size should I use?', a: 'A4 in most of the world, Letter in the US and Canada, or automatic so each page matches its image.' },
      { q: 'Is image quality reduced?', a: 'JPG images are embedded as they are, without recompression. PNG and WebP are embedded losslessly.' },
      { q: 'Can I scan documents with my phone and turn them into a PDF?', a: 'Yes: take photos of the pages and add them here. For best results, crop them first.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'From photos to a document', body: `Turn receipts, scanned pages or photos into ${b('a single PDF')} that is easy to send and print.` },
      { title: 'Related tools', body: `Combine with other PDFs using ${a('/en/merge-pdf', 'Merge PDF')} or shrink it with ${a('/en/compress-pdf', 'Compress PDF')}.` },
    ],
    related: ['unir-pdfs', 'comprimir-pdf', 'pdf-a-jpg', 'recortar'],
  },
  {
    es: 'pdf-a-word', slug: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert a PDF into an editable Word document (.docx).',
    longDescription: 'Turn your PDFs into editable Word documents. Paragraphs, headings, lists, bold and italics are rebuilt from the PDF’s text, and you get a .docx that opens in Word, LibreOffice or Google Docs. No upload.',
    title: 'Convert PDF to Word Online for Free (Editable DOCX) | ToolsFoto',
    metaDescription: 'Convert PDF to editable Word keeping paragraphs, headings, lists and bold text. No upload: it all happens in your browser. Free.',
    answer: 'Upload your PDF and press “Convert to Word”: you get an editable .docx with the paragraphs, headings, lists, bold and italics of the original. The conversion runs in your browser.',
    howTo: ['Upload the PDF you want to edit.', 'Choose whether to join lines into paragraphs (recommended).', 'Press “Convert to Word”.', 'Open the .docx in Word, LibreOffice or Google Docs.'],
    faqs: [
      { q: 'What is kept from the original PDF?', a: 'All the text, organized into paragraphs that reflow when you edit, plus headings (detected by font size), bulleted and numbered lists, bold, italics, centered text and page breaks. Images and exact column layouts are not transferred.' },
      { q: 'Does it work with scanned PDFs?', a: 'Not directly: a scanned PDF contains images, not text. The tool detects it and suggests running “OCR PDF” first.' },
      { q: 'What does “Keep the PDF line breaks” do?', a: 'By default lines are joined into paragraphs, which is what you want for running text. Turn the option on for poems, addresses or lists where every line matters.' },
      { q: 'Can I convert a password-protected PDF?', a: 'If the PDF asks for a password to open, remove it first (you need to know it).' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Edit what used to be read-only', body: `Update a résumé you only have as PDF, reuse text from a report or fix a contract ${b('without retyping it')}.` },
      { title: 'Related tools', body: `When you finish, convert it back with ${a('/en/word-to-pdf', 'Word to PDF')}. For tables, try ${a('/en/pdf-to-excel', 'PDF to Excel')}.` },
    ],
    related: ['word-a-pdf', 'pdf-a-excel', 'ocr-pdf', 'comprimir-pdf'],
  },

  {
    es: 'dividir-pdf', slug: 'split-pdf',
    name: 'Split PDF',
    description: 'Split a PDF into pages or extract a range.',
    longDescription: 'Split a PDF into one file per page, or extract only the pages you need (for example 1-3, 5, 8-10). Free, fast and processed in your browser.',
    title: 'Split PDF Online for Free: Extract Pages | ToolsFoto',
    metaDescription: 'Split a PDF into single pages or extract a range like 1-3, 5, 8-10. Free, no sign-up, and the file never leaves your browser.',
    answer: 'Upload a PDF and choose “Page by page” to get one PDF per page, or “Extract range” to keep only the pages you type (like 1-3, 5). Everything is processed in your browser.',
    howTo: ['Upload the PDF.', 'Choose page by page or extract a range.', 'Type the pages if you chose a range.', 'Press the button to download the files.'],
    faqs: [
      { q: 'How do I write the page range?', a: 'Separate pages with commas and use a hyphen for ranges: “1-3, 5, 8-10” extracts pages 1, 2, 3, 5, 8, 9 and 10 into a single PDF.' },
      { q: 'Is quality kept?', a: 'Yes. Pages are copied exactly as they are: text stays selectable and images are not recompressed.' },
      { q: 'What happens with “Page by page”?', a: 'You get one PDF file for each page of the document, downloaded one after another.' },
      { q: 'Can I split a password-protected PDF?', a: 'Remove the password first (you need to know it) and then split it.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Send only what matters', body: `Extract ${b('the pages someone actually needs')} instead of sending a 100-page document.` },
      { title: 'Related tools', body: `Combine documents with ${a('/en/merge-pdf', 'Merge PDF')} or reduce their size with ${a('/en/compress-pdf', 'Compress PDF')}.` },
    ],
    related: ['unir-pdfs', 'comprimir-pdf', 'pdf-a-jpg', 'pdf-a-word'],
  },
  {
    es: 'word-a-pdf', slug: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert Word documents (.docx) to PDF.',
    longDescription: 'Convert a Word document (.docx) to a PDF with selectable text, keeping headings, paragraphs, lists, tables, images, bold and italics. The conversion runs in your browser, so your documents never leave your device.',
    title: 'Convert Word to PDF Online for Free (DOCX to PDF) | ToolsFoto',
    metaDescription: 'Convert Word documents (.docx) to PDF with tables, images and selectable text. In your browser, no upload. Free and no sign-up.',
    answer: 'Upload your .docx and press “Convert to PDF”: you get an A4 PDF with headings, paragraphs, lists, tables, images and selectable text. Everything happens in your browser.',
    howTo: ['Upload the Word document in .docx format.', 'Press “Convert to PDF”.', 'Download the PDF and check it.'],
    faqs: [
      { q: 'What is kept from the document?', a: 'Headings, paragraphs, bulleted and numbered lists (including nested ones), tables, images, bold and italics. The PDF text is real text you can select and search. Text boxes, shapes, columns and page headers are not transferred.' },
      { q: 'Will it look identical to the original?', a: 'It will be clean and readable, but not pixel-identical: the PDF uses a standard font (Helvetica) and uniform A4 margins. For an exact copy of the layout, use “Save as PDF” in Word or LibreOffice.' },
      { q: 'Does it work with old .doc files?', a: 'No. The old binary .doc format cannot be read in the browser. Open it in Word, LibreOffice or Google Docs, save it as .docx and convert it here.' },
      { q: 'Can I convert Excel or images to PDF?', a: 'Use “JPG to PDF” for images; spreadsheets can be converted with the Excel to PDF tool of the Spanish version of the site.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'A PDF to send, print or submit', body: `PDF looks the same on any device and can’t be changed by accident. It is ${b('what job offers, universities and most platforms ask for')}.` },
      { title: 'Related tools', body: `After converting, ${a('/en/merge-pdf', 'merge it with other PDFs')} or ${a('/en/compress-pdf', 'compress it')}. Going the other way? Use ${a('/en/pdf-to-word', 'PDF to Word')}.` },
    ],
    related: ['pdf-a-word', 'unir-pdfs', 'comprimir-pdf', 'jpg-a-pdf'],
  },
  {
    es: 'pdf-a-excel', slug: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract tables from a PDF into an Excel sheet (.xlsx).',
    longDescription: 'Turn the tables in your PDFs (invoices, bank statements, reports, lists) into an Excel spreadsheet. Rows and columns are detected from the text positions, figures become numbers you can add up, and you can download .xlsx or CSV.',
    title: 'Convert PDF to Excel Online for Free (Tables to XLSX) | ToolsFoto',
    metaDescription: 'Extract tables from invoices, statements and reports in PDF to Excel, with figures as real numbers. Download XLSX or CSV. Free and private.',
    answer: 'Upload the PDF and press “Convert to Excel”: rows and columns are rebuilt from the text positions, figures become numbers and you get an .xlsx (or CSV). Nothing is uploaded.',
    howTo: ['Upload the PDF with the table (invoice, statement, report…).', 'Choose the decimal separator and one sheet per page or all together.', 'Press “Convert to Excel” and check the preview.', 'Open the downloaded .xlsx or also download the CSV.'],
    faqs: [
      { q: 'Can I add up the figures in Excel?', a: 'Yes. With “Convert figures to numbers” turned on, amounts are saved as numbers, not text. Codes with leading zeros (zip codes, references) are kept as text so the zeros are not lost.' },
      { q: 'Which PDFs work best?', a: 'Digitally created ones: invoices, bank statements, reports exported from software or web tables saved as PDF. Scanned PDFs need OCR first.' },
      { q: 'One sheet per page or all in one?', a: '“One per page” creates an Excel tab for each PDF page. “All in one” puts all rows on a single sheet, which is what you want when a table continues over several pages.' },
      { q: 'Which decimal separator should I choose?', a: 'The one used in the PDF: comma (1.234,56) as in most of Europe and Latin America, or point (1,234.56) as in the US and UK.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Stop copying figures by hand', body: `Reconciling a bank statement or summing a quarter’s expenses is much easier in a spreadsheet. Each amount lands ${b('in its own cell, as a number')}.` },
      { title: 'Related tools', body: `If you need the text rather than the tables, use ${a('/en/pdf-to-word', 'PDF to Word')}.` },
    ],
    related: ['pdf-a-word', 'word-a-pdf', 'comprimir-pdf', 'unir-pdfs'],
  },

  // ── Developer ─────────────────────────────────────────────────────────────
  {
    es: 'generar-qr', slug: 'qr-code-generator',
    name: 'QR code generator',
    description: 'Create QR codes for links, text, Wi-Fi and more.',
    longDescription: 'Generate QR codes from any URL or text, choose the size, error correction and colors, and download them as PNG. Free, no sign-up and no expiry: the codes never stop working.',
    title: 'Free QR Code Generator: PNG, Custom Colors | ToolsFoto',
    metaDescription: 'Create QR codes for links or text with custom size, colors and error correction, and download them as PNG. Free, no sign-up, never expire.',
    answer: 'Type a link or text, choose the size and colors and download the QR code as PNG. The codes are generated in your browser and never expire.',
    howTo: ['Type or paste the URL or text.', 'Choose the size and the error correction level.', 'Pick the colors if you want.', 'Download the QR code as PNG.'],
    faqs: [
      { q: 'Do these QR codes expire?', a: 'No. They are static codes: the information is inside the QR itself, with no redirect through any server, so they work forever.' },
      { q: 'Which error correction level should I use?', a: 'M (15%) is fine for most uses. Use Q or H if the code will be printed on surfaces that can get scratched, or if you plan to put a logo over it.' },
      { q: 'Can I change the colors?', a: 'Yes. Keep a dark color on a light background with good contrast; inverted or low-contrast codes may not scan.' },
      { q: 'What size should I print?', a: 'At least 2 × 2 cm, and about one tenth of the scanning distance: for a poster read from 2 meters, around 20 cm.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'From a link to a printable code', body: `Put a QR on ${b('menus, posters, business cards or packaging')} and send people straight to your website or form.` },
      { title: 'Related tools', body: `Format data with ${a('/en/json-formatter', 'JSON formatter')} or create strong passwords with ${a('/en/password-generator', 'Password generator')}.` },
    ],
    related: ['generador-contrasenas', 'formatear-json', 'contador-palabras'],
  },
  {
    es: 'formatear-json', slug: 'json-formatter',
    name: 'JSON formatter',
    description: 'Format, validate and minify JSON.',
    longDescription: 'Beautify JSON with 2 or 4 space indentation, minify it or validate it with a clear error message. Copy or download the result. Everything runs in your browser.',
    title: 'JSON Formatter and Validator Online (Beautify, Minify) | ToolsFoto',
    metaDescription: 'Format JSON with 2 or 4 spaces, minify it or validate it with a clear error message. Free and private: it runs in your browser.',
    answer: 'Paste your JSON and press “Format” to indent it, “Minify” to compact it or “Validate” to check it. Copy or download the result; nothing is sent anywhere.',
    howTo: ['Paste the JSON.', 'Choose format (2 or 4 spaces), minify or validate.', 'Copy or download the result.'],
    faqs: [
      { q: 'How do I know where the error is?', a: 'When the JSON is invalid you get the parser’s message, which usually points to the position of the problem: a missing comma, an extra comma at the end, single quotes instead of double quotes or a missing bracket.' },
      { q: 'What is the difference between formatting and minifying?', a: 'Formatting adds indentation and line breaks to make it readable. Minifying removes every unnecessary space to make the file as small as possible for production.' },
      { q: 'Is my data sent to a server?', a: 'No. Parsing happens in your browser with the native JSON engine, so you can paste API responses or configuration with confidence.' },
      { q: 'Can it handle large files?', a: 'Several megabytes without problems; the limit is your device’s memory.' },
      { q: 'Does it sort keys?', a: 'No, it keeps the original order of the keys, which is what most APIs and configuration files expect.' },
      FREE,
    ],
    sections: [
      { title: 'Readable API responses', body: `Turn a one-line API response into ${b('an indented structure you can actually read')} and spot errors instantly.` },
      { title: 'Related tools', body: `Generate QR codes with ${a('/en/qr-code-generator', 'QR code generator')} or count words with ${a('/en/word-counter', 'Word counter')}.` },
    ],
    related: ['contador-palabras', 'generar-qr', 'generador-contrasenas'],
  },
  {
    es: 'generador-contrasenas', slug: 'password-generator',
    name: 'Password generator',
    description: 'Create strong, random passwords.',
    longDescription: 'Generate strong passwords with the length and character types you choose, using your browser’s cryptographic random generator. Nothing is stored or sent anywhere.',
    title: 'Strong Password Generator, Free and Secure | ToolsFoto',
    metaDescription: 'Generate strong random passwords with the length and characters you choose, using your browser’s cryptographic generator. Nothing is stored.',
    answer: 'Choose the length and the character types and get a strong random password created with your browser’s cryptographic generator. It is never stored or sent anywhere.',
    howTo: ['Choose the length.', 'Select uppercase, lowercase, numbers and symbols.', 'Generate and copy the password.'],
    faqs: [
      { q: 'How long should a password be?', a: 'At least 12 characters, and 16 or more for important accounts. Length matters more than complexity: every extra character multiplies the number of combinations.' },
      { q: 'Is it really random?', a: 'Yes. It uses crypto.getRandomValues, the browser’s cryptographically secure random generator, not Math.random.' },
      { q: 'Are the passwords saved anywhere?', a: 'No. They are generated in your browser and disappear when you close the page. Store them in a password manager.' },
      { q: 'Should I use symbols?', a: 'If the site allows them, yes: they increase the strength. If a site rejects some symbols, generate a longer password with letters and numbers only.' },
      { q: 'Can I use the same password on several sites?', a: 'Never. If one site is breached, attackers try the same password everywhere. Generate a different one for each account.' },
      FREE,
    ],
    sections: [
      { title: 'One strong password per account', body: `Reused passwords are the main cause of hacked accounts. ${b('Generate a unique one in a second')} and keep it in your password manager.` },
      { title: 'Related tools', body: `Create a QR code with ${a('/en/qr-code-generator', 'QR code generator')} or format data with ${a('/en/json-formatter', 'JSON formatter')}.` },
    ],
    related: ['generar-qr', 'formatear-json', 'contador-palabras'],
  },
  {
    es: 'contador-palabras', slug: 'word-counter',
    name: 'Word counter',
    description: 'Count words, characters, sentences and paragraphs.',
    longDescription: 'Count words, characters (with and without spaces), sentences and paragraphs as you type, with an estimated reading time. Ideal for essays, social posts and SEO. Runs in your browser.',
    title: 'Word Counter: Words, Characters and Reading Time | ToolsFoto',
    metaDescription: 'Count words, characters with and without spaces, sentences and paragraphs as you type, plus reading time. Free and private.',
    answer: 'Paste or type your text and see words, characters (with and without spaces), sentences, paragraphs and reading time update instantly. Your text is never sent anywhere.',
    howTo: ['Paste or type your text.', 'Read the counts as you type.', 'Edit until you hit your target length.'],
    faqs: [
      { q: 'How are words counted?', a: 'Any group of characters separated by spaces or line breaks counts as a word, the same way most word processors do.' },
      { q: 'What is the difference between characters with and without spaces?', a: 'Some limits count spaces (social networks, meta descriptions) and others don’t (some academic and translation work). The tool shows both.' },
      { q: 'How is reading time estimated?', a: 'At an average adult reading speed of about 200–250 words per minute.' },
      { q: 'What are the common length limits?', a: 'X (Twitter): 280 characters. Meta descriptions: about 155–160 characters. Instagram captions: 2,200 characters.' },
      PRIVATE,
      FREE,
    ],
    sections: [
      { title: 'Hit the length you need', body: `Essays, cover letters, social posts or SEO descriptions: ${b('know exactly how long your text is')} while you write.` },
      { title: 'Related tools', body: `Format data with ${a('/en/json-formatter', 'JSON formatter')} or generate a ${a('/en/qr-code-generator', 'QR code')} for your text.` },
    ],
    related: ['formatear-json', 'generar-qr', 'generador-contrasenas'],
  },
];

export const EN_BY_ES: Record<string, EnTool> = Object.fromEntries(EN_TOOLS.map((t) => [t.es, t]));
export const EN_BY_SLUG: Record<string, EnTool> = Object.fromEntries(EN_TOOLS.map((t) => [t.slug, t]));

/** Ruta en inglés de una herramienta española, o null si no tiene versión en inglés. */
export function enPath(esSlug: string): string | null {
  const t = EN_BY_ES[esSlug];
  return t ? `/en/${t.slug}` : null;
}
