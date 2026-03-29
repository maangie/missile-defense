/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  base: "/missile-defense/",
  server: {
    port: 5173
  },
  test: {
    environment: "jsdom"
  }
});
