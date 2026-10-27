import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // "server-only" throws outside a React Server Component bundle; stub it in tests.
    alias: { "server-only": new URL("./tests/stubs/server-only.ts", import.meta.url).pathname },
    restoreMocks: true,
  },
});
