import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
function sourceHash() { const hash=createHash("sha256"); function visit(dir) { for(const item of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) { const path=join(dir,item.name); if(item.isDirectory()) visit(path);else hash.update(path).update(readFileSync(path)); } } visit("src");return hash.digest("hex"); }
const before = sourceHash();
const ids = ["general-clinic", "home-care", "physiotherapy-center"],
  results = [];
let failed = false;
function run(args, env) {
  const child = spawnSync(process.execPath, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  if (child.error) throw child.error;
  return child.status === 0;
}
try {
  for (const id of ids) {
    const env = { NEXT_PUBLIC_SITE_PROFILE: id, SITE_THEME: "", NEXT_PUBLIC_SITE_URL: "", SUBMISSIONS_MODE: "disabled", ADMIN_AUTH_MODE: "disabled" };
    console.log(`\nVerifying fictional deployment: ${id}`);
    const built = run(["node_modules/next/dist/bin/next", "build"], env),
      tested =
        built &&
        run(
          [
            "node_modules/@playwright/test/cli.js",
            "test",
            "--config",
            "playwright.profiles.config.ts",
          ],
          env,
        );
    results.push({ profile: id, built, tested });
    if (!tested) {
      failed = true;
      break;
    }
  }
} catch (error) {
  console.error(error.message);
  failed = true;
} finally {
  console.log("\nRestoring default deployment build.");
  if (
    !run(["node_modules/next/dist/bin/next", "build"], {
      NEXT_PUBLIC_SITE_PROFILE: "default",
      SITE_THEME: "",
      NEXT_PUBLIC_SITE_URL: "",
      SUBMISSIONS_MODE: "disabled",
      ADMIN_AUTH_MODE: "disabled",
    })
  )
    failed = true;
  mkdirSync(".profile-results", { recursive: true });
  const after=sourceHash(); if(before!==after) failed=true;
  writeFileSync(
    ".profile-results/matrix.json",
    JSON.stringify({ results, passed: !failed, sourceHashBefore:before, sourceHashAfter:after, sourceUnchanged:before===after }, null, 2),
  );
}
process.exitCode = failed ? 1 : 0;
