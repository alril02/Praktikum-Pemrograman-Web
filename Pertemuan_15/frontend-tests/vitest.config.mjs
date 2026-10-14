// Letakkan di akar proyek frontend (berdampingan dengan vite.config.js).
//   npm install -D vitest @vue/test-utils happy-dom
//   tambahkan skrip:  "test:unit": "vitest run"
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom",
    include: ["tests-unit/**/*.test.js"],
    globals: false,
  },
});
