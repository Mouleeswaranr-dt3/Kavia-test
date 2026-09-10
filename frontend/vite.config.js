import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["vscode-internal-29999-beta.beta01.cloud.kavia.ai"],
  },
  preview: {
    allowedHosts: ["vscode-internal-29999-beta.beta01.cloud.kavia.ai"],
  },
});
