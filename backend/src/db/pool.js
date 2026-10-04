import pg from "pg";
import { config } from "../config/index.js";

// NUMERIC -> number and DATE -> "YYYY-MM-DD" string (no timezone shifting).
pg.types.setTypeParser(1700, (v) => Number(v));
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export const query = (text, params) => pool.query(text, params);
export const closePool = () => pool.end();
