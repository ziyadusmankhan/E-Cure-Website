import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { parseEnv } from "node:util";

// Reads only this workspace's local CLI status. Never prints provider keys.
function main() {
  const status = JSON.parse(
    execFileSync(
      process.execPath,
      [resolve("node_modules/supabase/dist/supabase.js"), "status", "--output", "json"],
      {
        encoding: "utf8",
        windowsHide: true,
        timeout: 20000,
        stdio: ["ignore", "pipe", "pipe"],
      },
    ),
  );
  const url = new URL(status.API_URL);
  const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  const provisioningKey = status.SECRET_KEY || status.SERVICE_ROLE_KEY;
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || !publicKey || !provisioningKey)
    throw new Error("Expected local Supabase Auth credentials are unavailable.");
  const path = ".env.local";
  let source = existsSync(path) ? readFileSync(path, "utf8") : "";
  const existing = parseEnv(source);
  const encryptionKey = existing.ADMIN_SESSION_ENCRYPTION_KEY || randomBytes(32).toString("hex");
  if (!/^[a-f0-9]{64}$/.test(encryptionKey))
    throw new Error("Existing session encryption key is invalid; it was preserved.");
  const values = {
    ADMIN_AUTH_MODE: "local",
    SUPABASE_URL: url.origin,
    SUPABASE_PUBLISHABLE_KEY: publicKey,
    ADMIN_SESSION_ENCRYPTION_KEY: encryptionKey,
    ADMIN_ALLOWED_ORIGINS: "http://127.0.0.1:3000,http://localhost:3000",
    ADMIN_REQUIRE_MFA: "true",
  };
  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    source = pattern.test(source)
      ? source.replace(pattern, `${key}=${value}`)
      : `${source.trimEnd()}\n${key}=${value}\n`;
  }
  writeFileSync(path, source, { mode: 0o600 });
  mkdirSync(".local/supabase", { recursive: true });
  writeFileSync(
    ".local/supabase/provisioning.env",
    `SUPABASE_URL=${url.origin}\nSUPABASE_PROVISIONING_KEY=${provisioningKey}\n`,
    { mode: 0o600 },
  );
  console.log(
    "Configured loopback-only staff authentication in ignored .env.local. Provisioning credentials remain outside the Next.js environment. Restart the app to load the configuration.",
  );
}
try {
  main();
} catch {
  console.error(
    "Local Auth setup could not complete. Restart Windows, start Docker Desktop, then run npm.cmd run supabase:start. No credentials were printed.",
  );
  process.exitCode = 1;
}
