import { execFileSync } from "node:child_process";
import { mkdirSync, lstatSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "Dockerfile", ".dockerignore", "package.json", "package-lock.json",
  "next.config.ts", "tsconfig.json", "next-env.d.ts", "postcss.config.mjs",
  "src", "public", "deploy/start.mjs",
];
function checkInput(relative) {
  const item = lstatSync(join(root, relative));
  if (item.isSymbolicLink()) throw new Error(`Deployment inputs must not contain links: ${relative}`);
  if (item.isDirectory()) for (const child of readdirSync(join(root, relative))) checkInput(`${relative}/${child}`);
}
files.forEach(checkInput);
mkdirSync(join(root, "dist"), { recursive: true });
const output = join(root, "dist", "ecure-oracle-source.tar.gz");
execFileSync("tar", ["-czf", output, "--exclude=public/images/branding/ecure-original.jpg", ...files], { cwd: root, stdio: "inherit", windowsHide: true });
const entries = execFileSync("tar", ["-tzf", output], { cwd: root, encoding: "utf8", windowsHide: true }).split(/\r?\n/).filter(Boolean);
const roots = new Set(files.map(file => file.split("/")[0]));
for (const entry of entries) {
  const normalized = entry.replace(/^\.\//, "");
  if (!roots.has(normalized.split("/")[0]) || /(?:^|\/)(?:\.env[^/]*|node_modules|\.git|\.local|\.next|test-results)(?:\/|$)/.test(normalized))
    throw new Error(`Unexpected deployment entry: ${entry}`);
}
console.log(`Oracle source upload: ${output}`);
console.log(`${entries.length} entries; ${(statSync(output).size / 1024 / 1024).toFixed(2)} MiB. No local credentials, databases, dependencies, tests or reports included.`);
