import { query } from "../db/pool.js";

const PUBLIC = "id, name, email, created_at AS \"createdAt\"";

export async function findByEmail(email) {
  const { rows } = await query(
    "SELECT id, name, email, password_hash AS \"passwordHash\", created_at AS \"createdAt\" FROM users WHERE lower(email) = lower($1)",
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${PUBLIC} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function create({ name, email, passwordHash }, client) {
  const { rows } = await (client ?? { query }).query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING ${PUBLIC}`,
    [name, email, passwordHash]
  );
  return rows[0];
}
