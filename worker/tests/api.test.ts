import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { env, SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';
import type {
  Category,
  Transaction,
  Summary,
  TransactionList,
  Monthly,
  CategoryTotal,
} from '../../shared/schemas';
async function call(path: string, method = 'GET', body?: unknown) {
  return SELF.fetch('http://localhost/api' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function data<T>(response: Response) {
  return ((await response.json()) as { data: T }).data;
}
const income = {
  type: 'INCOME',
  categoryId: 1,
  amountCents: 2_500_000,
  description: 'Salário mensal',
  transactionDate: '2026-10-05',
};
const expense = {
  type: 'EXPENSE',
  categoryId: 4,
  amountCents: 500_000,
  description: 'Compras do mês',
  transactionDate: '2026-10-07',
};
beforeEach(async () => {
  await env.DB.prepare('DELETE FROM transactions').run();
  await env.DB.prepare('DELETE FROM categories WHERE id>11').run();
});
describe('CloudExpense Worker + D1', () => {
  it('checks the worker and database health', async () => {
    const response = await call('/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'UP',
      application: 'CloudExpense',
      architecture: 'Serverless',
      provider: 'Cloudflare Workers',
    });
  });
  it('seeds exactly 11 categories', async () => {
    expect(await data<Category[]>(await call('/categories'))).toHaveLength(11);
  });
  it('creates, reads, edits and deletes an unused category', async () => {
    const created = await call('/categories', 'POST', {
      name: 'Investimentos',
      type: 'INCOME',
      color: '#6366F1',
    });
    expect(created.status).toBe(201);
    const category = await data<Category>(created);
    expect((await data<Category>(await call('/categories/' + category.id))).name).toBe(
      'Investimentos',
    );
    expect(
      (
        await call('/categories/' + category.id, 'PUT', {
          name: 'Juros',
          type: 'INCOME',
          color: '#10B981',
        })
      ).status,
    ).toBe(200);
    expect((await call('/categories/' + category.id, 'DELETE')).status).toBe(204);
    expect((await call('/categories/' + category.id)).status).toBe(404);
  });
  it('rejects duplicate categories', async () => {
    expect(
      (await call('/categories', 'POST', { name: 'Salário', type: 'INCOME', color: '#6366F1' }))
        .status,
    ).toBe(409);
  });
  it('persists income and expense, computes the requested balance, edits and deletes', async () => {
    const created = await call('/transactions', 'POST', income);
    expect(created.status).toBe(201);
    const first = await data<Transaction>(created);
    expect((await call('/transactions', 'POST', expense)).status).toBe(201);
    expect((await data<Transaction>(await call('/transactions/' + first.id))).amountCents).toBe(
      2_500_000,
    );
    expect(await data<Summary>(await call('/dashboard/summary'))).toEqual({
      incomeCents: 2_500_000,
      expenseCents: 500_000,
      balanceCents: 2_000_000,
      count: 2,
    });
    expect(
      (await call('/transactions/' + first.id, 'PUT', { ...income, amountCents: 3_000_000 }))
        .status,
    ).toBe(200);
    expect((await data<Summary>(await call('/dashboard/summary'))).balanceCents).toBe(2_500_000);
    expect((await call('/transactions/' + first.id, 'DELETE')).status).toBe(204);
    expect((await data<Summary>(await call('/dashboard/summary'))).balanceCents).toBe(-500_000);
    expect((await call('/transactions/' + first.id)).status).toBe(404);
  });
  it.each([0, -1, 1.5, 100_000_000_001, '1500', null])(
    'rejects invalid amount %s',
    async (amountCents) => {
      const response = await call('/transactions', 'POST', { ...income, amountCents });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    },
  );
  it.each(['2026-02-30', '2026-13-01', '2025-02-29', '10/10/2026', ''])(
    'rejects invalid date %s',
    async (transactionDate) => {
      expect((await call('/transactions', 'POST', { ...income, transactionDate })).status).toBe(
        400,
      );
    },
  );
  it('rejects nonexistent and incompatible categories', async () => {
    expect((await call('/transactions', 'POST', { ...income, categoryId: 999999 })).status).toBe(
      400,
    );
    expect((await call('/transactions', 'POST', { ...income, categoryId: 4 })).status).toBe(400);
  });
  it.each(['0', '-1', '1.5', 'NaN', 'Infinity', '9007199254740992', '1e2', '0x10'])(
    'rejects invalid id %s',
    async (id) => {
      expect((await call('/transactions/' + id)).status).toBe(400);
    },
  );
  it('combines filters and pagination using the same report criteria', async () => {
    await call('/transactions', 'POST', income);
    await call('/transactions', 'POST', expense);
    await call('/transactions', 'POST', {
      ...expense,
      description: 'Compras extra',
      transactionDate: '2026-10-08',
    });
    const filters =
      'type=EXPENSE&categoryId=4&startDate=2026-10-01&endDate=2026-10-31&search=Compras';
    const list = await data<TransactionList>(
      await call('/transactions?' + filters + '&pageSize=1&page=2'),
    );
    expect(list.items).toHaveLength(1);
    expect(list.pagination).toEqual({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
    expect((await data<Summary>(await call('/dashboard/summary?' + filters))).expenseCents).toBe(
      1_000_000,
    );
    expect(
      (await data<TransactionList>(await call('/transactions?search=%25'))).items,
    ).toHaveLength(0);
    expect((await call('/transactions?startDate=2026-12-01&endDate=2026-01-01')).status).toBe(400);
    expect((await call('/transactions?pageSize=101')).status).toBe(400);
  });
  it('groups real monthly and category totals and caps recent records at five', async () => {
    await call('/transactions', 'POST', income);
    for (let i = 1; i <= 6; i++)
      await call('/transactions', 'POST', { ...expense, transactionDate: '2026-10-0' + i });
    const months = await data<Monthly[]>(await call('/dashboard/monthly?year=2026'));
    expect(months).toHaveLength(12);
    expect(months[9]).toEqual({
      month: '2026-10',
      incomeCents: 2_500_000,
      expenseCents: 3_000_000,
    });
    expect((await data<CategoryTotal[]>(await call('/dashboard/categories')))[0]).toMatchObject({
      categoryId: 4,
      amountCents: 3_000_000,
    });
    expect(await data<Transaction[]>(await call('/dashboard/recent-transactions'))).toHaveLength(5);
    expect(
      (
        await data<Summary>(
          await call('/dashboard/summary?startDate=2025-01-01&endDate=2025-12-31'),
        )
      ).count,
    ).toBe(0);
  });
  it('protects category references in API and database even without service checks', async () => {
    await call('/transactions', 'POST', income);
    expect((await call('/categories/1', 'DELETE')).status).toBe(409);
    expect(
      (await call('/categories/1', 'PUT', { name: 'Salário', type: 'EXPENSE', color: '#10B981' }))
        .status,
    ).toBe(409);
    await expect(env.DB.prepare('DELETE FROM categories WHERE id=1').run()).rejects.toThrow();
    await expect(
      env.DB.prepare("UPDATE categories SET type='EXPENSE' WHERE id=1").run(),
    ).rejects.toThrow();
    await expect(
      env.DB.prepare(
        "INSERT INTO transactions(category_id,type,amount,description,transaction_date) VALUES(4,'INCOME',100,'Mismatch','2026-10-01')",
      ).run(),
    ).rejects.toThrow();
    await expect(
      env.DB.prepare(
        "INSERT INTO transactions(category_id,type,amount,description,transaction_date) VALUES(999,'INCOME',100,'Missing','2026-10-01')",
      ).run(),
    ).rejects.toThrow();
    await expect(
      env.DB.prepare(
        "INSERT INTO transactions(category_id,type,amount,description,transaction_date) VALUES(1,'INCOME',1.5,'Decimal','2026-10-01')",
      ).run(),
    ).rejects.toThrow();
  });
  it('returns standard errors for malformed JSON, missing records and unknown endpoints', async () => {
    const malformed = await SELF.fetch('http://localhost/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    expect(malformed.status).toBe(400);
    expect((await call('/transactions/999999', 'DELETE')).status).toBe(404);
    const missing = await call('/unknown');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND', details: [] },
    });
  });
  it('blocks cross-origin writes', async () => {
    const response = await SELF.fetch('http://localhost/api/categories', {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Blocked', type: 'INCOME', color: '#6366F1' }),
    });
    expect(response.status).toBe(403);
  });
  it('fails closed in production, including static assets and spoofed development host', async () => {
    const response = await app.fetch(new Request('https://demo.example/api/health'), {
      DB: env.DB,
      APP_ENV: 'production',
    });
    expect(response.status).toBe(503);
    expect(
      (
        await app.fetch(new Request('https://demo.example/'), {
          DB: env.DB,
          APP_ENV: 'development',
        })
      ).status,
    ).toBe(503);
    const configured = {
      DB: env.DB,
      APP_ENV: 'production',
      ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com',
      ACCESS_AUD: 'expected',
    };
    expect(
      (await app.fetch(new Request('https://demo.example/api/health'), configured)).status,
    ).toBe(401);
  });
});
it('cryptographically verifies Access signature, audience and expiry', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test-key';
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  const issuer = 'https://verification.cloudflareaccess.com';
  const mocked = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(
      new Response(JSON.stringify({ keys: [jwk] }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  const bindings = {
    DB: env.DB,
    APP_ENV: 'production',
    ACCESS_TEAM_DOMAIN: 'verification.cloudflareaccess.com',
    ACCESS_AUD: 'demo-audience',
  };
  async function token(audience: string, expiration: number) {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(privateKey);
  }
  async function access(jwt: string) {
    return app.fetch(
      new Request('https://demo.example/api/health', {
        headers: { 'Cf-Access-Jwt-Assertion': jwt },
      }),
      bindings,
    );
  }
  try {
    const future = Math.floor(Date.now() / 1000) + 300;
    expect((await access(await token('demo-audience', future))).status).toBe(200);
    expect((await access(await token('wrong-audience', future))).status).toBe(401);
    expect((await access(await token('demo-audience', 1))).status).toBe(401);
    expect((await access('forged.payload.signature')).status).toBe(401);
  } finally {
    mocked.mockRestore();
  }
});
