import { z } from 'zod';
export const transactionType = z.enum(['INCOME', 'EXPENSE']);
export const idSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .pipe(z.coerce.number<string>().int().positive().max(Number.MAX_SAFE_INTEGER));
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use uma data válida.')
  .refine((value) => {
    const date = new Date(value + 'T00:00:00Z');
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= '1900-01-01' &&
      value <= '9999-12-31'
    );
  }, 'Data inválida.');
export const categorySchema = z
  .object({
    name: z.string().trim().min(2, 'Introduza pelo menos 2 caracteres.').max(60),
    type: transactionType,
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Escolha uma cor válida.'),
  })
  .strict();
export const transactionSchema = z
  .object({
    type: transactionType,
    description: z.string().trim().min(3, 'Introduza pelo menos 3 caracteres.').max(200),
    amountCents: z.number().int().positive().max(100_000_000_000),
    categoryId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    transactionDate: dateSchema,
  })
  .strict();
export const filterSchema = z
  .object({
    type: transactionType.optional(),
    categoryId: idSchema.optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict()
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: 'A data inicial deve preceder a data final.',
    path: ['endDate'],
  });
export const yearSchema = z
  .object({ year: z.coerce.number().int().min(1900).max(9998).default(new Date().getFullYear()) })
  .strict();
export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type Filters = z.infer<typeof filterSchema>;
export interface Category extends CategoryInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}
export interface Transaction extends TransactionInput {
  id: number;
  categoryName: string;
  categoryColor: string;
  createdAt: string;
  updatedAt: string;
}
export interface Summary {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  count: number;
}
export interface Monthly {
  month: string;
  incomeCents: number;
  expenseCents: number;
}
export interface CategoryTotal {
  categoryId: number;
  name: string;
  color: string;
  amountCents: number;
}
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface TransactionList {
  items: Transaction[];
  pagination: Pagination;
}
export const categoryResponseSchema = categorySchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const transactionResponseSchema = transactionSchema.extend({
  id: z.number().int().positive(),
  categoryName: z.string(),
  categoryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const safeCents = z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
export const summaryResponseSchema = z.object({
  incomeCents: safeCents.nonnegative(),
  expenseCents: safeCents.nonnegative(),
  balanceCents: safeCents,
  count: z.number().int().nonnegative(),
});
export const monthlyResponseSchema = z.array(
  z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    incomeCents: safeCents.nonnegative(),
    expenseCents: safeCents.nonnegative(),
  }),
);
export const categoryTotalsResponseSchema = z.array(
  z.object({
    categoryId: z.number().int().positive(),
    name: z.string(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    amountCents: safeCents.nonnegative(),
  }),
);
export const transactionListResponseSchema = z.object({
  items: z.array(transactionResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
