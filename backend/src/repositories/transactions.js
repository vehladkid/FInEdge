import { query } from "../db/pool.js";

const SELECT = `
  SELECT t.id, t.type, t.amount, t.description,
         t.transaction_date AS date,
         t.category_id AS "categoryId", c.name AS "categoryName",
         t.created_at AS "createdAt", t.updated_at AS "updatedAt"
  FROM transactions t JOIN categories c ON c.id = t.category_id`;

export async function list(userId, { type, categoryId, from, to, page, limit }) {
  const where = `WHERE t.user_id = $1
    AND ($2::text IS NULL OR t.type = $2)
    AND ($3::int IS NULL OR t.category_id = $3)
    AND ($4::date IS NULL OR t.transaction_date >= $4)
    AND ($5::date IS NULL OR t.transaction_date <= $5)`;
  const params = [userId, type ?? null, categoryId ?? null, from ?? null, to ?? null];
  const [rows, count] = await Promise.all([
    query(`${SELECT} ${where} ORDER BY t.transaction_date DESC, t.id DESC LIMIT $6 OFFSET $7`, [
      ...params,
      limit,
      (page - 1) * limit,
    ]),
    query(`SELECT count(*)::int AS n FROM transactions t ${where}`, params),
  ]);
  return { items: rows.rows, total: count.rows[0].n };
}

export async function findById(userId, id) {
  const { rows } = await query(`${SELECT} WHERE t.id = $1 AND t.user_id = $2`, [id, userId]);
  return rows[0] ?? null;
}

export async function create(userId, t) {
  const { rows } = await query(
    `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [userId, t.categoryId, t.amount, t.type, t.description, t.date]
  );
  return findById(userId, rows[0].id);
}

export async function update(userId, id, t) {
  const { rowCount } = await query(
    `UPDATE transactions SET category_id = $3, amount = $4, type = $5, description = $6,
            transaction_date = $7, updated_at = now()
     WHERE id = $1 AND user_id = $2`,
    [id, userId, t.categoryId, t.amount, t.type, t.description, t.date]
  );
  return rowCount ? findById(userId, id) : null;
}

export async function remove(userId, id) {
  const { rowCount } = await query("DELETE FROM transactions WHERE id = $1 AND user_id = $2", [id, userId]);
  return rowCount > 0;
}

export async function recent(userId, limit) {
  const { rows } = await query(`${SELECT} WHERE t.user_id = $1 ORDER BY t.transaction_date DESC, t.id DESC LIMIT $2`, [
    userId,
    limit,
  ]);
  return rows;
}
