/* Gera public/openapi.json a partir de src/lib/api/openapi.ts e valida coerência. */
import { writeFileSync, mkdirSync } from "node:fs";
import { openApiSpec } from "../src/lib/api/openapi";

mkdirSync("public", { recursive: true });
const json = JSON.stringify(openApiSpec, null, 2);
writeFileSync("public/openapi.json", json, "utf8");

// Auditoria: toda $ref precisa existir
const refs = [...json.matchAll(/"\$ref":\s*"#\/components\/([^"]+)"/g)].map((m) => m[1]);
const missing: string[] = [];
for (const ref of new Set(refs)) {
  const [group, name] = ref.split("/");
  const bucket = (openApiSpec.components as never as Record<string, Record<string, unknown>>)[group];
  if (!bucket || !bucket[name]) missing.push(ref);
}

console.log(`openapi.json gerado: ${(json.length / 1024).toFixed(1)} kB`);
console.log(`paths: ${Object.keys(openApiSpec.paths).length}`);
console.log(`schemas: ${Object.keys(openApiSpec.components.schemas).length}`);
console.log(`$refs verificadas: ${refs.length}, quebradas: ${missing.length}`);
if (missing.length) {
  console.error("REFS QUEBRADAS:", missing);
  process.exit(1);
}