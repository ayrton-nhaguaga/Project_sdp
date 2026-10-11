import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { AppEnv } from './types';
import { errorHandler, AppError } from './middlewares/errors';
import { security } from './middlewares/security';
import { transactionRoutes } from './routes/transactionRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
const app = new Hono<AppEnv>();
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  const start = performance.now();
  c.set('requestId', requestId);
  await next();
  c.header('X-Request-Id', requestId);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'same-origin');
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  c.header('Cache-Control', 'no-store');
  const pathname = new URL(c.req.url).pathname;
  const route = pathname.replace(/\d+/g, ':id');
  console.log(
    JSON.stringify({
      event: 'http_request',
      requestId,
      method: c.req.method,
      route: route.startsWith('/api/') ? route : 'asset',
      status: c.res.status,
      durationMs: Math.round(performance.now() - start),
    }),
  );
});
app.use('*', security);
app.use(
  '/api/*',
  bodyLimit({
    maxSize: 16_384,
    onError: () => {
      throw new AppError(400, 'BODY_TOO_LARGE', 'O pedido excede o tamanho permitido.');
    },
  }),
);
app.get('/api/health', async (c) => {
  await c.env.DB.prepare('SELECT 1').first();
  return c.json({
    status: 'UP',
    application: 'CloudExpense',
    architecture: 'Serverless',
    provider: 'Cloudflare Workers',
  });
});
app.route('/api/transactions', transactionRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.all('/api/*', () => {
  throw new AppError(404, 'NOT_FOUND', 'Endpoint não encontrado.');
});
app.all('*', (c) => {
  if (new URL(c.req.url).pathname === '/api')
    throw new AppError(404, 'NOT_FOUND', 'Endpoint não encontrado.');
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw);
  throw new AppError(404, 'NOT_FOUND', 'Recurso não encontrado.');
});
app.onError(errorHandler);
export default app;
