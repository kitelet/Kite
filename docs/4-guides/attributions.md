# Attributions, Copyrights & Open Source Appreciations

> Complete acknowledgment of tools, libraries, visual assets, intellectual inspirations, and the permissive MIT open-source license that powers the Kite project.

---

## Visual & Artistic Assets

Kite is designed with care, visual warmth, and human craftsmanship. We gratefully credit the creators of all artistic and visual resources used throughout the project:

### 1. Iconography & Vector Graphics

- **Feather Icons & Lucide Icons**:
  - **Authors**: Cole Bemis & the Feather / Lucide Community
  - **License**: MIT License
  - **Usage**: Clean, crisp SVG navigation, status indicators, copy icons, and UI actions across the documentation portal and landing cards.

### 2. Modern Typography

- **Plus Jakarta Sans** (Display & Headings):
  - **Designers**: Tokotype (Gumpita Rahayu)
  - **License**: SIL Open Font License (OFL) 1.1
- **Nunito** (Body Text & Documentation):
  - **Designer**: Vernon Adams
  - **License**: SIL Open Font License (OFL) 1.1
- **JetBrains Mono** (Code & Monospace):
  - **Designer**: JetBrains
  - **License**: SIL Open Font License (OFL) 1.1

---

## Foundations & Intellectual Inspirations

Kite was not built in a vacuum. It stands proudly on the shoulders of brilliant software engineers and forward-thinking open-source projects that redefined how developers think about the modern web:

### 1. Alpine.js & Caleb Porzio

- **Impact**: Demonstrated that developers crave expressive, reactive HTML attributes directly in the DOM (`x-data`, `x-bind`, `x-on`) without needing complex single-page-application (SPA) build pipelines.
- **Influence on Kite**: Inspired Kite's HTML-first ergonomics, directive naming conventions, and inline reactive scope concepts.

### 2. Vue.js & Evan You

- **Impact**: Revolutionized reactive state programming by popularizing ES6 `Proxy`-based dependency tracking and intuitive template directives (`v-if`, `v-for`, `v-model`).
- **Influence on Kite**: Kite's underlying microtask batching and reactive proxy engine draw direct architectural inspiration from Vue's reactivity core, adapted for zero-build environments.

### 3. HTMX & Carson Gross

- **Impact**: Reignited the modern hypermedia movement, proving that standard HTML elements and HTTP verbs can handle dynamic client interactions without massive client-side bundles.
- **Influence on Kite**: Validated the core thesis that "HTML is enough for small things", reinforcing Kite's commitment to progressive enhancement and non-invasive DOM manipulation.

### 4. Petite-Vue

- **Impact**: Proved that a walkable DOM reactive engine could fit in under 6 KB while providing genuine utility.
- **Influence on Kite**: Showed how to walk existing DOM nodes without requiring a Virtual DOM overhead.

### 5. Web Standards (W3C & WHATWG)

- Kite relies exclusively on standard, evergreen browser APIs:
  - **JavaScript ES2020+**: Native `Proxy`, `Reflect`, `MutationObserver`, `queueMicrotask`, `CustomEvent`, and ES Modules.
  - **HTML5**: Native semantic markup and `<template>` elements.
  - **Modern CSS**: CSS Custom Properties (Variables), Flexbox, CSS Grid, and modern color palettes.

---

## Tooling & Development Ecosystem

We extend our sincere thanks to the open-source tools and infrastructure that make developing, testing, and distributing Kite possible:

| Tool              | Creator / Organization         | Purpose in Kite                                   | License      |
| :---------------- | :----------------------------- | :------------------------------------------------ | :----------- |
| **Prism.js**      | Lea Verou & Prism Contributors | Documentation code syntax coloring                | MIT          |
| **Node.js**       | OpenJS Foundation              | CLI tooling, local dev server & test runner       | MIT          |
| **npm**           | GitHub / Microsoft             | Package management and registry distribution      | Artistic-2.0 |
| **VS Code & LSP** | Microsoft & Community          | Developer tooling, syntax highlighting & snippets | MIT          |
| **ESLint**        | OpenJS Foundation              | Linting, syntax validation & convention rules     | MIT          |

---

## License & Copyright Notice

Kite is free and open-source software, licensed under the terms of the **MIT License**.

```text
MIT License

Copyright (c) 2026 Kite Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Usage Terms & Commercial Permissions

- **Commercial Use**: You are free to use Kite in commercial websites, client projects, internal enterprise dashboards, and proprietary SaaS applications with zero licensing fees.
- **Educational Use**: Educators, universities, bootcamps, and authors are encouraged to use Kite to teach reactive programming, DOM mechanics, and web standards.
- **Modification & Forking**: You may modify, extend, fork, or embed Kite into your own frameworks or backend template engines (such as Laravel Blade, Django, Rails ERB, or ASP.NET).
- **Trademark & Brand**: You are welcome to state that your project is "Built with Kite" or "Powered by Kite". Please do not use the Kite logo or name to imply official endorsement of unrelated commercial products.
