import {defineConfig, globalIgnores} from "eslint/config";
import friday from "@next-friday/eslint-config-friday";

export default defineConfig(
  globalIgnores([
    "coverage/**",
    "dist/**",
    "templates/**",
    ".claude/skills/**",
    "plugins/sdlc/adapters/claude-code/skills/**",
  ]),
  friday(),
  {
    settings: {
      n: {
        convertPath: {
          "src/**/*.ts": [String.raw`^src/(.+)\.ts$`, "dist/$1.mjs"],
        },
      },
    },
  },
);
