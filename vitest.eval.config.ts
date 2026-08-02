import path from "path";
import { defineConfig } from "vitest/config";

/**
 * The evaluation suite runs separately from the unit suite so that a metric
 * regression is reported distinctly from a broken unit test.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["eval/**/*.test.ts"],
  },
});
