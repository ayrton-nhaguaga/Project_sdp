import { request, queryString } from './api';
import {
  summaryResponseSchema,
  monthlyResponseSchema,
  categoryTotalsResponseSchema,
  transactionResponseSchema,
} from '../../../shared/schemas';
import type { Summary, Monthly, CategoryTotal, Transaction } from '../types';
export const dashboardService = {
  summary: (year: number, signal?: AbortSignal) =>
    request<Summary>(
      '/dashboard/summary' + queryString({ startDate: year + '-01-01', endDate: year + '-12-31' }),
      { signal },
      false,
      summaryResponseSchema,
    ),
  monthly: (year: number, signal?: AbortSignal) =>
    request<Monthly[]>(
      '/dashboard/monthly' + queryString({ year }),
      { signal },
      false,
      monthlyResponseSchema,
    ),
  categories: (year: number, signal?: AbortSignal) =>
    request<CategoryTotal[]>(
      '/dashboard/categories' +
        queryString({ startDate: year + '-01-01', endDate: year + '-12-31' }),
      { signal },
      false,
      categoryTotalsResponseSchema,
    ),
  recent: (year: number, signal?: AbortSignal) =>
    request<Transaction[]>(
      '/dashboard/recent-transactions' +
        queryString({ startDate: year + '-01-01', endDate: year + '-12-31' }),
      { signal },
      false,
      transactionResponseSchema.array(),
    ),
  health: async (signal?: AbortSignal) => {
    const start = performance.now();
    const data = await request<{ status: string }>('/health', { signal }, true);
    if (data.status !== 'UP') throw new Error('API indisponível.');
    return { latency: Math.round(performance.now() - start), status: data.status };
  },
};
