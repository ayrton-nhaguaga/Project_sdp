import type { TransactionInput, Filters } from '../../../shared/schemas';
import { TransactionRepository } from '../repositories/transactionRepository';
import { CategoryRepository } from '../repositories/categoryRepository';
import { AppError } from '../middlewares/errors';
export class TransactionService {
  private repo: TransactionRepository;
  private categories: CategoryRepository;
  constructor(db: D1Database) {
    this.repo = new TransactionRepository(db);
    this.categories = new CategoryRepository(db);
  }
  list(f: Filters) {
    return this.repo.list(f);
  }
  async get(id: number) {
    const item = await this.repo.get(id);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Transacção não encontrada.');
    return item;
  }
  async validateCategory(v: TransactionInput) {
    const category = await this.categories.get(v.categoryId);
    if (!category)
      throw new AppError(400, 'CATEGORY_NOT_FOUND', 'A categoria seleccionada não existe.');
    if (category.type !== v.type)
      throw new AppError(
        400,
        'CATEGORY_TYPE_MISMATCH',
        'A categoria deve corresponder ao tipo da transacção.',
      );
  }
  async create(v: TransactionInput) {
    await this.validateCategory(v);
    return this.repo.create(v);
  }
  async update(id: number, v: TransactionInput) {
    await this.get(id);
    await this.validateCategory(v);
    const item = await this.repo.update(id, v);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Transacção não encontrada.');
    return item;
  }
  async delete(id: number) {
    if (!(await this.repo.delete(id)))
      throw new AppError(404, 'NOT_FOUND', 'Transacção não encontrada.');
  }
}
