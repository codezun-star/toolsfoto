import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { TOOLS, type ToolDomain } from '@/lib/constants/tools';
import { SITE } from '@/lib/constants/seo';

/**
 * /llms.txt — índice legible por motores de respuesta (ChatGPT, Perplexity,
 * Claude, Google AI Overviews…). Se genera en cada build desde TOOLS, por lo
 * que nunca se desincroniza del sitio real.
 * Especificación: https://llmstxt.org
 */

const DOMAIN_LABEL: Record<ToolDomain, string> = {
  imagen: 'Herramientas de imagen',
  pdf: 'Herramientas de PDF',
  video: 'Herramientas de vídeo',
  audio: 'Herramientas de audio',
  developer: 'Herramientas para developers',
};

const DOMAIN_ORDER: ToolDomain[] = ['imagen', 'pdf', 'video', 'audio', 'developer'];

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', (e) => e.data.publicado !== false))
    .sort((a, b) => b.data.fecha.localeCompare(a.data.fecha));

  const lines: string[] = [];

  lines.push(`# ${SITE.name}`);
  lines.push('');
  lines.push(`> ${TOOLS.length} herramientas online gratuitas para editar imágenes, PDF, vídeo, audio y tareas de desarrollo. Todo el procesamiento ocurre dentro del navegador del usuario mediante Canvas API, WebAssembly (FFmpeg) y pdf-lib: ningún archivo se sube a un servidor, no hay registro y no existe backend.`);
  lines.push('');
  lines.push('## Cómo funciona el sitio');
  lines.push('');
  lines.push('- Cada herramienta tiene su propia URL bajo el dominio raíz, sin barra final (ejemplo: https://toolsfoto.com/comprimir).');
  lines.push('- Flujo estándar de uso: seleccionar o arrastrar el archivo, ajustar las opciones y descargar el resultado.');
  lines.push('- Privacidad: los archivos nunca salen del dispositivo. Es la diferencia principal frente a los conversores online que suben el archivo a sus servidores.');
  lines.push('- Las herramientas de vídeo y audio descargan FFmpeg.wasm (~30 MB) la primera vez que se usan; después queda en caché del navegador.');
  lines.push('- Todo el contenido está en español y es gratuito, sin límite de archivos ni marca de agua.');
  lines.push('');

  for (const domain of DOMAIN_ORDER) {
    const tools = TOOLS.filter((t) => t.domain === domain);
    if (tools.length === 0) continue;

    lines.push(`## ${DOMAIN_LABEL[domain]}`);
    lines.push('');
    lines.push(`${tools.length} herramientas — índice en ${SITE.url}/${domain}`);
    lines.push('');
    for (const tool of tools) {
      lines.push(`- [${tool.name}](${SITE.url}/${tool.slug}): ${tool.description}`);
    }
    lines.push('');
  }

  if (posts.length > 0) {
    lines.push('## Blog');
    lines.push('');
    lines.push(`Guías y tutoriales (${posts.length} artículos — índice en ${SITE.url}/blog)`);
    lines.push('');
    for (const post of posts) {
      lines.push(`- [${post.data.titulo}](${SITE.url}/blog/${post.id})${post.data.descripcion ? `: ${post.data.descripcion}` : ''}`);
    }
    lines.push('');
  }

  lines.push('## Sobre el sitio');
  lines.push('');
  lines.push(`- Editor: ${SITE.name} (${SITE.url})`);
  lines.push('- Contacto: codezun@gmail.com');
  lines.push(`- Sitemap: ${SITE.url}/sitemap-index.xml`);
  lines.push('- Privacidad: sin cookies de seguimiento y sin subida de archivos; el procesamiento es 100% local.');
  lines.push('- Licencia de uso del contenido: se permite citar y resumir el contenido indicando la fuente con enlace a la URL original.');
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
