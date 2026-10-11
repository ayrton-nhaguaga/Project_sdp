import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { categorySchema, idSchema } from '../schemas';
import { CategoryService } from '../services/categoryService';
export const categoryRoutes = new Hono<AppEnv>();
categoryRoutes.get('/', async (c) =>
  c.json({ success: true, data: await new CategoryService(c.env.DB).list() }),
);
categoryRoutes.get('/:id', async (c) =>
  c.json({
    success: true,
    data: await new CategoryService(c.env.DB).get(idSchema.parse(c.req.param('id'))),
  }),
);
categoryRoutes.post('/', async (c) =>
  c.json(
    {
      success: true,
      data: await new CategoryService(c.env.DB).create(categorySchema.parse(await c.req.json())),
    },
    201,
  ),
);
categoryRoutes.put('/:id', async (c) =>
  c.json({
    success: true,
    data: await new CategoryService(c.env.DB).update(
      idSchema.parse(c.req.param('id')),
      categorySchema.parse(await c.req.json()),
    ),
  }),
);
categoryRoutes.delete('/:id', async (c) => {
  await new CategoryService(c.env.DB).delete(idSchema.parse(c.req.param('id')));
  return c.body(null, 204);
});
