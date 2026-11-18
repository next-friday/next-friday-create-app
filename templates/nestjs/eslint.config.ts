import {defineConfig, globalIgnores} from "eslint/config";
import friday from "@next-friday/eslint-config-friday";

export default defineConfig(
  globalIgnores([".agents/**", ".claude/**", "coverage/**", "dist/**"]),
  friday(),
);
