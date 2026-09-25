# Kite — Agent Guide

> Read this before writing or modifying any Kite code.

## What Kite is

A teaching toolkit for small, self-contained web apps.
HTML-only interactivity. No JS required. No build step.

**Not a framework.** **Not for production-scale.** See `.kite/limits.json`.

## Project structure

- `app/models/*.model.html`          — data + methods + api binding
- `app/views/*.view.html`            — reactive markup
- `app/controllers/*.controller.html`— named behaviors and action handlers
- `app/components/*.component.html` — reusable UI components
- `app/routes/routes.html`           — URL hash → view mapping
- `app/api/*.api.html`               — backend clients & endpoint configs
- `public/index.html`                — the application shell

## Markup convention (recommended, not enforced)

```html
<tag [identity] [state] [data-in] [render]
     [control] [events] [lifecycle] [escape] [config]>
```

1. **identity**: `id`, `class`, `name`, `data-*`
2. **state**: `kite-scope`, `kite-persist*`
3. **data-in**: `kite-model`, `kite-bind:*`
4. **render**: `kite-text`, `kite-html`, `kite-show`, `kite-class:*`, `kite-style:*`
5. **control**: `kite-if`, `kite-elif`, `kite-else`, `kite-for`
6. **events**: `kite-on-*`, `kite-emit:*`, `kite-reset`, `kite-copy`
7. **lifecycle**: `kite-init`, `kite-watch:*`, `kite-poll.*`, `kite-cloak`
8. **escape**: `kite-skip`
9. **config**: `kite-config:*`, `kite-debounce`, `kite-throttle`

## Rules (see .kite/rules.json for the full list)

1. **Only Models touch the network.** No `<kite-api>` calls or raw fetches inside views or controllers.
2. **Views never fetch.** Views only bind to model state.
3. **Controllers never fetch.** Controllers dispatch actions to models.
4. **`kite-text` always escapes.** Use `kite-html` only when sanitized raw HTML is explicitly intended.
5. **Never use `eval` or `new Function`.** Kite is 100% CSP compliant.
6. **Only `window.Kite` is global.** Never pollute the global window namespace.
7. **Respect scale limits.** Never generate tables with thousands of items or unbounded DOM trees without warning the user.

## What NOT to do

- Do not invent directives. Every valid directive is defined in `.kite/capabilities.json`.
- Do not use `kite-fro`. It does not exist; use `kite-for`.
- Do not assume React/Vue virtual DOM patterns. Kite uses native DOM mutations and native proxies.
- Do not generate arbitrary client JavaScript unless the user explicitly requests it.
- Do not exceed the scale limits in `.kite/limits.json` (>500 nodes, >20 models).

## Where to learn more

- `.kite/capabilities.json` — every directive, tag, API with signatures
- `.kite/rules.json` — every rule, named and checkable
- `.kite/conventions.json` — markup order, naming, and file patterns
- `.kite/limits.json` — scale limits, sweet spots, and graduation triggers
- `llms.txt` — structured summary for crawlers and LLMs
- `docs/` — comprehensive human curriculum organized into 4 tiers
