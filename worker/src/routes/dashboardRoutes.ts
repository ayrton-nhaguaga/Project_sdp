import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { filterSchema, yearSchema } from '../schemas';
import { DashboardService } from '../services/dashboardService';
export const dashboardRoutes = new Hono<AppEnv>();
dashboardRoutes.get('/summary', async (c) =>
  c.json({
    success: true,
    data: await new DashboardService(c.env.DB).summary(filterSchema.parse(c.req.query())),
  }),
);
dashboardRoutes.get('/monthly', async (c) =>
  c.json({
    success: true,
    data: await new DashboardService(c.env.DB).monthly(yearSchema.parse(c.req.query()).year),
  }),
);
dashboardRoutes.get('/categories', async (c) =>
  c.json({
    success: true,
    data: await new DashboardService(c.env.DB).categories(filterSchema.parse(c.req.query())),
  }),
);
dashboardRoutes.get('/recent-transactions', async (c) =>
  c.json({
    success: true,
    data: await new DashboardService(c.env.DB).recent(filterSchema.parse(c.req.query())),
  }),
);
