import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string().optional(),
    categoria: z
      .enum(['herramientas', 'tips', 'tutoriales', 'actualizaciones', 'general'])
      .default('general'),
    fecha: z.string(),
    // Fecha de última revisión (ISO "YYYY-MM-DD"). Alimenta `dateModified`
    // del schema Article. Si se omite se usa `fecha`. Nunca se renderiza.
    actualizado: z.string().optional(),
    // Slugs de herramientas relacionadas. Se pintan al final del artículo.
    // Deben existir en `TOOLS`: el build falla si no (ver blog/[slug].astro).
    herramientas: z.array(z.string()).default([]),
    keywords: z.array(z.string()),
    autor: z.string().default('Equipo ToolsFoto'),
    publicado: z.boolean().default(true),
  }),
});

export const collections = { blog };
