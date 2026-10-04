import { query } from "../db/pool.js";

// `spent` is the sum of expense transactions in the budget's category inside
// [start_date, end_date] — computed by the database, never trusted from clients.
const SELECT = `
  SELECT b.id, b.amount, b.period, b.start_date AS "startDate", b.end_date AS "endDate",
         b.category_id AS "categoryId", c.name AS category,
         COALESCE((SELECT sum(t.amount) FROM transactions t
                   WHERE t.user_id = b.user_id AND t.category_id = b.category_id
                     AND t.type = 'expense'
                     AND t.transaction_date BETWEEN b.start_date AND b.end_date), 0) AS spent
  FROM budgets b JOIN categories c ON c.id = b.category_id`;

export async function list(userId) {
  const { rows } = await query(`${SELECT} WHERE b.user_id = $1 ORDER BY b.start_date DESC, c.name`, [userId]);
  return rows;
}

export async function findById(userId, id) {
  const { rows } = await query(`${SELECT} WHERE b.id = $1 AND b.user_id = $2`, [id, userId]);
  return rows[0] ?? null;
}

export async function listActive(userId, date) {
  const { rows } = await query(
    `${SELECT} WHERE b.user_id = $1 AND $2::date BETWEEN b.start_date AND b.end_date ORDER BY c.name`,
    [userId, date]
  );
  return rows;
}

export async function create(userId, b) {
  const { rows } = await query(
    `INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [userId, b.categoryId, b.amount, b.period, b.startDate, b.endDate]
  );
  return findById(userId, rows[0].id);
}

export async function update(userId, id, b) {
  const { rowCount } = await query(
    `UPDATE budgets SET amount = $3, period = $4, start_date = $5, end_date = $6, updated_at = now()
     WHERE id = $1 AND user_id = $2`,
    [id, userId, b.amount, b.period, b.startDate, b.endDate]
  );
  return rowCount ? findById(userId, id) : null;
}

export async function remove(userId, id) {
  const { rowCount } = await query("DELETE FROM budgets WHERE id = $1 AND user_id = $2", [id, userId]);
  return rowCount > 0;
}
