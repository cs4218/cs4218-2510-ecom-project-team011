import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./client/src/pages/__tests__",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [["html"], ["list"]],

  use: {
    actionTimeout: 0,
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      // Backend API server
      command: "npm run server",
      cwd: "./",
      url: "http://127.0.0.1:6060/", 
      timeout: 180_000,
      reuseExistingServer: !isCI,
      stdout: "pipe", // ✅ See backend logs
      stderr: "pipe", // ✅ See backend errors
    },
    {
      // Frontend dev server
      command: "npm run client",
      cwd: "./",
      url: "http://127.0.0.1:3000/",
      timeout: 180_000,
      reuseExistingServer: !isCI,
      env: {
        BROWSER: "none", 
        CI: "true",
        PORT: "3000", 
      },
      stdout: "pipe", 
      stderr: "pipe",
    },
  ],
});
