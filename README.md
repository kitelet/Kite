# 🪁 Kite

> **HTML is enough for small things.**

Kite is a **teaching toolkit** for building small, self-contained interactive web pages using only HTML and CSS.

Drop one `<script>` tag. Write markup. Get interactivity.

```html
<script src="https://esm.sh/@kitelet/core"></script>

<div kite-scope="{ count: 0 }">
  <button kite-on-click="count++">+1</button>
  <span kite-text="count"></span>
</div>
```

No JavaScript written by you. No build step. No dependencies.

---

## What Kite is

- A teaching toolkit for HTML, events, and state.
- A lightweight workbench for small, self-contained apps.
- A designer's tool for making ideas click.
- A single-file escape hatch for tiny interactive pages.

## What Kite is not

- A framework.
- A React/Vue/Svelte replacement.
- A production-scale tool.
- A long-term bet for large codebases.

**See [limits.md](docs/1-basics/limits.md) for the honest numbers.**

---

## Three ways to start

- **CDN** — paste a script tag (`https://esm.sh/@kitelet/core`). Zero install.
- **npm + CLI** — `npm create kite@latest` (or `npx kite new my-app`).
- **npm manual** — `npm install @kitelet/core`.

All three use the exact same runtime.

---

## When to leave Kite

Kite ships with a graduation guide: [graduating.md](docs/4-guides/graduating.md).

If any of these are true, it's time to move on:

- You have > 500 interactive nodes.
- You have > 20 models.
- You have > 3 developers.
- You need typed code.
- You need refactor tools.

Kite will help you leave. It will tell you when.
It will not guilt you into staying.

---

## Learn

- [Getting started](docs/1-basics/getting-started.md)
- [Directives Reference](docs/1-basics/directives.md)
- [Components](docs/2-architecture/components.md)
- [MVCR Architecture](docs/2-architecture/mvcr.md)
- [Agentic Toolkit](docs/3-internals/agentic.md)
- [Limits & Sweet Spots](docs/1-basics/limits.md)
- [Graduating from Kite](docs/4-guides/graduating.md)
- [Cheatsheet](docs/1-basics/cheatsheet.md)
- [Cookbook & Recipes](docs/4-guides/cookbook.md)
- [FAQ & Architecture](docs/4-guides/faq.md)
- [Live Documentation Portal](https://getkite.netlify.app)

---

## The promise

> **HTML is enough for small things.**
>
> **Kite helps you build them.**
>
> **Kite helps you leave them.**
>
> **Kite stays small on purpose.**

---

MIT License.
