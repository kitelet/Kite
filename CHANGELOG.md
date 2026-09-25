# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-25

### Added

- **Kite Core Engine (`@kitelet/core`) — Initial Release**:
  - **Reactivity & State**:
    - `kite-scope`: Reactive scope proxies with automatic nested tracking via `Proxy` and microtask batching (`queueMicrotask`).
    - `<kite-model>`: Named state models with method binding and API injection.
    - `<kite-store>`: App-wide singleton reactive state stores.
    - `kite-computed`: Derived state properties.
    - `kite-watch`: Reactive property change watchers.
    - `kite-persist`: Automatic `localStorage` and `sessionStorage` persistence with optional TTL.
    - `kite-reset`: Declarative scope and form reset triggers.
  - **Rendering & Binding**:
    - Declarative directives: `kite-text` (HTML-escaped), `kite-html` (sanitized), `kite-bind:*`, `kite-class:*`, `kite-style:*`, `kite-show`, `kite-if`, `kite-elif`, `kite-else`.
    - `kite-for`: Structural iteration with index `(item, i) in items`, ranges `n in 1..10`, objects `(v, k) in obj`, and inline `where` filtering.
    - `<slot>` & `<kite-fragment>`: Named and default slot projection, wrapperless fragments.
    - Utility helpers: `money`, `date`, `number`, `timeago`, `slug`, `trim`.
  - **Events & Interactivity**:
    - `kite-on-*`: Native event directives with modifiers (`.prevent`, `.stop`, `.once`, `.self`, `.debounce="300"`, `.throttle="100"`).
    - Keyboard filters: `.enter`, `.escape`, `.tab`, `.space`, `.up`, `.down`.
    - `kite-shortcut`: Global keyboard shortcuts (`ctrl+s`, `escape`).
    - `kite-emit`: Component-to-parent custom event dispatch.
    - `kite-copy`: Direct clipboard copy utility.
  - **Forms & Inputs**:
    - `kite-model`: Two-way input binding with `.number`, `.trim`, and `.lazy` modifiers.
    - Form validation: `kite-validate`, `kite-required`, `kite-pattern`, `kite-min`, `kite-max`, `kite-error`, with automatic `form.valid` and `form.dirty` flags.
  - **Declarative Components**:
    - `<kite-component name="...">`: Declarative component templates with isolated scope.
    - `<kite-use name="...">`: Instantiation with attributes passed as component props.
    - Scoped styling: `kite-shadow` and `<style>` blocks scoped via `:host` (scaffoldable via `kite make:component --styled`).
  - **MVCR Architecture in Native HTML**:
    - `<kite-model>`: Reactive data, methods, and backend API integration.
    - `<kite-view>`: Template presentation layers bound to models.
    - `<kite-controller>` & `<kite-action>`: Named behaviors and reusable action handlers.
    - `<kite-route>` & `<kite-outlet>`: Declarative client-side hash routing with path parameters (`/users/:id`), wildcards, and active links (`kite-active-class`).
  - **Backend Clients & Adapters**:
    - `<kite-api>` & `<kite-header>`: Declarative backend endpoint configurations.
    - Pluggable adapters: `rest`, `json`, `graphql`, and `local` (offline persistent browser storage).
    - Automatic reactive model flags: `loading`, `error`, `empty`, and periodic polling with `kite-poll`.
  - **Safe Expression Engine & Security**:
    - Zero `eval()` or `new Function()`: 100% strict Content Security Policy (CSP) compliance.
    - Recursive-descent expression parser and tokenizer in `src/utils/expr.js`.
    - Strict HTML sanitizer for XSS protection in `src/utils/sanitize.js`.
    - Prototype pollution protection: blocked access to `__proto__`, `prototype`, and `constructor`.
    - Recursion and DoS safeguards: circular component depth limit (depth: 5) and `kite-for` iteration cap (2,000 items).

- **Agentic-Ready Toolkit**:
  - Machine-readable metadata in `.kite/`:
    - `manifest.json`: Project layout, counts, and entry points.
    - `capabilities.json`: Complete dictionary of all 22 directives, custom tags, public JavaScript APIs, and template helpers.
    - `rules.json`: Checkable architectural and safety rules with severity levels and check methods.
    - `conventions.json`: 9-slot markup attribute ordering, naming standards, and file patterns.
    - `limits.json`: Explicit scale limits (<500 nodes), graduation triggers, and non-goals.
  - Draft-07 JSON Schemas in `.kite/schemas/` for all `.kite/*.json` files.
  - Master orientation files:
    - `AGENTS.md`: Master onboarding file for AI coding agents with project layout, design laws, and What NOT to do.
    - `llms.txt`: Structured summary following the llms.txt standard.
    - `llms-full.txt`: Compiled 231 KB plain-text corpus of all 28 framework documentation files for single-fetch AI ingestion.
  - IDE-specific rule configurations: `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, `.windsurfrules`, `.aider.conf.yml`, `.continue/config.json`.
  - CLI automation:
    - `kite agentic:build` (alias `kite agentic`): Compiles docs into `llms-full.txt`, synchronizes manifest, and updates IDE files.
    - `kite agentic:check`: Audits project files against capabilities and schemas in CI.
  - Project scaffolding integration: `kite new` automatically seeds the agentic file layer into new projects.

- **Developer Tooling & CLI (`kite`)**:
  - Zero-dependency Node.js CLI: `kite new`, `kite make:model`, `kite make:view`, `kite make:component`, `kite make:controller`, `kite make:route`, `kite make:api`.
  - `kite doctor`: System diagnostics, node count warnings, and graduation advisory.
  - `kite format --sort-attrs`: Formats templates and sorts attributes into the 9-slot convention.
  - `kite serve`: Local static development server.
  - Editor integrations: VS Code extension (`tools/vscode-kite`), ESLint plugin (`tools/eslint-plugin-kite`), and language server (`tools/kite-language-server`).

- **Documentation Portal & Interactive Learning (`docs/`)**:
  - Live interactive web portal hosted at `https://getkite.netlify.app`.
  - Built-in offline-first single-pass tokenizer lexer supporting HTML, Blade/PHP, JavaScript, CSS, and Bash with zero external library overhead.
  - Multi-tab file code blocks with document-level delegated clipboard copy utility and visual feedback.
  - High-contrast Light and Dark mode syntax themes with custom slim scrollbars adhering to WCAG 2.1 AA contrast standards.
  - Responsive client-side markdown loader, real-time search filter, mobile navigation drawer, and deep hash routing.
  - 28 comprehensive guides organized into 4 progressive tiers (`1-basics/`, `2-architecture/`, `3-internals/`, `4-guides/`).

- **Showcase Gallery & UI Polish (`examples/`)**:
  - Categorized demo gallery: Basics (Counter, Todo, CRUD, Calculator), Architecture (Reusable MVCR), Styling (Vanilla, Tailwind, Bootstrap), Advanced (API Fetch, Custom Directives, Error Boundaries), and Laravel Blade integration snippets.
  - Unified design system in `examples/shared.css` with responsive layout and theme variables.
  - Polished preview topbar spacing (`.kite-topbar`) providing generous vertical clearance from browser tab bars and window chrome.
  - Creator Banner Kit with copyable embed snippets and visual badges.
  - Production starters and templates: `starter`, `dashboard`, `full`, `component-kit`.

- **Distribution & Deployment Isolation**:
  - Strict packaging isolation: `.npmignore` and updated `.gitignore` ensure `@kitelet/core` distributes purely as the minimal runtime without development tools, tests, or scratch files.
  - Production-ready `dist/kite.min.js` and `dist/kite.css` bundles with global fallback support.
  - 100% test pass rate across all 405 automated test assertions.

### Guarantees

- **Zero Runtime Dependencies**: `@kitelet/core` has zero external dependencies.
- **Zero CLI Dependencies**: CLI tools run on Node.js stdlib only.
- **Strict CSP Compliant**: Runs without `unsafe-eval` or dynamic code generation.
- **Public Domain & Documentation**: Hosted at `https://getkite.netlify.app`.
