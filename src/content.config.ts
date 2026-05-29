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
    keywords: z.array(z.string()),
    autor: z.string().default('Equipo ToolsFoto'),
    publicado: z.boolean().default(true),
  }),
});

export const collections = { blog };
