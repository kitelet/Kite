# Graduating from Kite

> **Kite will help you leave. It will tell you when. It will not guilt you into staying.**

Once a web application grows beyond 3–4 screens, hundreds of interactive nodes, or multiple engineers, writing application logic inside HTML string attributes stops being liberating and turns into technical debt.

Kite embraces this reality. We believe that a great teaching toolkit must provide an **uncompromising exit path**. You are never locked in.

---

## 1. When to Leave: The 7 Triggers

Check your project against these seven criteria:

| Trigger           | Indicator                    | Why it's time to graduate                                                                     |
| :---------------- | :--------------------------- | :-------------------------------------------------------------------------------------------- |
| **Node Count**    | > 500 interactive nodes      | DOM scanning and reactive proxy walking become noticeable on mobile devices.                  |
| **Model Count**   | > 20 models                  | Inter-model coordination and state dependency chains require formal state machines or stores. |
| **Team Size**     | > 3 developers               | Merge conflicts in HTML files increase without module boundaries and static type checking.    |
| **Type Safety**   | Need for TypeScript          | Complex business domain rules require compile-time type verification.                         |
| **Tooling Needs** | Automated refactoring        | Renaming props and functions across hundreds of string attributes becomes error-prone.        |
| **Architecture**  | Need for SSR / Edge          | SEO-critical or dynamic SSR with streaming hydration is outside Kite's client-only model.     |
| **Lifespan**      | Maintenance horizon > 1 year | Codebases living for years require long-term static analysis and compiler enforcement.        |

---

## 2. Where to Go Next

Kite recommends the right successor based on your team's workflow:

| Successor     | Why it's the right choice                                                                                             | Trade-off to consider                                    |
| :------------ | :-------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| **Lit**       | **Closest spiritual successor.** Native Web Components, standard ES modules, tiny bundle, fast.                       | Requires writing JavaScript class components.            |
| **Alpine.js** | **Identical spirit, mature ecosystem.** Same attribute-first syntax, larger community and plugins.                    | Still string-bound attributes for state.                 |
| **Vue.js**    | **Easiest mental model transfer.** Single-File Components (SFCs), template syntax directly matches Kite's directives. | Introduces a Vite build toolchain.                       |
| **Svelte**    | **Cleanest markup-first compiled code.** No virtual DOM, compiles away to vanilla JS, exceptional performance.        | Requires compiler and build step.                        |
| **React**     | **The default industry standard for teams.** Massive ecosystem, rich component libraries, universal hiring pool.      | Virtual DOM, JSX, and heavier runtime footprint.         |
| **htmx**      | **Best for server-rendered apps.** Moves state and rendering entirely back to your server (Go, Python, PHP, Ruby).    | Requires server-side endpoints returning HTML fragments. |

---

## 3. What You Keep vs. What You Rewrite

The great advantage of Kite's HTML-first architecture is that **you keep almost everything**:

```
What You Keep (85% of your codebase)
├── 🟢 Native HTML markup and document structure
├── 🟢 CSS styles, utility classes, and design tokens
├── 🟢 Layouts, images, SVG icons, and static assets
└── 🟢 Backend REST endpoints, URLs, and data payloads

What You Rewrite (15% of your codebase)
└── 🟡 Replace kite-* attributes with the target framework's directives
```

---

## 4. Migration Cheat Sheet

### Kite to Vue 3 (Single-File Component)

| Feature                 | Kite Syntax                                    | Vue 3 Syntax                                     |
| :---------------------- | :--------------------------------------------- | :----------------------------------------------- |
| **Text interpolation**  | `<span kite-text="user.name"></span>`          | `<span>{{ user.name }}</span>`                   |
| **Attribute binding**   | `<input kite-bind:disabled="isSubmitting">`    | `<input :disabled="isSubmitting">`               |
| **Two-way binding**     | `<input kite-model="query">`                   | `<input v-model="query">`                        |
| **Conditional display** | `<div kite-show="isOpen"></div>`               | `<div v-show="isOpen"></div>`                    |
| **Conditional DOM**     | `<p kite-if="items.length > 0"></p>`           | `<p v-if="items.length > 0"></p>`                |
| **List rendering**      | `<li kite-for="item in items"></li>`           | `<li v-for="item in items" :key="item.id"></li>` |
| **Event handling**      | `<button kite-on-click="save()">Save</button>` | `<button @click="save">Save</button>`            |
| **Class toggling**      | `<div kite-class:active="isActive"></div>`     | `<div :class="{ active: isActive }"></div>`      |

---

### Kite to Alpine.js

| Feature                | Kite Syntax                        | Alpine.js Syntax                                   |
| :--------------------- | :--------------------------------- | :------------------------------------------------- |
| **Component scope**    | `<div kite-scope="{ count: 0 }">`  | `<div x-data="{ count: 0 }">`                      |
| **Text interpolation** | `<span kite-text="count"></span>`  | `<span x-text="count"></span>`                     |
| **Two-way binding**    | `<input kite-model="draft">`       | `<input x-model="draft">`                          |
| **Event handling**     | `<button kite-on-click="count++">` | `<button @click="count++">`                        |
| **Conditionals**       | `<p kite-if="visible"></p>`        | `<template x-if="visible"><p></p></template>`      |
| **Lists**              | `<li kite-for="i in list"></li>`   | `<template x-for="i in list"><li></li></template>` |

---

### Kite to Lit (Web Components)

```javascript
// From:
// <kite-component name="user-badge">
//   <template><span class="badge" kite-text="username"></span></template>
// </kite-component>

// To Lit:
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("user-badge")
export class UserBadge extends LitElement {
  @property({ type: String }) username = "";

  render() {
    return html`<span class="badge">${this.username}</span>`;
  }
}
```

---

## 5. Step-by-Step Migration Plan

1. **Step 1: Freeze Kite Feature Additions.**
   Identify screens exceeding 500 nodes or requiring heavy state management.
2. **Step 2: Choose Your Successor.**
   If you have a server-driven backend (Django/Laravel/Rails), consider **htmx** or **Alpine.js**. If you are building a client-heavy SPA with a team, choose **Vue** or **Svelte**.
3. **Step 3: Extract Shared Styles.**
   Ensure your styles in `styles/` or Tailwind utility classes are decoupled from Kite directives.
4. **Step 4: Migrate Views Incrementally.**
   Replace one screen or component at a time. Native custom elements allow coexistence between Kite views and modern framework islands during migration.
5. **Step 5: Celebrate Graduating!**
   Kite served its purpose: teaching you reactivity and getting your idea running in hours. Moving to a dedicated production framework is a success, not a failure.
