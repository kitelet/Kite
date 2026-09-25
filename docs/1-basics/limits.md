# 🪁 Kite's Limits

> **What Kite is good at. What it's bad at. Where to go next.**

Kite is a **teaching toolkit for small, self-contained web apps**. It is not a framework. It is not designed for production-scale systems or long-term enterprise maintenance.

We publish our limits explicitly so you know where the boundary lies before writing a single line of markup.

---

## 1. The Published Numbers

These are commitments and architectural realities, not vague marketing estimates:

| Metric | Comfortable | Possible with Care | Not Supported |
| :--- | :--- | :--- | :--- |
| **Interactive nodes** (`kite-*`) | **< 500** | **500 – 2,000** | **> 2,000** |
| **Model count** (`<kite-model>`) | **< 20** | **20 – 50** | **> 50** |
| **Route count** (`<kite-route>`) | **< 20** | **20 – 50** | **> 50** |
| **View count** (`<kite-view>`) | **< 30** | **30 – 100** | **> 100** |
| **Component count** (`<kite-component>`) | **< 40** | **40 – 150** | **> 150** |
| **Component nesting depth** | **≤ 8 levels** | **9 – 32 levels** | **> 32 levels** |
| **Team size** | **1 developer** | **2–3 developers** | **4+ developers** |
| **Maintenance horizon** | **Weeks** | **Months** | **Years** |
| **Full bundle size** (`dist/kite.min.js`) | **86.7 KB min (~26 KB gzip)** | — | — |
| **CSS bundle size** (`dist/kite.css`) | **2.2 KB min (~1 KB gzip)** | — | — |
| **External dependencies** | **0 (Zero dependencies)** | — | — |
| **DOM scan cost** | **~1 ms per 100 nodes** | — | — |
| **Time to Interactive (TTI)** | **< 20 ms** | — | — |

---

## 2. What Kite is Good At

| Use Case | Why Kite Shines |
| :--- | :--- |
| **Teaching HTML, events, and state** | Zero configuration. No Node.js required. Students understand how reactivity maps directly to markup. |
| **Small interactive pages** | A counter, modal, tab switcher, or shopping cart written in minutes without setting up a build chain. |
| **Rapid prototypes** | Ship a working proof-of-concept in a single `.html` file. |
| **Designer handoffs** | Clean semantic HTML is the deliverable — no JSX or templating compilation artifacts. |
| **Single-file demos & bug repros** | Works over `file://` or standard CDN. Drop a script tag and reproduce bugs instantly. |
| **Classroom exercises** | Zero tooling friction. No `npm install`, no version mismatches across student machines. |
| **Small internal admin tools** | Dashboards and utilities with under ~500 interactive elements. |
| **Interactive landing pages** | Progressive enhancement for hero sections, forms, and calculators. |

---

## 3. What Kite is Bad At (By Design)

| Problem Area | Why Kite is the Wrong Tool |
| :--- | :--- |
| **Data grids with 10,000 rows** | Kite walks real DOM nodes and binds reactive proxies directly. Without a virtual DOM diffing engine or windowed virtualization, 10k rows will choke DOM traversal. |
| **Multi-team codebases** | Expressions live inside string attributes. There is no compile-time static type checking (like TypeScript). |
| **Long-term enterprise maintenance** | String-bound attributes drift over years of refactoring without strong automated refactoring tools. |
| **Complex concurrent async flows** | Kite has no concurrency primitives, state machines, or streaming hydration. |
| **WebGL, Canvas, complex charts** | High-frequency rendering loops require raw JavaScript engines and GPU canvases, not DOM attribute watchers. |
| **Real-time WebSockets at scale** | Synchronizing high-frequency socket bursts through DOM scopes causes microtask thrashing. |
| **Server-Side Rendering (SSR) & Hydration** | Kite is pure client-side progressive enhancement. |
| **Mission-critical financial or medical logic** | Untyped client-side string expressions are unsuitable for mission-critical domain logic. |

---

## 4. The Graduation Trigger

If any of the following statements become true, you have outgrown Kite:

1. Your page exceeds **500 interactive nodes** or starts feeling sluggish on low-end devices.
2. Your application has more than **20 models** or dozens of routes.
3. Your team expands beyond **3 developers**.
4. You need **strict compile-time type safety** (TypeScript).
5. You need automated refactoring across a large codebase.
6. You require **Server-Side Rendering (SSR)** for SEO or heavy content.
7. You have been maintaining the same Kite project for **over a year**.

When you reach these boundaries, **do not fight Kite**. We built a dedicated exit path to guide your transition:

👉 **[Read the Graduation Guide (`graduating.md`)](../4-guides/graduating.md)**
