import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60000,
  use: { baseURL: process.env.EMOBOOKS_TEST_URL || "http://127.0.0.1:3186", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.EMOBOOKS_TEST_URL ? undefined : {
    command: process.env.EMOBOOKS_TEST_DEV
      ? "npm run dev -- --hostname 127.0.0.1 --port 3186"
      : "npm run start -- --hostname 127.0.0.1 --port 3186",
    url: "http://127.0.0.1:3186",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
