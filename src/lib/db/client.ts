import "server-only";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Schema = typeof schema;
type PgliteDb = ReturnType<typeof drizzlePglite<Schema>>;
type NodeDb = ReturnType<typeof drizzleNode<Schema>>;
export type Db = PgliteDb | NodeDb;

declare global {
  // eslint-disable-next-line no-var
  var __lumaPglite: PGlite | undefined;
  // eslint-disable-next-line no-var
  var __lumaPgliteReady: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __lumaPgPool: Pool | undefined;
}

function pickDriver(): { kind: "pglite"; client: PGlite } | { kind: "node"; pool: Pool } {
  const url = process.env.DATABASE_URL;
  if (!url && process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set in production");
  }

  const resolvedUrl = url ?? "pglite";
  if (resolvedUrl === "pglite") {
    if (!globalThis.__lumaPglite) globalThis.__lumaPglite = new PGlite();
    return { kind: "pglite", client: globalThis.__lumaPglite };
  }

  if (!globalThis.__lumaPgPool) {
    globalThis.__lumaPgPool = new Pool({ connectionString: resolvedUrl, max: 10 });
  }
  return { kind: "node", pool: globalThis.__lumaPgPool };
}

const driver = pickDriver();
const baseDb =
  driver.kind === "pglite"
    ? drizzlePglite(driver.client, { schema })
    : drizzleNode(driver.pool, { schema });

if (driver.kind === "pglite") {
  globalThis.__lumaPgliteReady ??= (async () => {
    const { applyMigrationsToPglite } = await import("./migrate");
    await applyMigrationsToPglite(driver.client);
  })();
  await globalThis.__lumaPgliteReady;
}

export const db: Db = baseDb;

export async function withTransaction<T>(callback: (tx: Db) => Promise<T>) {
  if (driver.kind === "pglite") {
    return (baseDb as PgliteDb).transaction((tx) =>
      callback(tx as unknown as Db)
    );
  }

  return (baseDb as NodeDb).transaction((tx) => callback(tx as unknown as Db));
}

export { schema };
