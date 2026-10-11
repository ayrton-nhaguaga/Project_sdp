import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import type { TransactionInput, CategoryInput } from '../types';
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => categoryService.list(signal),
  });
}
export function useSaveTransaction(id?: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: TransactionInput) => transactionService.save(value, id),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['transactions'] }),
        client.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}
export function useSaveCategory(id?: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: CategoryInput) => categoryService.save(value, id),
    onSuccess: async () => {
      await Promise.all(
        ['categories', 'transactions', 'dashboard'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
