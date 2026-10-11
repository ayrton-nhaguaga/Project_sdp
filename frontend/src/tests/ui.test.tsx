import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { DeleteDialog } from '../components/ui/DeleteDialog';
import { ToastProvider } from '../components/ui/Feedback';
import { dashboardService } from '../services/dashboardService';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
function mount(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>{node}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}
function mockDashboard() {
  vi.spyOn(dashboardService, 'summary').mockResolvedValue({
    incomeCents: 0,
    expenseCents: 0,
    balanceCents: 0,
    count: 0,
  });
  vi.spyOn(dashboardService, 'monthly').mockResolvedValue([]);
  vi.spyOn(dashboardService, 'categories').mockResolvedValue([]);
  vi.spyOn(dashboardService, 'recent').mockResolvedValue([]);
  vi.spyOn(dashboardService, 'health').mockResolvedValue({ status: 'UP', latency: 10 });
}
describe('Main interactions', () => {
  it('renders dashboard loading then empty state with real zero totals', async () => {
    mockDashboard();
    mount(<DashboardPage />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'A carregar dashboard…' })).toBeInTheDocument();
    expect(await screen.findByText('Um novo começo')).toBeInTheDocument();
    expect(screen.getAllByText('0,00 MT')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Ver todas/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/transactions?startDate='),
    );
  });
  it('shows connection errors and allows retry', async () => {
    mockDashboard();
    vi.spyOn(dashboardService, 'summary').mockRejectedValue(new Error('Ligação indisponível.'));
    mount(<DashboardPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Ligação indisponível.');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
  it('validates form then posts cents with a compatible category', async () => {
    vi.spyOn(categoryService, 'list').mockResolvedValue([
      { id: 1, name: 'Salário', type: 'INCOME', color: '#10B981', createdAt: '', updatedAt: '' },
      {
        id: 4,
        name: 'Alimentação',
        type: 'EXPENSE',
        color: '#6366F1',
        createdAt: '',
        updatedAt: '',
      },
    ]);
    const save = vi
      .spyOn(transactionService, 'save')
      .mockResolvedValue({
        id: 1,
        type: 'INCOME',
        description: 'Salário mensal',
        amountCents: 2500000,
        categoryId: 1,
        categoryName: 'Salário',
        categoryColor: '#10B981',
        transactionDate: '2026-10-01',
        createdAt: '',
        updatedAt: '',
      });
    const close = vi.fn();
    const user = userEvent.setup();
    mount(<TransactionForm onClose={close} />);
    await screen.findByLabelText('Descrição');
    await user.click(screen.getByRole('button', { name: 'Criar transacção' }));
    expect(await screen.findByText('Introduza pelo menos 3 caracteres.')).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /Receita/ }));
    expect(screen.queryByRole('option', { name: 'Alimentação' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Descrição'), 'Salário mensal');
    await user.type(screen.getByLabelText('Valor (MT)'), '25000');
    await user.selectOptions(screen.getByLabelText('Categoria'), '1');
    await user.click(screen.getByRole('button', { name: 'Criar transacção' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: 2500000, type: 'INCOME', categoryId: 1 }),
        undefined,
      ),
    );
    await waitFor(() => expect(close).toHaveBeenCalled());
  });
  it('requires explicit confirmation before deletion', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();
    const user = userEvent.setup();
    mount(<DeleteDialog name="Compras" remove={remove} onClose={close} />);
    expect(remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Sim, eliminar' }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(close).toHaveBeenCalled());
  });
});
