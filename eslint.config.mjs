import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Prisma Client gerado: nao e codigo do projeto, nao deve ser lintado.
      "src/generated/**",
      "public/**",
      "var/**",
    ],
  },
  {
    rules: {
      // Evidencia de auditoria: `void expr` e intencional para marcar
      // descarte explicito de valor. O unused-vars continua ativo.
      "@typescript-eslint/no-unused-expressions": "off",
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      eqeqeq: ["error", "smart"],
    },
  },
];

export default eslintConfig;