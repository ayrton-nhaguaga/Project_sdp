import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AppEnv } from '../types';
import { AppError } from './errors';
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export const security = createMiddleware<AppEnv>(async (c, next) => {
  const url = new URL(c.req.url);
  const local =
    c.env.APP_ENV === 'development' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!local) {
    const team = c.env.ACCESS_TEAM_DOMAIN;
    const audience = c.env.ACCESS_AUD;
    if (!team || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team) || !audience)
      throw new AppError(
        503,
        'ACCESS_NOT_CONFIGURED',
        'O acesso à demonstração ainda não foi configurado.',
      );
    const token = c.req.header('Cf-Access-Jwt-Assertion');
    if (!token)
      throw new AppError(
        401,
        'ACCESS_REQUIRED',
        'Entre através do Cloudflare Access para aceder à demonstração.',
      );
    let keys = keySets.get(team);
    if (!keys) {
      keys = createRemoteJWKSet(new URL('https://' + team + '/cdn-cgi/access/certs'));
      keySets.set(team, keys);
    }
    try {
      await jwtVerify(token, keys, { issuer: 'https://' + team, audience, algorithms: ['RS256'] });
    } catch {
      throw new AppError(401, 'ACCESS_DENIED', 'A sessão de acesso expirou ou é inválida.');
    }
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('Origin');
    const allowedLocal =
      local && ['http://127.0.0.1:5173', 'http://localhost:5173'].includes(origin ?? '');
    if (origin && origin !== url.origin && !allowedLocal)
      throw new AppError(403, 'ORIGIN_DENIED', 'Origem não autorizada.');
    if (c.req.header('Sec-Fetch-Site') === 'cross-site')
      throw new AppError(403, 'ORIGIN_DENIED', 'Origem não autorizada.');
  }
  await next();
});
