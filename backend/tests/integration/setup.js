import { beforeAll, afterAll } from "vitest";
import { pool, closePool } from "../../src/db/pool.js";
import { migrate } from "../../src/db/migrate.js";

const dbName = new URL(process.env.DATABASE_URL).pathname.slice(1);
if (!dbName.endsWith("_test")) {
  throw new Error(`Refusing to run integration tests against "${dbName}": database name must end with _test`);
}

beforeAll(async () => {
  await migrate();
});

afterAll(async () => {
  await closePool();
});

export async function resetDb() {
  await pool.query("TRUNCATE users, categories, transactions, budgets RESTART IDENTITY CASCADE");
}
