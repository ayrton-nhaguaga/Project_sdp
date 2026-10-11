import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema } from '../../../../shared/schemas';
import type { Category, CategoryInput } from '../../types';
import { useSaveCategory } from '../../hooks/queries';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Feedback';
export function CategoryForm({ item, onClose }: { item?: Category; onClose: () => void }) {
  const save = useSaveCategory(item?.id);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: item?.name ?? '',
      type: item?.type ?? 'EXPENSE',
      color: item?.color ?? '#6366F1',
    },
  });
  async function submit(value: CategoryInput) {
    try {
      await save.mutateAsync(value);
      toast(item ? 'Categoria actualizada.' : 'Categoria criada.');
      onClose();
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  return (
    <Modal
      title={item ? 'Editar categoria' : 'Nova categoria'}
      onClose={onClose}
      busy={save.isPending}
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <fieldset disabled={save.isPending}>
          <legend className="sr-only">Dados da categoria</legend>
          <label className="field">
            Nome
            <input
              aria-label="Nome"
              autoFocus
              placeholder="Ex.: Investimentos"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </label>
          <div className="form-grid">
            <label className="field">
              Tipo
              <select {...register('type')}>
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
              </select>
            </label>
            <label className="field">
              Cor
              <input type="color" {...register('color')} />
              {errors.color && <span className="field-error">{errors.color.message}</span>}
            </label>
          </div>
          {save.error && (
            <p role="alert" className="field-error">
              {save.error.message}
            </p>
          )}
          <p className="form-note">
            Categorias com transacções não podem mudar de tipo nem ser eliminadas.
          </p>
          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="button">
              {save.isPending ? 'A guardar…' : 'Guardar categoria'}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
