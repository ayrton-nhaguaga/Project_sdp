import { useState } from 'react';
import { Plus, Shapes, Pencil, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useCategories } from '../hooks/queries';
import type { Category } from '../types';
import { CategoryForm } from '../components/categories/CategoryForm';
import { DeleteDialog } from '../components/ui/DeleteDialog';
import { Empty, Failure, Loading } from '../components/ui/Feedback';
import { categoryService } from '../services/categoryService';
export function CategoriesPage() {
  const query = useCategories();
  const [form, setForm] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">UM LUGAR PARA CADA MOVIMENTO</div>
          <h1>Categorias</h1>
          <p>Dê mais significado à forma como organiza o seu dinheiro.</p>
        </div>
        <button className="button" onClick={() => setForm('new')}>
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => query.refetch()} />
      ) : (
        ['INCOME', 'EXPENSE'].map((type) => (
          <section className="category-section" key={type}>
            <div className="category-section-heading">
              <h2>
                {type === 'INCOME' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}{' '}
                {type === 'INCOME' ? 'Receitas' : 'Despesas'}
              </h2>
              <span className="small-tag">
                {query.data?.filter((c) => c.type === type).length} categorias
              </span>
            </div>
            <div className="categories-grid">
              {query.data
                ?.filter((c) => c.type === type)
                .map((c) => (
                  <article key={c.id} className="category-card">
                    <span
                      className="category-card-icon"
                      style={{ background: c.color + '15', color: c.color }}
                    >
                      <Shapes size={22} />
                    </span>
                    <div>
                      <h3>{c.name}</h3>
                      <span className="muted">{type === 'INCOME' ? 'Receita' : 'Despesa'}</span>
                    </div>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={'Editar ' + c.name}
                        onClick={() => setForm(c)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button delete-action"
                        aria-label={'Eliminar ' + c.name}
                        onClick={() => setDeleting(c)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
            {!query.data?.some((c) => c.type === type) && (
              <Empty
                title="Ainda não há categorias deste tipo"
                message="Crie uma categoria para organizar os seus movimentos."
              />
            )}
          </section>
        ))
      )}
      <div className="info-banner">
        <Shapes size={20} />
        <p>
          As categorias ajudam a compreender os seus hábitos. Para preservar o histórico, uma
          categoria com transacções não pode ser eliminada nem mudar de tipo.
        </p>
      </div>
      {form && (
        <CategoryForm item={form === 'new' ? undefined : form} onClose={() => setForm(null)} />
      )}{' '}
      {deleting && (
        <DeleteDialog
          name={deleting.name}
          remove={() => categoryService.remove(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
