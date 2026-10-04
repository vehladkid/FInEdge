import { query } from "../db/pool.js";

const COLS = "id, name, type, created_at AS \"createdAt\"";

export async function list(userId, type) {
  const { rows } = await query(
    `SELECT ${COLS} FROM categories WHERE user_id = $1 AND ($2::text IS NULL OR type = $2) ORDER BY type, name`,
    [userId, type ?? null]
  );
  return rows;
}

export async function findById(userId, id) {
  const { rows } = await query(`SELECT ${COLS} FROM categories WHERE id = $1 AND user_id = $2`, [id, userId]);
  return rows[0] ?? null;
}

export async function create(userId, { name, type }, client) {
  const { rows } = await (client ?? { query }).query(
    `INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING ${COLS}`,
    [userId, name, type]
  );
  return rows[0];
}

export async function rename(userId, id, name) {
  const { rows } = await query(
    `UPDATE categories SET name = $3 WHERE id = $1 AND user_id = $2 RETURNING ${COLS}`,
    [id, userId, name]
  );
  return rows[0] ?? null;
}

export async function countTransactions(userId, id) {
  const { rows } = await query(
    "SELECT count(*)::int AS n FROM transactions WHERE category_id = $1 AND user_id = $2",
    [id, userId]
  );
  return rows[0].n;
}

export async function remove(userId, id) {
  const { rowCount } = await query("DELETE FROM categories WHERE id = $1 AND user_id = $2", [id, userId]);
  return rowCount > 0;
}
