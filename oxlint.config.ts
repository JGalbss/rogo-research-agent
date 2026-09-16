import { defineConfig } from "oxlint";
import { ignorePatterns, recommended } from "./tools/oxlint/guardrails/preset.ts";

const preset = recommended({ effect: true });

export default defineConfig({
  ...preset,
  ignorePatterns: [...ignorePatterns(), "src/frontend/components/atoms/**", "src/frontend/components/primitives/**"],
  rules: {
    ...preset.rules,
    // Express 5 forwards rejected promises from async handlers to the error middleware.
    "oxc/no-async-endpoint-handlers": "off",
  },
});
