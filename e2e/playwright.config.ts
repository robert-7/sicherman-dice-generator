import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

// Exercises the app the way a user actually reaches it: the production Docker
// Compose stack (nginx serving the built frontend, proxying /api to FastAPI),
// not the Vite dev server. That's the integration path unit tests can't cover.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "docker compose -f ../docker-compose.yml up --build",
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
