import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { pool } from "../db/pool.js";
import { AppError, conflict, unauthorized } from "../errors/index.js";
import * as users from "../repositories/users.js";
import * as categories from "../repositories/categories.js";
import { DEFAULT_CATEGORIES } from "./categoryService.js";

export const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const verifyToken = (token) => {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return Number(payload.sub);
  } catch {
    throw unauthorized("Invalid or expired token");
  }
};

export async function register({ name, email, password }) {
  if (await users.findByEmail(email)) throw conflict("An account with this email already exists");
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await users.create({ name, email, passwordHash }, client);
    for (const c of DEFAULT_CATEGORIES) await categories.create(user.id, c, client);
    await client.query("COMMIT");
    return { user, token: signToken(user.id) };
  } catch (err) {
    await client.query("ROLLBACK");
    // Two simultaneous registrations can both pass the check above.
    if (err.code === "23505") throw conflict("An account with this email already exists");
    throw err;
  } finally {
    client.release();
  }
}

const INVALID = "Invalid email or password";

export async function login({ email, password }) {
  const user = await users.findByEmail(email);
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) throw new AppError(401, "INVALID_CREDENTIALS", INVALID);
  const { passwordHash, ...publicUser } = user; // eslint-disable-line no-unused-vars
  return { user: publicUser, token: signToken(user.id) };
}

export async function currentUser(userId) {
  const user = await users.findById(userId);
  if (!user) throw unauthorized("Account no longer exists");
  return user;
}
