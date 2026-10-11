import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { transactionSchema, filterSchema, idSchema } from '../schemas';
import { TransactionService } from '../services/transactionService';
export const transactionRoutes = new Hono<AppEnv>();
transactionRoutes.get('/', async (c) =>
  c.json({
    success: true,
    data: await new TransactionService(c.env.DB).list(filterSchema.parse(c.req.query())),
  }),
);
transactionRoutes.get('/:id', async (c) =>
  c.json({
    success: true,
    data: await new TransactionService(c.env.DB).get(idSchema.parse(c.req.param('id'))),
  }),
);
transactionRoutes.post('/', async (c) =>
  c.json(
    {
      success: true,
      data: await new TransactionService(c.env.DB).create(
        transactionSchema.parse(await c.req.json()),
      ),
    },
    201,
  ),
);
transactionRoutes.put('/:id', async (c) =>
  c.json({
    success: true,
    data: await new TransactionService(c.env.DB).update(
      idSchema.parse(c.req.param('id')),
      transactionSchema.parse(await c.req.json()),
    ),
  }),
);
transactionRoutes.delete('/:id', async (c) => {
  await new TransactionService(c.env.DB).delete(idSchema.parse(c.req.param('id')));
  return c.body(null, 204);
});
