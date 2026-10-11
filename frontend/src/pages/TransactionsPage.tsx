import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { useCategories } from '../hooks/queries';
import type { Transaction, Filters } from '../types';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { Empty, Failure, Loading } from '../components/ui/Feedback';
import { DeleteDialog } from '../components/ui/DeleteDialog';
export function TransactionsPage() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<Partial<Filters>>({
    page: 1,
    pageSize: 10,
    startDate: params.get('startDate') ?? '',
    endDate: params.get('endDate') ?? '',
  });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Transaction | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const categories = useCategories();
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((f) => (f.search === search ? f : { ...f, search, page: 1 })),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const invalidDates =
    !!filters.startDate && !!filters.endDate && filters.startDate > filters.endDate;
  const query = useQuery({
    queryKey: ['transactions', filters],
    queryFn: ({ signal }) => transactionService.list(filters, signal),
    enabled: !invalidDates,
  });
  useEffect(() => {
    if (
      query.data &&
      query.data.pagination.totalPages > 0 &&
      (filters.page ?? 1) > query.data.pagination.totalPages
    )
      setFilters((f) => ({ ...f, page: query.data!.pagination.totalPages }));
  }, [query.data, filters.page]);
  function update(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  const newButton = (
    <button className="button" onClick={() => setForm('new')}>
      <Plus size={18} />
      Nova Transacção
    </button>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CADA MOVIMENTO CONTA</div>
          <h1>Transacções</h1>
          <p>Organize as suas receitas e despesas com facilidade.</p>
        </div>
        {newButton}
      </div>
      <section className="panel filters-panel">
        <div className="filter-heading">
          <SlidersHorizontal size={17} />
          <strong>Filtrar movimentos</strong>
          <button
            className="text-button"
            onClick={() => {
              setSearch('');
              setFilters({ page: 1, pageSize: 10 });
            }}
          >
            Limpar filtros
          </button>
        </div>
        <div className="filters">
          <label className="search-field">
            <span className="sr-only">Pesquisar descrição</span>
            <Search size={17} />
            <input
              placeholder="Pesquisar transacções…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={200}
            />
          </label>
          <label className="field compact">
            Tipo
            <select
              value={filters.type ?? ''}
              onChange={(e) =>
                update({
                  type: (e.target.value || undefined) as Filters['type'],
                  categoryId: undefined,
                })
              }
            >
              <option value="">Todos os tipos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
          </label>
          <label className="field compact">
            Categoria
            <select
              disabled={categories.isPending || !!categories.error}
              value={filters.categoryId ?? ''}
              onChange={(e) =>
                update({ categoryId: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">Todas as categorias</option>
              {categories.data
                ?.filter((c) => !filters.type || c.type === filters.type)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field compact">
            De
            <input
              type="date"
              value={filters.startDate ?? ''}
              onChange={(e) => update({ startDate: e.target.value })}
            />
          </label>
          <label className="field compact">
            Até
            <input
              type="date"
              value={filters.endDate ?? ''}
              onChange={(e) => update({ endDate: e.target.value })}
            />
          </label>
        </div>
        {invalidDates && (
          <p className="field-error" role="alert">
            A data inicial deve preceder a data final.
          </p>
        )}
        {categories.error && (
          <p className="field-error">
            Não foi possível carregar as categorias.{' '}
            <button className="text-button" onClick={() => categories.refetch()}>
              Tentar novamente
            </button>
          </p>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Todos os movimentos</h2>
            <p>
              {query.data
                ? query.data.pagination.total + ' transacções encontradas'
                : 'Os seus registos financeiros'}
            </p>
          </div>
          <span className="small-tag">MZN · Metical</span>
        </div>
        {invalidDates ? (
          <Empty
            title="Verifique o período"
            message="Corrija as datas para consultar os movimentos."
          />
        ) : query.isPending ? (
          <Loading />
        ) : query.error ? (
          <Failure error={query.error} retry={() => query.refetch()} />
        ) : query.data?.items.length ? (
          <TransactionTable items={query.data.items} onEdit={setForm} onDelete={setDeleting} />
        ) : (
          <Empty
            title="Nenhuma transacção encontrada"
            message="Ajuste os filtros ou registe um novo movimento."
            action={newButton}
          />
        )}
        {query.data && !invalidDates && query.data.pagination.total > 0 && (
          <div className="pagination">
            <span>
              Página {query.data.pagination.page} de {query.data.pagination.totalPages}
            </span>
            <div>
              <button
                className="button secondary small"
                disabled={(filters.page ?? 1) <= 1 || query.isFetching}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <button
                className="button secondary small"
                disabled={
                  (filters.page ?? 1) >= query.data.pagination.totalPages || query.isFetching
                }
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Seguinte
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
      {form && (
        <TransactionForm item={form === 'new' ? undefined : form} onClose={() => setForm(null)} />
      )}{' '}
      {deleting && (
        <DeleteDialog
          name={deleting.description}
          remove={() => transactionService.remove(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
