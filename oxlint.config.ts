import { defineConfig } from "oxlint";
import { ignorePatterns, recommended } from "./tools/oxlint/guardrails/preset.ts";

export default defineConfig({
  ...recommended({ effect: true }),
  ignorePatterns: [...ignorePatterns(), "src/frontend/components/**"],
});
