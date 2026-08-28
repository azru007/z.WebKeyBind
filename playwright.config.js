// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    headless: false,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {}
    },
    {
      name: "firefox",
      use: {}
    }
  ],
  webServer: {
    command: "npx http-server tests/fixtures -p 8765 -c-1 --silent",
    port: 8765,
    reuseExistingServer: true
  }
});
