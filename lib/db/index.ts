/**
 * libSQL rather than better-sqlite3: the same code runs against a local file
 * and a hosted database, and there is no native module to build.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./local.db";

// Modules survive hot reloads, so without this every save opens a connection.
const globalForDb = globalThis as unknown as {
  timeyClient?: ReturnType<typeof createClient>;
};

const client =
  globalForDb.timeyClient ??
  createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

if (process.env.NODE_ENV !== "production") globalForDb.timeyClient = client;

export const db = drizzle(client, { schema });
export { schema };
