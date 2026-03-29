import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/missile-defense/",
  server: {
    port: 5173
  },
  test: {
    environment: "jsdom"
  }
});
