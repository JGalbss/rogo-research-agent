import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    files: ["src/frontend/components/atoms/**", "src/frontend/components/primitives/**"],
  },
});
