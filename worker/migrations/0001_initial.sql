PRAGMA foreign_keys = ON;

CREATE TABLE categories (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 60),
 type TEXT NOT NULL CHECK(type IN ('INCOME','EXPENSE')),
 color TEXT NOT NULL CHECK(length(color) = 7 AND substr(color,1,1) = '#' AND length(ltrim(substr(color,2),'0123456789abcdefABCDEF')) = 0),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(name, type)
);
CREATE TABLE transactions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
 type TEXT NOT NULL CHECK(type IN ('INCOME','EXPENSE')),
 amount INTEGER NOT NULL CHECK(typeof(amount) = 'integer' AND amount > 0 AND amount <= 100000000000),
 description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 3 AND 200),
 transaction_date TEXT NOT NULL CHECK(length(transaction_date) = 10 AND transaction_date BETWEEN '1900-01-01' AND '9999-12-31' AND date(transaction_date,'+0 days') IS NOT NULL AND date(transaction_date,'+0 days') = transaction_date),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC, id DESC);
CREATE INDEX idx_transactions_category_date ON transactions(category_id, transaction_date);
CREATE INDEX idx_transactions_type_date ON transactions(type, transaction_date);

CREATE TRIGGER transaction_category_insert BEFORE INSERT ON transactions
WHEN NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.category_id AND type = NEW.type)
BEGIN SELECT RAISE(ABORT, 'CATEGORY_TYPE_CONFLICT'); END;
CREATE TRIGGER transaction_category_update BEFORE UPDATE OF category_id, type ON transactions
WHEN NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.category_id AND type = NEW.type)
BEGIN SELECT RAISE(ABORT, 'CATEGORY_TYPE_CONFLICT'); END;
CREATE TRIGGER category_type_update BEFORE UPDATE OF type ON categories
WHEN EXISTS (SELECT 1 FROM transactions WHERE category_id = OLD.id AND type != NEW.type)
BEGIN SELECT RAISE(ABORT, 'CATEGORY_IN_USE'); END;

INSERT INTO categories(name,type,color) VALUES
 ('Salário','INCOME','#10B981'),('Freelance','INCOME','#14B8A6'),('Outros rendimentos','INCOME','#06B6D4'),
 ('Alimentação','EXPENSE','#6366F1'),('Transporte','EXPENSE','#F59E0B'),('Habitação','EXPENSE','#8B5CF6'),
 ('Serviços','EXPENSE','#0EA5E9'),('Saúde','EXPENSE','#EF4444'),('Educação','EXPENSE','#EC4899'),
 ('Lazer','EXPENSE','#F97316'),('Outras despesas','EXPENSE','#64748B');