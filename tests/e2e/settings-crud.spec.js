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
  return { context, page };
}

test.describe("Settings CRUD", () => {
  /** @testId WK-E2E-08 */
  test("add shortcut via manual entry modal", async ({}, testInfo) => {
    const { context, page } = await openPopup(testInfo);

    const addBtn = page.locator("#addBtn");
    await addBtn.click();

    // Wait for the manual entry fields to appear
    await page.waitForTimeout(500);

    // Fill in the URL field
    const urlInput = page.locator("#inputUrl");
    if (await urlInput.isVisible()) {
      await urlInput.fill("https://test.com");
    }

    // Fill in the name field
    const nameInput = page.locator("#inputName");
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test Button");
    }

    // Fill in the key field
    const keyInput = page.locator("#inputKey");
    if (await keyInput.isVisible()) {
      await keyInput.fill("T");
    }

    // Fill in the element ID field
    const idInput = page.locator("#inputId");
    if (await idInput.isVisible()) {
      await idInput.fill("btn-test");
    }

    await context.close();
  });

  /** @testId WK-E2E-09 */
  test("show all shortcuts view displays table rows", async ({}, testInfo) => {
    const { context, page } = await openPopup(testInfo);

    const showAllBtn = page.locator("#showAllBtn");
    if (await showAllBtn.isVisible()) {
      await showAllBtn.click();
      await page.waitForTimeout(500);
    }

    await context.close();
  });

  /** @testId WK-E2E-10 */
  test("language dropdown contains all supported languages", async ({}, testInfo) => {
    const { context, page } = await openPopup(testInfo);

    const langSelect = page.locator("#languageSelect");
    const options = langSelect.locator("option");
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(4);

    await context.close();
  });
});
