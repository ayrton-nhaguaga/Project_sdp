import { request, queryString } from './api';
import { transactionListResponseSchema, transactionResponseSchema } from '../../../shared/schemas';
import type { Filters, Transaction, TransactionInput, TransactionList } from '../types';
export const transactionService = {
  list: (filters: Partial<Filters>, signal?: AbortSignal) =>
    request<TransactionList>(
      '/transactions' + queryString(filters),
      { signal },
      false,
      transactionListResponseSchema,
    ),
  save: (value: TransactionInput, id?: number) =>
    request<Transaction>(
      '/transactions' + (id ? '/' + id : ''),
      { method: id ? 'PUT' : 'POST', body: JSON.stringify(value) },
      false,
      transactionResponseSchema,
    ),
  remove: (id: number) => request<void>('/transactions/' + id, { method: 'DELETE' }),
};
