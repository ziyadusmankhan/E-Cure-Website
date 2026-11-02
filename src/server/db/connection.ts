import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { connectionSettings } from "../env";
import * as schema from "./schema";

export function openDatabase(
  value: string | undefined,
  purpose: "runtime" | "migration" | "test" = "runtime",
) {
  const { url, ...options } = connectionSettings(value, purpose);
  const client = postgres(url, { ...options, onnotice: () => {} });
  return { db: drizzle(client, { schema }), client, close: () => client.end({ timeout: 5 }) };
}
export type Database = ReturnType<typeof openDatabase>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type Executor = Database | Transaction;
const state = globalThis as typeof globalThis & {
  healthcareDatabase?: ReturnType<typeof openDatabase>;
};
// Lazy: the public demo can build and run without database credentials.
export function getDatabase() {
  state.healthcareDatabase ??= openDatabase(process.env.DATABASE_URL);
  return state.healthcareDatabase.db;
}
