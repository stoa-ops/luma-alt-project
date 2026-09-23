import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { migrate as migrateNode } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Apply migrations to an existing PGlite client (used by the dev-server
 * auto-migrate path). Standalone scripts use `runStandaloneMigrations` below.
 */
export async function applyMigrationsToPglite(client: PGlite) {
  const db = drizzlePglite(client);
  await migratePglite(db, { migrationsFolder: "./drizzle" });
}

/**
 * One-shot migration runner for CLI scripts. Detects DATABASE_URL from env.
 */
export async function runStandaloneMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url || url === "pglite") {
    throw new Error(
      "db:migrate requires DATABASE_URL to point to a persistent Postgres database"
    );
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzleNode(pool);
  await migrateNode(db, { migrationsFolder: "./drizzle" });
  await pool.end();
}
