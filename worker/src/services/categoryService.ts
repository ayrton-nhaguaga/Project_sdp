import type { CategoryInput } from '../../../shared/schemas';
import { CategoryRepository } from '../repositories/categoryRepository';
import { AppError } from '../middlewares/errors';
export class CategoryService {
  private repo: CategoryRepository;
  constructor(db: D1Database) {
    this.repo = new CategoryRepository(db);
  }
  list() {
    return this.repo.list();
  }
  async get(id: number) {
    const item = await this.repo.get(id);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Categoria não encontrada.');
    return item;
  }
  create(v: CategoryInput) {
    return this.repo.create(v);
  }
  async update(id: number, v: CategoryInput) {
    const old = await this.get(id);
    if (old.type !== v.type && (await this.repo.used(id)))
      throw new AppError(
        409,
        'CATEGORY_IN_USE',
        'Não é possível alterar o tipo de uma categoria com transacções.',
      );
    const item = await this.repo.update(id, v);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Categoria não encontrada.');
    return item;
  }
  async delete(id: number) {
    await this.get(id);
    if (await this.repo.used(id))
      throw new AppError(
        409,
        'CATEGORY_IN_USE',
        'Esta categoria tem transacções associadas e não pode ser eliminada.',
      );
    if (!(await this.repo.delete(id)))
      throw new AppError(404, 'NOT_FOUND', 'Categoria não encontrada.');
  }
}
