# Kite Documentation Portal
> **HTML is enough for small things.** A teaching toolkit for small, self-contained web apps. Reusable components, reactive state, and MVCR architecture directly in HTML with zero build steps and zero user JavaScript.

Welcome to the official Kite documentation portal. Kite is a CDN-ready, zero-boilerplate **teaching toolkit** that turns standard HTML attributes and custom tags into full reactivity.

> [!TIP]
> **Live Interactive Web Documentation & REPL**: Browse this documentation live with search, theme switcher, and an interactive in-browser live playground at [**getkite.netlify.app**](https://getkite.netlify.app/).

Whether you are building simple interactive widgets for a server-rendered site or constructing small self-contained applications, this curriculum is organized to be **approachable**, **educational**, and **friendly**.

---

## Organized Learning Curriculum

Our curriculum is organized into four progressive tiers:

### Tier 1: Basics
Essential foundations to get up and running with reactive HTML:

| Guide | Description | Key Topics |
| :--- | :--- | :--- |
| [**Getting Started**](./1-basics/getting-started.md) | 5-minute hands-on quickstart from CDN script to your first reactive UI. | Setup, Counter, Form Sync, Lists, Cloaking |
| [**Syntax Cheat Sheet**](./1-basics/cheatsheet.md) | 1-page quick syntax reference for all directives, modifiers, MVCR tags, and CLI commands. | All directives, Modifiers, Tags, CLI |
| [**Directives Reference**](./1-basics/directives.md) | Comprehensive encyclopedia of every `kite-*` attribute and modifier. | `kite-scope`, `kite-text`, `kite-bind`, `kite-for`, etc. |
| [**Forms & Two-Way Binding**](./1-basics/forms.md) | In-depth guide to form controls, synchronization, and validation. | Text, Checkboxes, Radios, Selects, Validation |
| [**Styling, Cloaking & Transitions**](./1-basics/styling.md) | Cloaking with `kite-cloak`, custom element layout, and Tailwind CSS. | FOUC, `display: contents`, Dynamic Classes |
| [**Markup Convention**](./1-basics/markup.md) | Standard 9-category attribute ordering convention for readable markup. | Attribute order, Tooling, ESLint, CLI format |
| [**Limits & Sweet Spots**](./1-basics/limits.md) | Honest numbers: node counts (<500), model limits (<20), what Kite is good and bad at. | Bounds, Constraints, Scale Numbers |

---

### Tier 2: Architecture
Structure your small applications with reusable templates and clear separation:

| Guide | Description | Key Topics |
| :--- | :--- | :--- |
| [**Declarative Components**](./2-architecture/components.md) | Reusable HTML blocks with isolated scopes, props, and content slots. | `<kite-component>`, `<kite-use>`, `<slot>`, Props |
| [**MVCR Architecture**](./2-architecture/mvcr.md) | Model, View, Controller, Route expressed directly as HTML tags. | `<kite-model>`, `<kite-view>`, `<kite-controller>` |
| [**Declarative Routing**](./2-architecture/routing.md) | Zero-JS client-side hash routing for single-page applications. | `<kite-route>`, `<kite-outlet>`, Hash Navigation |
| [**Scope & Reactivity Model**](./2-architecture/scope.md) | Deep dive into JavaScript Proxies, dependency tracking, and batching. | Proxy traps, Scope hierarchy, Array interceptors |
| [**Full-Stack Reusability**](./2-architecture/reusable-components.md) | 4-layer component architecture (HTML, Styling, Behavior, MVCR) and publishing. | 4 Layers, Web Components, MVCR Bundles, npm packaging |

---

### Tier 3: Toolkit Internals
Understand how the engine operates under the hood and how to customize it:

| Guide | Description | Key Topics |
| :--- | :--- | :--- |
| [**JavaScript API Reference**](./3-internals/api.md) | Complete programmatic API documentation for `window.Kite`. | `Kite.directive`, `Kite.model`, `Kite.navigate`, etc. |
| [**Safe Expressions & Grammar**](./3-internals/expressions.md) | Zero-`eval` recursive-descent parser, operator precedence, and safe grammar. | Tokenizer, Safe Globals, Blocklists, Precedence |
| [**Keeping Your Apps Safe**](./3-internals/security.md) | Strict CSP compliance without `unsafe-eval`, XSS prevention, prototype defense, and privacy. | CSP, Zero-`eval`, Threat Model, Sanitization |
| [**Extending Kite**](./3-internals/extending.md) | Extension points: custom directives, helpers, rules, lifecycle hooks, and adapters. | `Kite.directive`, `Kite.hook`, `Kite.middleware`, plugins |
| [**CLI & Project Scaffolding**](./3-internals/cli.md) | Full CLI reference: `kite new`, `kite make:*`, `g:*` aliases, flags, dev server, build presets. | Templates, Dev Server, Build, Presets, Scale Doctor |
| [**Agentic-Ready Toolkit**](./3-internals/agentic.md) | Machine-readable metadata, schemas, AGENTS.md, and crawler ingestion. | `AGENTS.md`, `.kite/*.json`, `llms.txt`, IDE configs |
| [**Testing & Debugging Guide**](./3-internals/testing.md) | Headless unit tests, browser assertions, and DevTools diagnostics. | `tests/run-tests.js`, `tests/index.html`, Diagnostics |

---

### Tier 4: Guides & Solutions
Practical examples, recipes, integrations, and your graduation path:

| Guide | Description | Key Topics |
| :--- | :--- | :--- |
| [**Cookbook & Recipes**](./4-guides/cookbook.md) | Battle-tested, copy-pasteable UI patterns for small apps. | Search filters, Modals, Tabs, Accordions, Carts |
| [**Full CRUD Guide**](./4-guides/crud.md) | In-memory and API-backed CRUD patterns, modal editing, and local state. | Create, Read, Update, Delete, Local & API |
| [**Backend Integrations**](./4-guides/backend-integrations.md) | Seamless coexistence with Laravel Blade, Django, Rails ERB, Go, and ASP.NET. | Blade `@verbatim`, Jinja2, Rails, Go, Razor |
| [**Kite + Laravel**](./4-guides/laravel.md) | Dedicated guide: Blade layouts, CSRF, Sanctum, Livewire, and Inertia. | Blade, CSRF, Sanctum, Livewire, CRUD Todo |
| [**Graduating from Kite**](./4-guides/graduating.md) | The exit path: 7 graduation triggers, migration mappings to Lit, Alpine, Vue, Svelte, React, htmx. | Triggers, Exit Strategy, Syntax Mappings |
| [**Migrating into Kite**](./4-guides/migrations.md) | Side-by-side migration mappings from Alpine.js, HTMX, React, and Vue to Kite. | Alpine → Kite, HTMX → Kite, React, Vue |
| [**Stability & Versioning**](./4-guides/stability.md) | SemVer guarantees, frozen public API surfaces, and deprecation lifecycle. | SemVer 2.0.0, Frozen APIs, Deprecation |
| [**FAQ & Trade-offs**](./4-guides/faq.md) | Honest answers on performance, security, and comparison with React/Alpine. | Comparison matrix, Backend integration, CSP |
| [**Attributions & Copyrights**](./4-guides/attributions.md) | Open-source tool appreciations, artwork credits, and MIT license terms. | Artwork, Open Source Credits, MIT License |

---

## Core Design Principles

Kite is designed around clear engineering principles:

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **HTML is the API** | If it cannot be expressed as an HTML attribute or tag, it does not belong in Kite. |
| 2 | **Zero boilerplate** | One `<script>` tag. No installation steps, no bundlers, and no configuration files. |
| 3 | **No user JS required** | Developers *may* write JavaScript, but never *have to*. |
| 4 | **Non-invasive** | Kite never touches native prototypes, monkey-patches global APIs, or hijacks native DOM elements. |
| 5 | **Progressive** | If JavaScript is disabled or fails to load, native HTML forms submit and standard CSS renders cleanly. |
| 6 | **Readable source** | Every source file reads like an educational tutorial: small modules, clear names, zero obfuscation. |
| 7 | **Teach by existing** | Every internal subsystem is a lesson: state management, proxy traps, event dispatch, and safe parsing. |
| 8 | **Standard-first** | Built on modern web standards (ES modules, `Proxy`, `queueMicrotask`, `<template>`, custom elements). |
| 9 | **Extensible by design** | Registering a new directive takes one function call and one file (`Kite.directive()`). |
| 10 | **Playful, not preachy** | Helpful and actionable console messages with the signature `[Kite 🪁]` prefix. |
| 11 | **Components are local-first** | Define reusable templates on the page; use them on the page. No build pipeline or registration scripts. |
| 12 | **MVCR is visible in HTML** | Model, View, Controller, Route are native HTML tags, not hidden toolkit abstractions. |
| 13 | **Optionality is mandatory** | Every layer is optional. Use single inline attributes, full MVCR, or anything in between. |

---

## Recommended Learning Paths

### Path A: Progressive Enhancement (5 minutes)
If you already have a server-rendered website (PHP, Django, Laravel, Rails, Go, ASP.NET) and need interactive widgets:
1. Start with [**Getting Started**](./1-basics/getting-started.md).
2. Learn `kite-scope`, `kite-text`, `kite-show`, and `kite-on-click` in [**Directives Reference**](./1-basics/directives.md).
3. Review [**Forms & Two-Way Binding**](./1-basics/forms.md) for input handling.
4. Use `[kite-cloak]` from [**Styling & Cloaking**](./1-basics/styling.md) to prevent initial page flickers.

### Path B: Small Single-Page App (15 minutes)
If you are building an interactive dashboard, prototype, or internal tool:
1. Read [**Declarative Components**](./2-architecture/components.md) for template reuse.
2. Structure your state and logic with [**MVCR Architecture**](./2-architecture/mvcr.md).
3. Connect multi-screen views using [**Declarative Routing**](./2-architecture/routing.md).
4. Review [**Limits & Sweet Spots**](./1-basics/limits.md) to ensure your app stays within comfortable boundaries.
