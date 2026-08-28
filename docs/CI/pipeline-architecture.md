# Testing Pipeline Architecture

This document describes the design decisions, test isolation strategies, and environment configurations that make up the z.WebKeyBind testing pipeline.

## Execution Model

z.WebKeyBind is a vanilla JS extension with zero build steps. The testing architecture reflects this by decoupling tests into discrete environments:

```
                  ┌──────────────────────────────────────────────┐
                  │              Jest Environment                │
                  │        (jsdom + Node.js Context)             │
                  └──────┬───────────────────────────────┬───────┘
                         │                               │
             ┌───────────▼───────────┐       ┌───────────▼───────────┐
             │      Unit Tests       │       │   Integration Tests   │
             │   (Pure JS Modules)   │       │ (Storage & Messaging) │
             └───────────┬───────────┘       └───────────┬───────────┘
                         │                               │
                         └───────────────┬───────────────┘
                                         │ Loads
                               ┌─────────▼─────────┐
                               │  chrome-mock.js   │
                               └───────────────────┘
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  │          Playwright Browser Context          │
                  │             (E2E & Accessibility)            │
                  └──────┬───────────────────────────────┬──────┘
                         │                               │
             ┌───────────▼───────────┐       ┌───────────▼───────────┐
             │      Chrome E2E       │       │      Firefox E2E      │
             │   (--load-extension)  │       │ (Temporary Extension) │
             └───────────┬───────────┘       └───────────┬───────────┘
                         │                               │
                         └───────────────┬───────────────┘
                                         │ Targets
                               ┌─────────▼─────────┐
                               │   Test Fixtures   │
                               │  (http-server)    │
                               └───────────────────┘
```

## Chrome WebExtensions Mock (`chrome-mock.js`)

Because the extension runs directly in browser runtimes, Jest tests running in `jsdom` require a simulated Chrome API boundary. Instead of simple spy methods (`jest.fn()`), we implemented a fully reactive WebExtensions proxy:

*   **In-Memory Storage Backing:** Mocks `chrome.storage.local` using an internal `Map` object. Writes via `.set()` and deletes via `.remove()` perform deep-cloned JSON round-trips to accurately model asynchronous storage latency and serialization boundary rules.
*   **Reactive Event Dispatcher:** Tracks listeners added to `chrome.storage.onChanged`. Any local write or delete operation automatically calculates the differences and notifies all registered listeners with `{ oldValue, newValue }` pairs.
*   **Tab & Navigation Emulation:** Simulates tab querying and script execution to verify options panel and foreground content messaging synchronization.

## E2E Server Environment

E2E tests use Playwright to spin up actual browser profiles.
*   **Extension Sandbox:** Launches a Chrome instance with `--load-extension` flags to execute extension panels and background service workers in their isolated extension context.
*   **Local Fixture Webserver:** Runs a lightweight `http-server` process hosting static target pages (`tests/fixtures/`) on port 8765 to serve as destination targets for key combinations and healing verification.

## CI Workflow Stages

Our GitHub Actions configurations are split into three quality gates:

1.  **PR Quality Gate (`pr-gate.yml`):** Runs on pull requests targeting `main`. Executes ESLint quality audits, runs all Jest test suites, checks requirement trace compliance, and performs a Chromium-only E2E smoke scan. It must complete in under 10 minutes.
2.  **Full Integration (`main-full.yml`):** Runs on push to the `main` branch. Executes full cross-browser E2E (Chromium + Firefox) matrices, full accessibility scans, and builds the production zip package (`z.WebKeyBind-v1.0.2.zip`) excluding dev configs and tests.
3.  **Nightly Audit (`nightly.yml`):** Triggers daily at 02:00 UTC. Conducts vulnerability audits (`npm audit`), Jest static security verification, and regression matrices.
