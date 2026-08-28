/**
 * E2E Tests: Extension Popup Opening
 * @req z.WebKeyBind_01
 * @req z.WebKeyBind_02
 *
 * Verifies the extension popup opens and loads its UI correctly.
 */

const { test, expect } = require("@playwright/test");
const path = require("path");

const EXTENSION_PATH = path.resolve(__dirname, "..", "..");

test.describe("Extension popup", () => {
  /** @testId WK-E2E-01 */
  test("popup loads and displays settings title", async ({}, testInfo) => {
    // Skip on Firefox (extension loading differs)
    test.skip(testInfo.project.name === "firefox", "Firefox extension loading requires different approach");

    const { chromium } = require("@playwright/test");
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        "--disable-extensions-except=" + EXTENSION_PATH,
        "--load-extension=" + EXTENSION_PATH,
        "--no-first-run",
        "--disable-gpu"
      ]
    });

    // Get service worker to find extension ID
    let sw;
    if (context.serviceWorkers().length > 0) {
      sw = context.serviceWorkers()[0];
    } else {
      sw = await context.waitForEvent("serviceworker");
    }
    const extensionId = sw.url().split("/")[2];

    // Open popup page directly
    const page = await context.newPage();
    await page.goto("chrome-extension://" + extensionId + "/index.html");
    await page.waitForLoadState("domcontentloaded");

    // Verify the settings heading is visible
    const heading = page.locator("h2").first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  /** @testId WK-E2E-02 */
  test("popup contains required UI sections", async ({}, testInfo) => {
    test.skip(testInfo.project.name === "firefox", "Firefox extension loading requires different approach");

    const { chromium } = require("@playwright/test");
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        "--disable-extensions-except=" + EXTENSION_PATH,
        "--load-extension=" + EXTENSION_PATH,
        "--no-first-run",
        "--disable-gpu"
      ]
    });

    let sw;
    if (context.serviceWorkers().length > 0) {
      sw = context.serviceWorkers()[0];
    } else {
      sw = await context.waitForEvent("serviceworker");
    }
    const extensionId = sw.url().split("/")[2];

    const page = await context.newPage();
    await page.goto("chrome-extension://" + extensionId + "/index.html");
    await page.waitForLoadState("domcontentloaded");

    // Verify table exists
    const table = page.locator("table");
    await expect(table).toBeVisible({ timeout: 5000 });

    // Verify Add button exists
    const addBtn = page.locator("#addBtn");
    await expect(addBtn).toBeVisible();

    // Verify language selector exists
    const langSelect = page.locator("#languageSelect");
    await expect(langSelect).toBeVisible();

    await context.close();
  });
});
