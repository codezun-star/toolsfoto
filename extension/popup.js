// Accesos directos de la ventana emergente: las herramientas más usadas.
const POPULAR = [
  ['comprimir', 'Comprimir imagen'],
  ['eliminar-fondo', 'Quitar fondo'],
  ['pdf-a-word', 'PDF a Word'],
  ['unir-pdfs', 'Unir PDFs'],
  ['comprimir-pdf', 'Comprimir PDF'],
  ['imagen-a-texto', 'Imagen a texto'],
  ['comprimir-video', 'Comprimir vídeo'],
  ['generar-qr', 'Generar QR'],
];
const nav = document.getElementById('tools');
for (const [slug, label] of POPULAR) {
  const a = document.createElement('a');
  a.href = `https://toolsfoto.com/${slug}?utm_source=extension`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = label;
  nav.appendChild(a);
}
