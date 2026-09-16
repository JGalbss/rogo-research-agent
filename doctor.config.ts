import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    files: ["src/frontend/components/atoms/**", "src/frontend/components/primitives/**"],
    overrides: [
      {
        // UIMessage parts are append-only and never reordered, so the index is a stable identity.
        files: ["src/frontend/components/chat/MessageBubble.tsx"],
        rules: ["react-doctor/no-array-index-as-key"],
      },
    ],
  },
});
