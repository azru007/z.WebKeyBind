# z.WebKeyBind Documentation

z.WebKeyBind is a web browser extension designed for accessibility and productivity, enabling users to map custom alphanumeric keyboard shortcuts (A-Z, 0-9) to clickable DOM elements on web pages.

## Features

- Custom Keyboard Shortcut Mapping: Assign single alphanumeric key triggers (`Alt+[Key]`) to interactive DOM elements.
- Robust Element Healing: Resolves broken CSS selectors using DOM element metadata profiles (ID, tag, innerText, aria-label, data-testid, href, CSS path).
- Screen Reader Accessibility Engine: Built-in Dual-Toggle ARIA-live announcer for instant feedback in NVDA, JAWS, and VoiceOver.
- Multi-Language Localization: Built-in translation dictionaries for English, Hindi, Marathi, and Malayalam.
- Data Import and Export: JSON-based backup, restore, single-site export, and full-database export with conflict resolution algorithms.
- Full Accessibility Keybinding Navigation: Manual creation mode via mouse hover or keyboard Tab navigation (`Alt+Shift+C`).

## Supported Browsers

- Mozilla Firefox: Version 142.0 and above.
- Google Chrome: Manifest V3 compliant.
- Microsoft Edge: Manifest V3 compliant.

## Developer Quick Start

1. Clone repository: `git clone https://github.com/yourdomain/z.WebKeyBind.git`
2. Open target browser extension management page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Firefox: `about:debugging#/runtime/this-firefox`
3. Enable Developer Mode (Chrome and Edge).
4. Load unpackaged extension:
   - Chrome/Edge: Select the workspace directory containing `manifest.json`.
   - Firefox: Select `manifest.json` via Load Temporary Add-on.

## Documentation Directory Index

- [Architecture](architecture.md): System process model, manifest structure, component communication channels, and security boundaries.
- [Codebase Guide](codebase.md): File-by-file directory tree, module responsibility breakdowns, and public/internal script boundaries.
- [Workflow and Sequence](workflow.md): Step-by-step state transitions, messaging sequences, initialization, and creation flow execution.
- [Feature Specifications](features.md): Technical breakdown of creation mode, healing engine, accessibility voice engine, import/export, and language selection.
- [API Reference](api-reference.md): Complete signature, parameters, return type, side effects, and calling context for every internal function.
- [Permissions](permissions.md): Declared extension permissions, host patterns, justification map, and security privilege boundaries.
- [Storage Architecture](storage.md): Local storage schemas, key prefixing conventions, read/write concurrency patterns, and transaction strategies.
- [Messaging Protocol](messaging.md): Message schemas, sender/receiver topologies, command handling, and connection lifecycle.
- [UI Architecture](ui.md): DOM structure, event handlers, modal dialogues, accessibility tree bindings, and CSS component specs.
- [Security Model](security.md): Content Security Policy, HTML sanitization, input validation, selector safety, and privilege separation.
- [Testing Specification](testing.md): Automated test strategies, browser API mocks, CI pipeline specs, and testable assertion checklists.
- [Build and Release](build-and-release.md): Packaging requirements, browser store manifest targets, versioning scheme, and release verification.
- [Development Guide](development.md): Development environment setup, debugging instructions per context, and linting rules.
- [Glossary](glossary.md): Technical dictionary of domain terms and architectural concepts used throughout the codebase.
