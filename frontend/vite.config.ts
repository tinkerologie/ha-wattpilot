import { defineConfig } from "vitest/config";
import manifest from "../custom_components/wattpilot/manifest.json" with { type: "json" };

export default defineConfig({
  define: {
    __CARD_VERSION__: JSON.stringify(manifest.version),
  },
  build: {
    modulePreload: false,
    outDir: "../custom_components/wattpilot/frontend",
    emptyOutDir: true,
    target: "es2022",
    minify: true,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        "wattpilot-cards": "src/index.ts",
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["test/setup.ts"],
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
      thresholds: { lines: 85 },
      reporter: ["text-summary", "lcov"],
    },
  },
});
