import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import type { Transaction } from '../../types';
import { formatDate, formatMoney } from '../../utils/money';
export function TransactionTable({
  items,
  onEdit,
  onDelete,
}: {
  items: Transaction[];
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Data</th>
            <th>Tipo</th>
            <th className="align-right">Valor</th>
            {onEdit && <th className="align-right">Acções</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="transaction-name">
                  <span className={'transaction-icon ' + t.type.toLowerCase()}>
                    {t.type === 'INCOME' ? <ArrowUpRight size={19} /> : <ArrowDownLeft size={19} />}
                  </span>
                  <span>{t.description}</span>
                </div>
              </td>
              <td>
                <span className="category-label">
                  <i style={{ background: t.categoryColor }} />
                  {t.categoryName}
                </span>
              </td>
              <td className="nowrap muted">{formatDate(t.transactionDate)}</td>
              <td>
                <span className={'badge ' + t.type.toLowerCase()}>
                  {t.type === 'INCOME' ? 'Receita' : 'Despesa'}
                </span>
              </td>
              <td className={'align-right amount ' + t.type.toLowerCase()}>
                {t.type === 'INCOME' ? '+' : '−'} {formatMoney(t.amountCents)}
              </td>
              {onEdit && (
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={'Editar ' + t.description}
                      onClick={() => onEdit(t)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button delete-action"
                      aria-label={'Eliminar ' + t.description}
                      onClick={() => onDelete?.(t)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
