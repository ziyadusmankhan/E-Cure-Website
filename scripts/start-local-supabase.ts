import { spawn } from "node:child_process";
import { mkdirSync, openSync, closeSync } from "node:fs";
import { resolve } from "node:path";
mkdirSync(".local/supabase", { recursive: true });
const log = openSync(".local/supabase/start.log", "w", 0o600);
console.log(
  "Starting this workspace's local Supabase services. Container output stays in ignored .local/supabase/start.log because it can contain local credentials.",
);
const child = spawn(
  process.execPath,
  [resolve("node_modules/supabase/dist/supabase.js"), "start", "--yes"],
  {
    stdio: ["ignore", log, log],
    windowsHide: true,
  },
);
const progress = setInterval(
  () => console.log("Local Supabase startup is still running; Docker may be downloading images."),
  30000,
);
child.on("error", () => {
  clearInterval(progress);
  closeSync(log);
  console.error(
    "Local Supabase could not start. Check Docker Desktop and the protected local log.",
  );
  process.exitCode = 1;
});
child.on("exit", (code) => {
  clearInterval(progress);
  closeSync(log);
  process.exitCode = code ?? 1;
  console.log(
    code === 0
      ? "Local Supabase is ready. Run npm.cmd run auth:local:configure next."
      : "Local Supabase startup failed. Check Docker Desktop and the protected local log; credentials were not printed.",
  );
});
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => child.kill(signal));
