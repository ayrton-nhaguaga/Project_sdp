import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transactionSchema } from '../../../../shared/schemas';
import type { Transaction } from '../../types';
import { moneySchema, parseMoney, moneyInput, today } from '../../utils/money';
import { useCategories, useSaveTransaction } from '../../hooks/queries';
import { Modal } from '../ui/Modal';
import { Failure, Loading, useToast } from '../ui/Feedback';
export const formSchema = transactionSchema
  .omit({ amountCents: true, categoryId: true })
  .extend({
    amount: moneySchema,
    categoryId: z.string().regex(/^[1-9]\d*$/, 'Seleccione uma categoria.'),
  });
type FormValues = z.infer<typeof formSchema>;
export function TransactionForm({ item, onClose }: { item?: Transaction; onClose: () => void }) {
  const categories = useCategories();
  const save = useSaveTransaction(item?.id);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: item?.type ?? 'EXPENSE',
      description: item?.description ?? '',
      amount: item ? moneyInput(item.amountCents) : '',
      categoryId: item ? String(item.categoryId) : '',
      transactionDate: item?.transactionDate ?? today(),
    },
  });
  const type = watch('type');
  async function submit(value: FormValues) {
    try {
      await save.mutateAsync({
        type: value.type,
        description: value.description,
        amountCents: parseMoney(value.amount),
        categoryId: Number(value.categoryId),
        transactionDate: value.transactionDate,
      });
      toast(item ? 'Transacção actualizada.' : 'Transacção registada.');
      onClose();
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  return (
    <Modal
      title={item ? 'Editar transacção' : 'Nova transacção'}
      onClose={onClose}
      busy={save.isPending}
    >
      {categories.isPending ? (
        <Loading />
      ) : categories.error ? (
        <Failure error={categories.error} retry={() => categories.refetch()} />
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate>
          <fieldset disabled={save.isPending}>
            <legend className="sr-only">Dados da transacção</legend>
            <div className="segmented" role="group" aria-label="Tipo de transacção">
              {(['EXPENSE', 'INCOME'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={type === t}
                  className={type === t ? 'selected ' + t.toLowerCase() : ''}
                  onClick={() => {
                    setValue('type', t);
                    setValue('categoryId', '');
                  }}
                >
                  {t === 'INCOME' ? '↗ Receita' : '↙ Despesa'}
                </button>
              ))}
            </div>
            <label className="field">
              Descrição
              <input
                aria-label="Descrição"
                aria-describedby={errors.description ? 'description-error' : undefined}
                autoFocus
                placeholder="Ex.: Compras da semana"
                {...register('description')}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <span id="description-error" className="field-error">
                  {errors.description.message}
                </span>
              )}
            </label>
            <div className="form-grid">
              <label className="field">
                Valor (MT)
                <input
                  aria-label="Valor (MT)"
                  aria-describedby={errors.amount ? 'amount-error' : undefined}
                  inputMode="decimal"
                  placeholder="0,00"
                  {...register('amount')}
                  aria-invalid={!!errors.amount}
                />
                {errors.amount && (
                  <span id="amount-error" className="field-error">
                    {errors.amount.message}
                  </span>
                )}
              </label>
              <label className="field">
                Data
                <input
                  aria-label="Data"
                  aria-describedby={errors.transactionDate ? 'date-error' : undefined}
                  type="date"
                  {...register('transactionDate')}
                  aria-invalid={!!errors.transactionDate}
                />
                {errors.transactionDate && (
                  <span id="date-error" className="field-error">
                    {errors.transactionDate.message}
                  </span>
                )}
              </label>
            </div>
            <label className="field">
              Categoria
              <select
                aria-label="Categoria"
                aria-describedby={errors.categoryId ? 'category-error' : undefined}
                {...register('categoryId')}
                aria-invalid={!!errors.categoryId}
              >
                <option value="">Seleccione uma categoria</option>
                {categories.data
                  ?.filter((c) => c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              {errors.categoryId && (
                <span id="category-error" className="field-error">
                  {errors.categoryId.message}
                </span>
              )}
            </label>
            {categories.data?.filter((c) => c.type === type).length === 0 && (
              <p className="field-error">Crie uma categoria deste tipo na página Categorias.</p>
            )}
            {save.error && (
              <p role="alert" className="field-error">
                {save.error.message}
              </p>
            )}
            <p className="form-note">
              O valor será guardado em meticais, com precisão de centavos.
            </p>
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={onClose}>
                Cancelar
              </button>
              <button className="button" type="submit">
                {save.isPending ? 'A guardar…' : item ? 'Guardar alterações' : 'Criar transacção'}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </Modal>
  );
}
