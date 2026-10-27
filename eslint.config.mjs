import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Logging goes through src/server/logging so PII is redacted.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["src/server/logging/**", "prisma/seed.ts"],
    rules: { "no-console": "off" },
  },
];

export default eslintConfig;
