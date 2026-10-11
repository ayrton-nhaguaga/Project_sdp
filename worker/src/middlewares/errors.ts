import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import type { AppEnv } from '../types';
export class AppError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 503,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
  if (error instanceof ZodError)
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados fornecidos são inválidos.',
          details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
      },
      400,
    );
  if (error instanceof AppError)
    return c.json(
      { success: false, error: { code: error.code, message: error.message, details: [] } },
      error.status,
    );
  if (error instanceof SyntaxError)
    return c.json(
      {
        success: false,
        error: { code: 'INVALID_JSON', message: 'O corpo JSON é inválido.', details: [] },
      },
      400,
    );
  // Classify database errors without exposing their contents or logging query values.
  if (/FOREIGN KEY|UNIQUE constraint|CATEGORY_TYPE_CONFLICT|CATEGORY_IN_USE/.test(error.message))
    return c.json(
      {
        success: false,
        error: {
          code: 'INTEGRITY_CONFLICT',
          message:
            'Operação incompatível com os dados existentes. Verifique a categoria e as transacções associadas.',
          details: [],
        },
      },
      409,
    );
  if (/CHECK constraint/.test(error.message))
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados violam uma regra de integridade.',
          details: [],
        },
      },
      400,
    );
  console.error(JSON.stringify({ event: 'unhandled_error', requestId: c.get('requestId') }));
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível concluir a operação. Tente novamente.',
        details: [],
      },
    },
    500,
  );
};
