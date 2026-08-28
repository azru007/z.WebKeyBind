# z.WebKeyBind CI Pipeline and Testing Framework

Welcome to the automated test suite and Continuous Integration (CI) guide for z.WebKeyBind. Since this extension is built entirely using vanilla JavaScript, the testing framework has been built from scratch to support testing extension components without requiring complex build steps or bundling.

## Directory Layout

```
z.WebKeyBind/
├── .github/
│   └── workflows/
│       ├── pr-gate.yml         # PR quality gate (lint, Jest, coverage-gate, E2E smoke)
│       ├── main-full.yml       # Push to main pipeline (full browser E2E, artifact build)
│       └── nightly.yml         # Daily security audit and full regression verification
├── scripts/
│   └── coverage-gate.js        # Requirements coverage & traceability gate script
├── tests/
│   ├── setup/
│   │   ├── chrome-mock.js      # Complete mock of Chrome WebExtensions APIs
│   │   └── test-helpers.js     # Helper utilities for unit tests
│   ├── fixtures/               # HTML pages used for integration & E2E testing
│   ├── unit/                   # Unit tests for independent pure logic modules
│   ├── integration/            # Storage and messaging integration tests
│   ├── e2e/                    # Playwright browser automation test cases
│   ├── a11y/                   # Axe-core accessibility verification specs
│   └── security/               # Manifest, CSP, and static analysis security tests
└── docs/CI/                    # Testing framework and pipeline documentation
```

## Available Test Command Interfaces

Run these commands from the project root:

*   `npm run lint` — Runs ESLint code quality audits with strict extension rules.
*   `npm test` — Runs all unit, integration, and security Jest test suites.
*   `npm run test:unit` — Runs only unit test suites.
*   `npm run test:integration` — Runs only integration test suites.
*   `npm run test:security` — Runs static security analysis and manifest audit tests.
*   `npm run test:e2e` — Runs Playwright E2E browser automation (Chromium + Firefox).
*   `npm run test:e2e:chromium` — Runs Playwright E2E tests against Chromium/Chrome only.
*   `npm run test:a11y` — Runs accessibility auditing tests using @axe-core/playwright.
*   `npm run test:coverage-gate` — Runs the Requirements Coverage validation script.
*   `npm run test:all` — Convienence command that runs lints, Jest tests, and E2E Chromium tests locally.

## Documentation Index

Please consult the following detail pages for working with the test suites:
1. [Pipeline Architecture](pipeline-architecture.md) — The design of the testing execution model, Chrome API mocks, and CI workflows.
2. [Adding Tests](adding-tests.md) — Step-by-step guide for creating new unit, integration, E2E, accessibility, or security tests.
3. [Modifying Tests](modifying-tests.md) — Instructions for modifying test cases or updating assertions.
4. [Removing Tests](removing-tests.md) — Procedures for deprecating test cases and cleaning up tags.
5. [Manual-Only Requirements](manual-only-requirements.md) — Boundary conditions and accessibility features requiring human verification.
6. [Security Guidelines](security.md) — Security boundaries, CSP limitations, and static analysis details.
7. [Gap Scan Findings](gap-scan-findings.md) — Codebase analysis findings, duplication resolutions, and code quality notes.
