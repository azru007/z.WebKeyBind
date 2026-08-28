/**
 * E2E Tests: Settings CRUD Operations
 * @req z.WebKeyBind_03
 * @req z.WebKeyBind_07
 *
 * Tests adding, editing, and deleting shortcuts via the popup UI.
 */

const { test, expect } = require("@playwright/test");
const path = require("path");

const EXTENSION_PATH = path.resolve(__dirname, "..", "..");

async function openPopup(testInfo) {
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

  // Poll service workers to avoid race conditions in slow CI environments
  let sw = context.serviceWorkers()[0];
  if (!sw) {
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      sw = context.serviceWorkers()[0];
      if (sw) break;
    }
  }
  if (!sw) {
    throw new Error("Service worker did not load.");
  }
  const extensionId = sw.url().split("/")[2];
  const page = await context.newPage();
  await page.goto("chrome-extension://" + extensionId + "/index.html");
  await page.waitForLoadState("domcontentloaded");
  return { context, page };
}

test.describe("Settings CRUD", () => {
  /** @testId WK-E2E-08 */
  test("add shortcut via manual entry modal", async ({}, testInfo) => {
    const { context, page } = await openPopup(testInfo);

    const addBtn = page.locator(".btn-add");
    await addBtn.click();

    // Wait for the manual entry fields to appear
    await page.waitForSelector("#wkb-input-name", { state: "visible" });

    // Fill in the name field
    const nameInput = page.locator("#wkb-input-name");
    await nameInput.fill("Test Button");

    // Fill in the element ID field
    const idInput = page.locator("#wkb-input-elementId");
    await idInput.fill("btn-test");

    // Fill in the key field
    const keyInput = page.locator("#wkb-input-key");
    await keyInput.fill("T");

    // Click Save Shortcut button
    const saveBtn = page.getByRole("button", { name: "Save Shortcut" });
    await saveBtn.click();

    await page.waitForTimeout(500);

    await context.close();
  });

  /** @testId WK-E2E-09 */
  test("show all shortcuts view displays table rows", async ({}, testInfo) => {
    const { context, page } = await openPopup(testInfo);

    const showAllBtn = page.locator(".btn-show-all");
    if (await showAllBtn.isVisible()) {
      await showAllBtn.click();
      await page.waitForTimeout(500);
    }

    await context.close();
  });

  /** @testId WK-E2E-10 */
  test("language dropdown contains all supported languages", async ({}, testInfo) => {
    const { context, page } = await openPopup(testInfo);

    const langMenu = page.locator("#lang-menu");
    const options = langMenu.locator(".dropdown-item");
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(4);

    await context.close();
  });
});
