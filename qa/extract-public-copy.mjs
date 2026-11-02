// One-time Phase 4 migration. Do not rerun after customizing profile copy.
import fs from "node:fs";
if (fs.existsSync("src/config/content/default-copy.ts"))
  throw new Error("Migration already completed; edit the centralized copy instead.");
import ts from "typescript";
const files = [
  "src/app/page.tsx",
  ...["about", "services", "contact", "book-appointment", "privacy-policy", "faq", "not-found"].map(
    (p) => `src/app/${p}${p === "not-found" ? "" : "/page"}.tsx`,
  ),
  "src/components/layout/header.tsx",
  "src/components/layout/footer.tsx",
  "src/components/shared/cta-section.tsx",
  "src/components/shared/contact-details.tsx",
  "src/components/forms/booking-form.tsx",
  "src/components/forms/contact-form.tsx",
];
const copy = {};
function clean(text) {
  const lines = text.split(/\r\n|\n|\r/);
  let last = 0;
  lines.forEach((l, i) => {
    if (/[^ \t]/.test(l)) last = i;
  });
  return lines
    .map((line, i) => {
      let value = line.replace(/\t/g, " ");
      if (i !== 0) value = value.replace(/^ +/, "");
      if (i !== lines.length - 1) value = value.replace(/ +$/, "");
      return value + (value && i !== last ? " " : "");
    })
    .join("");
}
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const prefix = file
    .replace("src/app/page.tsx", "home")
    .replace("src/app/", "")
    .replace("src/components/", "")
    .replace(/\/page\.tsx$|\.tsx$/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_");
  let counter = 0;
  function store(value) {
    const key = `${prefix}_${value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .split(/\s+/)
      .slice(0, 5)
      .join("_")}_${++counter}`;
    copy[key] = value;
    return `site.copy.${key}`;
  }
  function walk(node) {
    if (ts.isJsxText(node)) {
      const value = clean(node.getFullText(ast));
      if (value.trim()) {
        edits.push({ start: node.pos, end: node.end, text: `{${store(value)}}` });
      }
    }
    if (
      ts.isJsxAttribute(node) &&
      ["title", "description", "eyebrow", "alt", "placeholder"].includes(node.name.text) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      edits.push({
        start: node.initializer.getStart(ast),
        end: node.initializer.end,
        text: `{${store(node.initializer.text)}}`,
      });
    }
    // Structured editorial blocks on the About page.
    if (
      file.includes("/about/") &&
      ts.isPropertyAssignment(node) &&
      ["title", "text"].includes(node.name.getText(ast)) &&
      ts.isStringLiteral(node.initializer)
    ) {
      edits.push({
        start: node.initializer.getStart(ast),
        end: node.initializer.end,
        text: store(node.initializer.text),
      });
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  let result = source;
  edits
    .sort((a, b) => b.start - a.start)
    .forEach((e) => {
      result = result.slice(0, e.start) + e.text + result.slice(e.end);
    });
  if (!result.includes("import { site }"))
    result = 'import { site } from "@/config/site";\n' + result;
  // Keep the client directive first.
  result = result.replace(
    'import { site } from "@/config/site";\n"use client";',
    '"use client";\nimport { site } from "@/config/site";',
  );
  fs.writeFileSync(file, result);
}
fs.mkdirSync("src/config/content", { recursive: true });
fs.writeFileSync(
  "src/config/content/default-copy.ts",
  `export const defaultCopy = ${JSON.stringify(copy, null, 2)} as const;\nexport type CopyKey = keyof typeof defaultCopy;\nexport type PublicCopy = { [K in CopyKey]: string };\n`,
);
console.log(`Extracted ${Object.keys(copy).length} public text fields.`);
