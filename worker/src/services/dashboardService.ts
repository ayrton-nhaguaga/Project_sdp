import type { Filters, Monthly } from '../../../shared/schemas';
import { TransactionRepository } from '../repositories/transactionRepository';
export class DashboardService {
  private repo: TransactionRepository;
  constructor(db: D1Database) {
    this.repo = new TransactionRepository(db);
  }
  summary(f: Filters) {
    return this.repo.summary(f);
  }
  categories(f: Filters) {
    return this.repo.categoryTotals(f);
  }
  async recent(f: Filters) {
    return (await this.repo.list({ ...f, page: 1, pageSize: 5 })).items;
  }
  async monthly(year: number): Promise<Monthly[]> {
    const rows = await this.repo.monthly(year);
    return Array.from({ length: 12 }, (_, i) => {
      const month = year + '-' + String(i + 1).padStart(2, '0');
      return rows.find((r) => r.month === month) ?? { month, incomeCents: 0, expenseCents: 0 };
    });
  }
}
