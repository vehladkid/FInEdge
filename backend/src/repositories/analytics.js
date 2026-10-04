import { query } from "../db/pool.js";

export async function totalsByType(userId, from, to) {
  const { rows } = await query(
    `SELECT type, COALESCE(sum(amount), 0) AS total FROM transactions
     WHERE user_id = $1 AND ($2::date IS NULL OR transaction_date >= $2) AND ($3::date IS NULL OR transaction_date <= $3)
     GROUP BY type`,
    [userId, from ?? null, to ?? null]
  );
  return rows;
}

export async function monthlyTotals(userId, from, to) {
  const { rows } = await query(
    `SELECT to_char(transaction_date, 'YYYY-MM') AS month, type, sum(amount) AS total
     FROM transactions WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3
     GROUP BY 1, 2 ORDER BY 1`,
    [userId, from, to]
  );
  return rows;
}

export async function expensesByCategory(userId, from, to) {
  const { rows } = await query(
    `SELECT c.id AS "categoryId", c.name, sum(t.amount) AS total
     FROM transactions t JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1 AND t.type = 'expense' AND t.transaction_date BETWEEN $2 AND $3
     GROUP BY c.id, c.name ORDER BY total DESC, c.name`,
    [userId, from, to]
  );
  return rows;
}

export async function dailyExpenses(userId, from, to) {
  const { rows } = await query(
    `SELECT transaction_date AS date, sum(amount) AS total FROM transactions
     WHERE user_id = $1 AND type = 'expense' AND transaction_date BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [userId, from, to]
  );
  return rows;
}
