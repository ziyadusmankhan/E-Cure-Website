import { defineConfig } from "drizzle-kit";

// Generation/check need no credentials. Apply migrations through the guarded CLI.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["healthcare"],
  strict: true,
  verbose: false,
});
