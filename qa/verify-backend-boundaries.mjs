import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join, extname } from "node:path";
import { parseEnv } from "node:util";
import ts from "typescript";

const root = resolve("src"),
  server = resolve(root, "server");
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const source = files(root).filter((file) => /\.tsx?$/.test(file));
const roots = source.filter((file) => /^\s*["']use client["']/.test(readFileSync(file, "utf8")));
const checked = new Set();
function visit(file) {
  if (checked.has(file)) return;
  checked.add(file);
  if (file === server || file.startsWith(server + "/") || file.startsWith(server + "\\"))
    throw new Error("Client graph imports a private backend module.");
  const text = readFileSync(file, "utf8");
  if (
    /process\.env\.(DATABASE_URL|DIRECT_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|TURNSTILE_SECRET_KEY|SUBMISSIONS_HMAC_SECRET)/.test(
      text,
    )
  )
    throw new Error("Client graph references a backend secret.");
  const ast = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  function walk(node) {
    let specifier;
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      specifier = node.moduleSpecifier.text;
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    )
      specifier = node.arguments[0].text;
    if (specifier) {
      if (/^(server-only|postgres|drizzle-orm)(\/|$)/.test(specifier))
        throw new Error("Client graph imports a database-only dependency.");
      const path = specifier.startsWith("@/")
        ? resolve(root, specifier.slice(2))
        : specifier.startsWith(".")
          ? resolve(dirname(file), specifier)
          : null;
      if (path) {
        const target = [
          path + ".ts",
          path + ".tsx",
          join(path, "index.ts"),
          join(path, "index.tsx"),
        ].find(existsSync);
        if (target) visit(target);
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
}
for (const file of roots) visit(file);
if (!existsSync(".next/static"))
  throw new Error("Build the application before checking browser bundles.");
const env = existsSync(".env.local") ? parseEnv(readFileSync(".env.local", "utf8")) : {};
const values = { ...env, ...process.env };
const secrets = [
  "DATABASE_URL",
  "DIRECT_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "TURNSTILE_SECRET_KEY",
  "SUBMISSIONS_HMAC_SECRET",
].flatMap((key) => {
  const value = values[key];
  if (!value) return [];
  const tokens = [value];
  if (key.endsWith("URL")) {
    try {
      const password = decodeURIComponent(new URL(value).password);
      if (password.length >= 8) tokens.push(password);
    } catch {}
  }
  return tokens;
});
const bundles = files(".next/static").filter((path) => /\.(js|json|map)$/.test(path));
for (const path of bundles) {
  const text = readFileSync(path, "utf8");
  if (secrets.some((value) => text.includes(value)))
    throw new Error("A browser bundle contains a backend secret (value redacted).");
}
mkdirSync(".db-results", { recursive: true });
writeFileSync(
  ".db-results/boundaries.json",
  JSON.stringify(
    {
      passed: true,
      clientRoots: roots.length,
      sourceModules: checked.size,
      browserBundles: bundles.length,
      configuredSecretsChecked: secrets.length,
    },
    null,
    2,
  ),
);
console.log(
  `Backend boundaries passed: ${roots.length} client roots, ${checked.size} source modules, ${bundles.length} browser bundles. Secret values were not printed.`,
);
