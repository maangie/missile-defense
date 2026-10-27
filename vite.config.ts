import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/missile-defense/",
  server: {
    port: 5173
  },
  test: {
    environment: "jsdom",
    // Node 組み込みの Web Storage が jsdom の localStorage を隠すので無効にする
    execArgv: ["--no-experimental-webstorage"]
  }
});
