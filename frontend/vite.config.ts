import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import manifest from "../custom_components/wattpilot/manifest.json" with { type: "json" };

const LIT_TAGS = new Set(["css", "html", "svg"]);

interface AstNode {
  type?: string;
  tag?: AstNode;
  name?: string;
  quasi?: { quasis?: Array<{ start: number; end: number }> };
  [key: string]: unknown;
}

function walkAst(node: unknown, visit: (n: AstNode) => void): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walkAst(item, visit);
    return;
  }
  const astNode = node as AstNode;
  visit(astNode);
  for (const val of Object.values(astNode)) {
    if (val && typeof val === "object") walkAst(val, visit);
  }
}

function minifyLitTemplates(): Plugin {
  return {
    name: "minify-lit-templates",
    apply: "build",
    transform(code, id) {
      if (id.includes("node_modules") || !id.endsWith(".ts")) return null;
      const ast = this.parse(code);
      const edits: Array<{ start: number; end: number; text: string }> = [];
      walkAst(ast, (node) => {
        if (
          node.type === "TaggedTemplateExpression" &&
          node.tag?.type === "Identifier" &&
          node.tag.name &&
          LIT_TAGS.has(node.tag.name) &&
          node.quasi?.quasis
        ) {
          for (const q of node.quasi.quasis) {
            const raw = code.slice(q.start, q.end);
            const compact = raw.replace(/[ \t]*[\r\n]+[ \t]*/g, " ");
            if (compact !== raw) {
              edits.push({ start: q.start, end: q.end, text: compact });
            }
          }
        }
      });
      if (edits.length === 0) return null;
      edits.sort((a, b) => b.start - a.start);
      let out = code;
      for (const edit of edits) {
        out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
      }
      return { code: out, map: null };
    },
  };
}

export default defineConfig({
  plugins: [minifyLitTemplates()],
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
