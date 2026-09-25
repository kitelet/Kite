# 🪁 Kite — Scaffolding & Project Setup

> **HTML is enough for small things.** From `npm install` to a working app in one command.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Three Ways to Start](#2-three-ways-to-start)
3. [Path 1 — CDN (Zero Install)](#3-path-1--cdn-zero-install)
4. [Path 2 — npm + CLI (Recommended)](#4-path-2--npm--cli-recommended)
5. [Templates](#5-templates)
6. [What `npm install` Actually Installs](#6-what-npm-install-actually-installs)
7. [Recommended Folder Structure](#7-recommended-folder-structure)
8. [The Scaffolded `index.html`](#8-the-scaffolded-indexhtml)
9. [The Dev Server](#9-the-dev-server)
10. [The Build](#10-the-build)
11. [Scaffolding a Feature (Not a Whole Project)](#11-scaffolding-a-feature-not-a-whole-project)
12. [Configuration Files](#12-configuration-files)
13. [Editor Setup](#13-editor-setup)
14. [What Gets Scaffolded — Full Walkthrough](#14-what-gets-scaffolded--full-walkthrough)
15. [Verifying Your Setup](#15-verifying-your-setup)
16. [Upgrading](#16-upgrading)
17. [Removing Kite](#17-removing-kite)
18. [Summary](#18-summary)

---

## 1. Prerequisites

### 1.1 Required

| Requirement | Why | Minimum |
|-------------|-----|---------|
| **Node.js** | For npm and the optional Kite CLI | v18 LTS |
| **npm** | Package install | v9 |
| **A browser** | To run the app | Any modern browser |
| **A text editor** | To write HTML | VS Code recommended |

### 1.2 Optional (Nice to Have)

| Tool | Purpose |
|------|---------|
| `npx serve` or `python -m http.server` | Local dev server |
| VS Code + Live Server extension | Auto-refresh |
| Git | Version control |

### 1.3 Not Required

Kite deliberately does **not** require:

- ❌ A bundler (webpack, vite, rollup)
- ❌ A transpiler (babel, swc)
- ❌ TypeScript
- ❌ Docker
- ❌ Any global installs

### 1.4 Install Node (If You Don't Have It)

**macOS / Linux:**
```bash
# Recommended: nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

**Windows:**
```bash
winget install OpenJS.NodeJS.LTS
```
Or download the LTS installer from [nodejs.org](https://nodejs.org).

**Verify:**
```bash
node -v   # v18.x or higher
npm -v    # v9.x or higher
```

---

## 2. Three Ways to Start

| Path | Best for | Command |
|------|----------|---------|
| **1. CDN** | Students, quick demos | Paste a `<script>` tag |
| **2. npm + CLI** | Real projects, teams | `npm create kite@latest` |
| **3. npm manual** | Custom setups | `npm install @kitelet/core` |

---

## 3. Path 1 — CDN (Zero Install)

The absolute fastest way. No Node, no npm, no folder.

Create `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My First Kite App</title>
  <script type="module" src="https://esm.sh/@kitelet/core"></script>
</head>
<body>
  <div kite-scope="{ count: 0 }">
    <button kite-on-click="count--">−</button>
    <span kite-text="count"></span>
    <button kite-on-click="count++">+</button>
  </div>
</body>
</html>
```

Open the file in a browser. Done.

**When to use:** learning, teaching, single-file demos, sharing snippets.

---

## 4. Path 2 — npm + CLI (Recommended)

### 4.1 Create a Project

```bash
npx @kitelet/core create my-app
# Or with a specific template:
npx @kitelet/core create my-app --template full
```

Then:

```bash
cd my-app
npm install
npm run dev
```

Your app opens at `http://localhost:3000`.

### 4.2 CLI Commands Reference

| Command | What it does |
|---------|--------------|
| `kite new <name> [--template <type>]` | Scaffold a new project (alias: `kite create`) |
| `kite make:<type> <name>` | Scaffold a component, view, model, etc. (alias: `kite add`) |
| `kite g:<alias> <name>` | Fast generator alias (`g:c`, `g:v`, `g:m`, `g:ct`, `g:r`, `g:p`) |
| `kite make` | Launch interactive menu generator |
| `kite list` | List all registered components, views, models, and routes |
| `kite find <query>` | Search components, views, models, and routes |
| `kite remove <name>` | Remove a piece and clean up index.html (alias: `rm`) |
| `kite rename <old> <new>` | Rename a piece and update include paths (alias: `mv`) |
| `kite info` | Display project summary and component count |
| `kite config [key] [value]` | Inspect or modify `kite.config.json` |
| `kite dev [--port] [--host] [--open] [--no-reload]` | Start dev server |
| `kite build [--out] [--no-minify]` | Build for production |
| `kite preview [--port]` | Serve the built app |
| `kite clean` | Remove `dist/` and caches |
| `kite doctor` | Check your setup for issues |
| `kite eject <module>` | Copy a built-in into your project |
| `kite upgrade` | Upgrade runtime script and styles |

### 4.3 `kite make` / `kite add` — Add Features Anytime

```bash
kite make:component card       # or: kite g:c card
kite make:view profile         # or: kite g:v profile
kite make:model todos          # or: kite g:m todos
kite make:controller todos     # or: kite g:ct todos
kite make:route /todos         # or: kite g:r /todos
kite make:plugin analytics     # or: kite g:p analytics
kite make:action logout        # injects action into controller
```

Each command:
- Creates the right file with a starter template.
- Updates `public/index.html` with the right `<kite-include>` (unless `--no-include` is passed).
- Prints a short "what changed" summary.

No magic, no hidden writes. You can read every file it touches.

### 4.4 `kite doctor` — Diagnose Problems

```bash
$ kite doctor

🪁 Kite Doctor

  ✅  Node version            v20.11.0
  ✅  npm version             10.2.0
  ✅  Kite installed          ^1.0.0
  ✅  public/index.html
  ✅  <kite-outlet> found
  ✅  <kite-include> (5)      all targets found
  ✅  kite.config.json        valid JSON

  Everything looks good. Run `npm run dev` to start.
```

---

## 5. Templates

The CLI ships with four templates.

### 5.1 `blank` — Nothing But the Essentials

```
my-app/
├── package.json
├── public/
│   ├── index.html
│   └── kite.js
└── README.md
```

Best for: students who want to build everything from scratch, step by step.

### 5.2 `starter` — Recommended Default

```
my-app/
├── package.json
├── public/
│   ├── index.html
│   ├── kite.js
│   └── kite.css
├── app/
│   ├── models/counter.model.html
│   ├── views/home.view.html, about.view.html
│   ├── components/nav-bar.component.html
│   └── routes/routes.html
├── styles/app.css
└── README.md
```

Best for: most projects. Includes a counter, two routes, a nav component.

### 5.3 `full` — Everything Wired Up

Complete MVCR project with todos/user models, controllers, components, views, API client config, and dark theme.

Best for: teams, full MVCR walkthroughs, learning by example.

### 5.4 `component-kit` — Design-System Starter

```
my-app/
├── app/components/
│   ├── button.component.html
│   ├── card.component.html
│   ├── modal.component.html
│   ├── input.component.html
│   └── alert.component.html
├── styles/
│   ├── tokens.css
│   └── components.css
└── app/views/showcase.view.html
```

Best for: designers, component libraries, theming.

---

## 6. What `npm install` Actually Installs

```json
{
  "dependencies": {
    "@kitelet/core": "^1.0.0"
  }
}
```

**That's it.** One package. No transitive dependency tree, no 200MB `node_modules`.

### 6.1 What Lands in `node_modules/@kitelet/core/`

```
node_modules/@kitelet/core/
├── package.json
├── dist/           # browser-ready files
│   ├── kite.js
│   ├── kite.min.js
│   └── kite.css
├── src/            # ES module source
├── bin/            # CLI tools
├── templates/      # project templates
├── types/          # TypeScript declarations
└── docs/           # offline reference docs
```

---

## 7. Recommended Folder Structure

```
my-app/
├── package.json
├── public/
│   ├── index.html       # the HTML shell
│   ├── kite.js
│   └── kite.css
├── app/
│   ├── models/          # kite-model files
│   ├── views/           # kite-view files
│   ├── controllers/     # kite-controller files
│   ├── components/      # kite-component files
│   ├── routes/          # kite-route declarations
│   └── api/             # kite-api config
├── styles/
│   ├── app.css
│   └── theme.css
├── plugins/             # custom extensions
├── dist/                # build output (gitignored)
└── README.md
```

### 7.1 Why These Folders

| Folder | Maps to |
|--------|---------|
| `app/models/` | **M** in MVCR |
| `app/views/` | **V** in MVCR |
| `app/controllers/` | **C** in MVCR |
| `app/routes/` | **R** in MVCR |
| `app/components/` | Reusable UI |

The folder names **are the architecture**. A student can trace the pattern by reading the tree.

---

## 8. The Scaffolded `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Kite App</title>
  <link rel="stylesheet" href="/kite.css">
  <link rel="stylesheet" href="/styles/app.css">
  <script src="/kite.js" defer></script>
</head>
<body>
  <kite-config mode="dev" routing="hash"></kite-config>

  <kite-include src="/app/components/nav-bar.component.html"></kite-include>
  <kite-use name="nav-bar"></kite-use>

  <kite-include src="/app/models/counter.model.html"></kite-include>
  <kite-include src="/app/views/home.view.html"></kite-include>
  <kite-include src="/app/views/about.view.html"></kite-include>
  <kite-include src="/app/routes/routes.html"></kite-include>

  <main class="container">
    <kite-outlet></kite-outlet>
  </main>
</body>
</html>
```

Every `<kite-include>` is a real HTML file. Read them all. Edit any of them. Refresh the browser.

---

## 9. The Dev Server

`npm run dev` (which calls `kite dev`) starts a zero-dependency Node.js HTTP server:

| Feature | What it does |
|---------|--------------|
| **Static serving** | Serves `public/`, `app/`, `styles/`, `plugins/` |
| **Live reload** | Watches HTML/CSS/JS via SSE, auto-refreshes |
| **Include resolution** | Inlines `<kite-include>` at serve-time |
| **SPA fallback** | Routes without file extensions fall back to `index.html` |
| **Zero config** | Works out of the box |
| **~200 lines** | Source you can read in 5 minutes |

### 9.1 Dev Server Options

```bash
kite dev --port 3000
kite dev --host 0.0.0.0
kite dev --open
kite dev --no-reload
```

Or in `kite.config.json`:

```json
{
  "dev": {
    "port": 3000,
    "host": "localhost",
    "open": true,
    "reload": true
  }
}
```

---

## 10. The Build

`kite build` produces a `dist/` folder ready for any static host.

**What the build does:**
1. Reads `public/index.html`.
2. Resolves every `<kite-include>` recursively into one file.
3. Minifies HTML (collapses whitespace, strips comments).
4. Copies `styles/` and `public/` assets.
5. Honors `.kiteignore` for exclusions.
6. Prints a size summary.

**What the build does NOT do:**
- ❌ Bundle JS
- ❌ Transpile anything
- ❌ Require any config

### 10.1 Build Options

```bash
kite build --out ./public
kite build --no-minify
```

Or in `kite.config.json`:

```json
{
  "build": {
    "out": "dist",
    "minify": true,
    "inlineIncludes": true
  }
}
```

Deploy `dist/` to Netlify, Vercel, GitHub Pages, S3, or any static host.

---

## 11. Scaffolding Features & Project Management

Already have a project? Scaffold any building block on demand.

### 11.1 Generator Syntax & Shortcuts

Kite supports standard `kite make:<type>`, shorthand `kite g:<alias>`, and legacy `kite add <type>`:

```bash
# Standard syntax
kite make:component card
kite make:view user-profile
kite make:model todos

# Fast aliases
kite g:c card                      # Component
kite g:v user-profile              # View
kite g:m todos                     # Model
kite g:ct user                     # Controller
kite g:r /dashboard                # Route
kite g:p my-plugin                 # Plugin
```

### 11.2 Supported Generator Types

| Type | Shortcut | Output Path | Registered in |
|------|----------|-------------|---------------|
| `component` | `g:c` | `app/components/<name>.component.html` | `index.html` |
| `view` | `g:v` | `app/views/<name>.view.html` | `index.html` |
| `model` | `g:m` | `app/models/<name>.model.html` | `index.html` |
| `controller` | `g:ct` | `app/controllers/<name>.controller.html` | `index.html` |
| `route` | `g:r` | `app/routes/routes.html` (appended) | `routes.html` |
| `action` | — | Injected into `<kite-controller>` | controller |
| `plugin` | `g:p` | `plugins/<name>/index.html` | `index.html` |
| `directive` | — | `plugins/directives/<name>.directive.html` | `index.html` |
| `helper` | — | `app/helpers/<name>.helper.html` | `index.html` |
| `rule` | — | `app/rules/<name>.rule.html` | `index.html` |
| `adapter` | — | `app/adapters/<name>.adapter.html` | `index.html` |
| `api` | — | `app/api/<name>.api.html` | `index.html` |
| `layout` | — | `app/layouts/<name>.layout.html` | `index.html` |

### 11.3 Generator Flags

Control file generation behavior with flags:

```bash
# Overwrite existing file without prompting
kite make:model todos --force

# Create file without registering a <kite-include> in index.html
kite make:view modal --no-include

# Scaffold to a custom directory
kite make:component button --path custom/components

# Generate clean template code without educational header comments
kite make:model counter --no-comment
```

### 11.4 Interactive Generator Mode

Run `kite make` or `kite add` without arguments to launch an interactive terminal menu:

```bash
$ kite make
? Select what you want to make:
  1) component  - Reusable HTML component
  2) view       - Page view template
  3) model      - Reactive state store
  4) controller - Business logic & actions
  5) route      - Application route mapping
  6) action     - Action handler for controller
  7) plugin     - Custom plugin extension
  8) directive  - Custom HTML directive
  9) helper     - Pure template helper
  10) rule      - Form validation rule
  11) adapter   - Data/Storage sync adapter
  12) api       - REST/HTTP API endpoint config
  13) layout    - Page layout wrapper
Enter choice [1-13]: 1
Enter name: user-card
✔ Created app/components/user-card.component.html
✔ Added <kite-include src="/app/components/user-card.component.html"> to public/index.html
```

### 11.5 Project Management & Inspection

Kite includes project inspection and refactoring commands that work directly with your HTML files without extra dependencies:

```bash
# List all registered components, views, models, and routes
kite list

# Search for components, templates, or route paths
kite find user

# Safely rename a piece (updates file and all <kite-include> tags in index.html)
kite rename user account
# (or: kite mv user account)

# Remove a piece and clean up its <kite-include> tag
kite remove card
# (or: kite rm card)

# Inspect project summary, piece counts, and Kite version
kite info

# Read or update kite.config.json keys
kite config dev.port 8080

# Upgrade project runtime assets (kite.js, kite.css)
kite upgrade
```

**No hidden writes.** Every change is listed. Every file is readable.

---

## 12. Configuration Files

### 12.1 `kite.config.json` — Project Config

```json
{
  "dev": { "port": 3000, "open": true },
  "build": { "out": "dist", "minify": true },
  "runtime": { "mode": "dev", "routing": "hash", "sanitize": "strict", "prefix": "kite" }
}
```

### 12.2 `.kitrc` — CLI Preferences

```json
{
  "template": "starter",
  "packageManager": "npm",
  "useTypes": true,
  "editor": "code"
}
```

### 12.3 `.kiteignore` — Build Excludes

```
node_modules/
docs/
*.test.html
drafts/
```

Same syntax as `.gitignore`.

---

## 13. Editor Setup

### Recommended Extensions (VS Code)

| Extension | Why |
|-----------|-----|
| **Live Server** | Auto-refresh on save |
| **HTML CSS Support** | Class/ID autocomplete |
| **Prettier** | Formatting |

### Autocomplete via TypeScript Types

The scaffold includes `types/kite.d.ts` so your editor autocompletes `kite-*` attributes with zero TypeScript required.

### `.editorconfig`

```ini
root = true
[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

---

## 14. What Gets Scaffolded — Full Walkthrough

`kite create my-app --template starter` produces 15 files in under 300 lines of content. Under 10 seconds from command to first render.

Every file is readable in one sitting.

---

## 15. Verifying Your Setup

```bash
kite doctor
```

Checks:
- ✅ Node and npm versions
- ✅ Kite installed
- ✅ `public/index.html` present
- ✅ `<kite-outlet>` present
- ✅ All `<kite-include>` targets exist on disk
- ✅ `kite.config.json` valid JSON (if present)

Every check prints ✅ / ⚠️ / ❌ with a fix suggestion.

---

## 16. Upgrading

Upgrade by changing the version in `package.json` and running `npm install`. Check the [CHANGELOG](../../CHANGELOG.md) for breaking changes.

```bash
# One-liner (once published to npm)
npm install @kitelet/core@latest
kite doctor
```

No migrations, no codemods. Kite's public API is small and stable. Upgrades are boring on purpose.

---

## 17. Removing Kite

```bash
kite eject directives.for    # eject one built-in
```

You can read every source file Kite uses. Nothing is hidden.

---

## 18. Summary — The Three Paths

| Path | Install | Command | Best for |
|------|---------|---------|----------|
| **CDN** | None | Paste `<script>` | Students, demos |
| **npm + CLI** | Node 18+ | `kite create <name>` | Real projects |
| **npm manual** | Node 18+ | `npm install @kitelet/core` | Custom setups |

> **If you have Node, you can build a Kite app in under a minute.**
>
> **If you don't, you can build one by pasting a single `<script>` tag.**
>
> **Either way, the project you get is small enough to read in full — and yours to change.**
