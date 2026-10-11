import { request } from './api';
import { categoryResponseSchema } from '../../../shared/schemas';
import type { Category, CategoryInput } from '../types';
export const categoryService = {
  list: (signal?: AbortSignal) =>
    request<Category[]>('/categories', { signal }, false, categoryResponseSchema.array()),
  save: (value: CategoryInput, id?: number) =>
    request<Category>(
      '/categories' + (id ? '/' + id : ''),
      { method: id ? 'PUT' : 'POST', body: JSON.stringify(value) },
      false,
      categoryResponseSchema,
    ),
  remove: (id: number) => request<void>('/categories/' + id, { method: 'DELETE' }),
};
