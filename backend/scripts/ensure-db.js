// Creates the database named in DATABASE_URL if it does not exist yet.
// Used for the isolated e2e/integration databases; connects via the "postgres" maintenance DB.
import pg from "pg";

const target = new URL(process.env.DATABASE_URL || "");
const name = target.pathname.slice(1);
if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`Unsafe database name: ${name}`);

const admin = new URL(target);
admin.pathname = "/postgres";
const client = new pg.Client({ connectionString: admin.toString() });
await client.connect();
const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
if (!rowCount) {
  await client.query(`CREATE DATABASE ${name}`);
  console.log(`Created database ${name}`);
} else {
  console.log(`Database ${name} already exists`);
}
await client.end();
