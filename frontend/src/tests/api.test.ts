import { it, expect, vi } from 'vitest';
import { request } from '../services/api';
it('rejects invalid JSON envelopes', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ foo: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
  );
  await expect(request('/health')).rejects.toThrow('resposta inválida');
});
it('handles a login HTML response and network failure', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(new Response('<html/>', { headers: { 'Content-Type': 'text/html' } })),
  );
  await expect(request('/categories')).rejects.toThrow('Resposta inesperada');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network')));
  await expect(request('/categories')).rejects.toThrow('ligar ao servidor');
});
it('preserves server conflict messages', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: { message: 'Categoria em uso.' } }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
  );
  await expect(request('/categories/1', { method: 'DELETE' })).rejects.toThrow('Categoria em uso.');
});
it('rejects malformed financial data inside a successful envelope', async () => {
  const { transactionService } = await import('../services/transactionService');
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { items: [{ amountCents: 'invalid' }], pagination: {} },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      ),
  );
  await expect(transactionService.list({})).rejects.toThrow('dados inválidos');
});
