import type {
  Filters,
  Transaction,
  TransactionInput,
  Summary,
  Monthly,
  CategoryTotal,
} from '../../../shared/schemas';
const select =
  't.id, t.category_id AS categoryId, t.type, t.amount AS amountCents, t.description, t.transaction_date AS transactionDate, t.created_at AS createdAt, t.updated_at AS updatedAt, c.name AS categoryName, c.color AS categoryColor';
export function where(filters: Partial<Filters>) {
  const parts: string[] = [];
  const values: (string | number)[] = [];
  if (filters.type) {
    parts.push('t.type=?');
    values.push(filters.type);
  }
  if (filters.categoryId) {
    parts.push('t.category_id=?');
    values.push(filters.categoryId);
  }
  if (filters.startDate) {
    parts.push('t.transaction_date>=?');
    values.push(filters.startDate);
  }
  if (filters.endDate) {
    parts.push('t.transaction_date<=?');
    values.push(filters.endDate);
  }
  if (filters.search) {
    parts.push("t.description LIKE ? ESCAPE '\\'");
    values.push('%' + filters.search.replace(/[\\%_]/g, '\\$&') + '%');
  }
  return { sql: parts.length ? ' WHERE ' + parts.join(' AND ') : '', values };
}
export class TransactionRepository {
  constructor(private db: D1Database) {}
  get(id: number) {
    return this.db
      .prepare(
        'SELECT ' +
          select +
          ' FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.id=?',
      )
      .bind(id)
      .first<Transaction>();
  }
  async list(filters: Filters) {
    const w = where(filters);
    const results = await this.db.batch([
      this.db.prepare('SELECT COUNT(*) AS total FROM transactions t' + w.sql).bind(...w.values),
      this.db
        .prepare(
          'SELECT ' +
            select +
            ' FROM transactions t JOIN categories c ON c.id=t.category_id' +
            w.sql +
            ' ORDER BY t.transaction_date DESC,t.id DESC LIMIT ? OFFSET ?',
        )
        .bind(...w.values, filters.pageSize, (filters.page - 1) * filters.pageSize),
    ]);
    const total = Number((results[0].results[0] as { total: number }).total);
    return {
      items: results[1].results as unknown as Transaction[],
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }
  async create(v: TransactionInput) {
    const row = await this.db
      .prepare(
        'INSERT INTO transactions(category_id,type,amount,description,transaction_date) VALUES(?,?,?,?,?) RETURNING id',
      )
      .bind(v.categoryId, v.type, v.amountCents, v.description, v.transactionDate)
      .first<{ id: number }>();
    return this.get(row!.id);
  }
  async update(id: number, v: TransactionInput) {
    const result = await this.db
      .prepare(
        "UPDATE transactions SET category_id=?,type=?,amount=?,description=?,transaction_date=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
      )
      .bind(v.categoryId, v.type, v.amountCents, v.description, v.transactionDate, id)
      .run();
    return result.meta.changes ? this.get(id) : null;
  }
  async delete(id: number) {
    return (await this.db.prepare('DELETE FROM transactions WHERE id=?').bind(id).run()).meta
      .changes;
  }
  async summary(filters: Partial<Filters>) {
    const w = where(filters);
    return this.db
      .prepare(
        "SELECT COALESCE(SUM(CASE WHEN t.type='INCOME' THEN amount ELSE 0 END),0) AS incomeCents, COALESCE(SUM(CASE WHEN t.type='EXPENSE' THEN amount ELSE 0 END),0) AS expenseCents, COALESCE(SUM(CASE WHEN t.type='INCOME' THEN amount ELSE -amount END),0) AS balanceCents, COUNT(*) AS count FROM transactions t" +
          w.sql,
      )
      .bind(...w.values)
      .first<Summary>();
  }
  async monthly(year: number) {
    return (
      await this.db
        .prepare(
          "SELECT substr(transaction_date,1,7) AS month, SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END) AS incomeCents, SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) AS expenseCents FROM transactions WHERE transaction_date>=? AND transaction_date<? GROUP BY month ORDER BY month",
        )
        .bind(year + '-01-01', year + 1 + '-01-01')
        .all<Monthly>()
    ).results;
  }
  async categoryTotals(filters: Partial<Filters>) {
    const w = where({ ...filters, type: 'EXPENSE' });
    return (
      await this.db
        .prepare(
          'SELECT c.id AS categoryId,c.name,c.color,SUM(t.amount) AS amountCents FROM transactions t JOIN categories c ON c.id=t.category_id' +
            w.sql +
            ' GROUP BY c.id ORDER BY amountCents DESC,c.id',
        )
        .bind(...w.values)
        .all<CategoryTotal>()
    ).results;
  }
}
