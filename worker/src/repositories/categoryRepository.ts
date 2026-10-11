import type { Category, CategoryInput } from '../../../shared/schemas';
const columns = 'id, name, type, color, created_at AS createdAt, updated_at AS updatedAt';
export class CategoryRepository {
  constructor(private db: D1Database) {}
  async list() {
    return (
      await this.db
        .prepare('SELECT ' + columns + ' FROM categories ORDER BY type, name COLLATE NOCASE')
        .all<Category>()
    ).results;
  }
  get(id: number) {
    return this.db
      .prepare('SELECT ' + columns + ' FROM categories WHERE id = ?')
      .bind(id)
      .first<Category>();
  }
  async used(id: number) {
    return !!(await this.db
      .prepare('SELECT 1 FROM transactions WHERE category_id = ? LIMIT 1')
      .bind(id)
      .first());
  }
  create(v: CategoryInput) {
    return this.db
      .prepare('INSERT INTO categories(name,type,color) VALUES(?,?,?) RETURNING ' + columns)
      .bind(v.name, v.type, v.color)
      .first<Category>();
  }
  update(id: number, v: CategoryInput) {
    return this.db
      .prepare(
        "UPDATE categories SET name=?,type=?,color=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? RETURNING " +
          columns,
      )
      .bind(v.name, v.type, v.color, id)
      .first<Category>();
  }
  async delete(id: number) {
    return (await this.db.prepare('DELETE FROM categories WHERE id=?').bind(id).run()).meta.changes;
  }
}
