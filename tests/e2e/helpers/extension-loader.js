/**
 * E2E Helper: Extension Loading
 *
 * Provides utilities for loading the z.WebKeyBind extension in Playwright
 * persistent browser contexts.
 */

const path = require("path");
const { chromium } = require("@playwright/test");

const EXTENSION_PATH = path.resolve(__dirname, "..", "..");

/**
 * Launch a Chromium browser with the extension loaded.
 * Returns the browser context and service worker (background page).
 */
async function launchWithExtension() {
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      "--disable-extensions-except=" + EXTENSION_PATH,
      "--load-extension=" + EXTENSION_PATH,
      "--no-first-run"
    ]
  });

  // Wait for the service worker to be ready
  let serviceWorker;
  if (context.serviceWorkers().length > 0) {
    serviceWorker = context.serviceWorkers()[0];
  } else {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  return { context, serviceWorker };
}

/**
 * Get the extension popup page URL.
 */
function getPopupUrl(extensionId) {
  return "chrome-extension://" + extensionId + "/index.html";
}

module.exports = {
  launchWithExtension,
  getPopupUrl,
  EXTENSION_PATH
};
