import type { ZodType } from 'zod';
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export function queryString(params: object) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.size ? '?' + query.toString() : '';
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
  raw = false,
  schema?: ZodType<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  try {
    const response = await fetch('/api' + path, {
      ...options,
      credentials: 'same-origin',
      signal: controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    if (response.status === 204 && response.ok) return undefined as T;
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw new ApiError(
        'Resposta inesperada. Verifique a ligação e a sessão de acesso.',
        response.status,
      );
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object')
      throw new ApiError('A API devolveu uma resposta inválida.', response.status);
    if (!response.ok) {
      const error = 'error' in body ? body.error : null;
      throw new ApiError(
        error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string'
          ? error.message
          : 'Não foi possível concluir o pedido.',
        response.status,
      );
    }
    if (raw) return body as T;
    if (!('success' in body) || body.success !== true || !('data' in body))
      throw new ApiError('A API devolveu uma resposta inválida.');
    if (schema) {
      const parsed = schema.safeParse(body.data);
      if (!parsed.success) throw new ApiError('A API devolveu dados inválidos.');
      return parsed.data;
    }
    return body.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error && error.name === 'AbortError'
        ? 'O pedido demorou demasiado. Tente novamente.'
        : 'Não foi possível ligar ao servidor. Verifique a sua ligação.',
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
