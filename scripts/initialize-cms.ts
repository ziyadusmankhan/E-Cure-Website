import { loadEnvConfig } from "@next/env";
import { startLocalPostgres } from "./local-postgres";
import { openDatabase } from "../src/server/db/connection";
import { initializeCms } from "../src/server/cms/store";
import { safeError } from "../src/server/errors";
loadEnvConfig(process.cwd());
async function main() {
  const local = await startLocalPostgres("development");
  const url = new URL(local.url);
  url.pathname = "/healthcare_development";
  const db = openDatabase(url.toString(), "migration");
  try {
    await initializeCms(db.db);
    console.log(
      "Local website drafts initialized; existing draft and published versions preserved.",
    );
  } finally {
    await db.close();
  }
}
main().catch((e) => {
  console.error(safeError(e).message);
  process.exitCode = 1;
});
