import {defineConfig, globalIgnores} from "eslint/config";
import friday from "@next-friday/eslint-config-friday";
import nextPlugin, {configs as nextConfigs} from "@next/eslint-plugin-next";

export default defineConfig(
  globalIgnores([
    ".agents/**",
    ".claude/**",
    ".cursor/**",
    "**/.next/**",
    "**/out/**",
    "**/next-env.d.ts",
    "**/coverage/**",
    "**/playwright-report/**",
    "**/test-results/**",
    "apps/backoffice/src/app/(payload)/**",
    "apps/backoffice/src/migrations/**",
    "apps/backoffice/src/payload-types.ts",
  ]),
  friday({
    react: true,
  }),
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    settings: {
      next: {
        rootDir: ["apps/*/"],
      },
    },
    rules: nextConfigs["core-web-vitals"].rules,
  },
  {
    rules: {
      "friday/component-module": "off",
    },
    files: ["apps/*/app/**/{page,layout}.tsx", "apps/*/src/app/**/{page,layout}.tsx"],
  },
);
