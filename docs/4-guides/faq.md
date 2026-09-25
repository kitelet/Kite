# Frequently Asked Questions (FAQ)

> Clear, honest answers regarding Kite's architecture, security boundaries, performance profile, and design trade-offs.

---

## Architectural Philosophy & Scope

### 1. What is Kite's primary mission?

Kite's mission is expressed in our core thesis: **HTML is enough for small things.**

Most modern web development has drifted into excessive tooling: compilers, bundlers, virtual DOMs, transpilers, and dozens of configuration files just to toggle a modal or render a list.

Kite provides a progressive, zero-boilerplate **teaching toolkit**. It gives developers and students full interactivity, reusable components, and MVCR structure using **native browser capabilities** directly inside HTML.

---

### 2. Is Kite suitable for massive enterprise applications?

**Honest Answer**: **No.** Kite is explicitly bounded:

- It is engineered for small self-contained apps (<500 interactive nodes, <20 models, 1–3 developers).
- It is ideal for interactive widgets, prototypes, and educational environments.
- When you outgrow these limits, we provide an explicit exit path in [graduating.md](./graduating.md). See [limits.md](../1-basics/limits.md) for full published limits.

---

## Security & Zero-`eval` Design

### 3. Why did Kite build a custom parser instead of using `eval()` or `new Function()`?

Almost every similar attribute-based library (such as Alpine.js) relies on `new Function('return ' + expr)` to evaluate expressions in HTML attributes.

While fast to implement, `new Function()` has severe drawbacks:

1. **Severe Security Vulnerabilities**: It exposes applications to Cross-Site Scripting (XSS) if untrusted user input is rendered into HTML attributes.
2. **CSP Violations**: Modern Content Security Policies strictly disallow `unsafe-eval`. Libraries using `new Function` will fail under strict CSP rules.
3. **Black Box Pedagogy**: It treats programming language execution as magic.

Kite includes a **hand-crafted recursive-descent parser and tokenizer** with zero dependencies:

- Zero use of `eval()` or `new Function()`.
- Explicit blocklists preventing sandbox escapes (`window`, `document`, `eval`, `Function`, `__proto__`, `constructor`).
- Complies out of the box with strict Content Security Policies (`script-src 'self'`).

---

## Tool & Library Comparisons

### 4. How does Kite compare to frameworks and other libraries?

> [!NOTE]
> **Kite is not a framework.** Kite is a lightweight educational teaching toolkit specifically crafted for small, self-contained interactive web apps and classroom learning. It does not compete with production-scale application frameworks.

| Dimension             | Kite (Teaching Toolkit)          | Alpine.js                      | Petite-Vue         | React (Framework) | HTMX (Hypermedia) |
| :-------------------- | :------------------------------- | :----------------------------- | :----------------- | :---------------- | :---------------- |
| **Category**          | Teaching Toolkit                 | Reactive UI Library            | Minimal UI Library | Full UI Framework | Hypermedia Library|
| **Expression Engine** | Safe Parser (0 `eval`)           | `new Function` (`unsafe-eval`) | `new Function`     | JSX Compiler      | N/A (Server HTML) |
| **Build Step**        | ❌ None                          | ❌ None                        | ❌ None            | ✅ Required       | ❌ None           |
| **Components**        | ✅ `<kite-component>` + `<slot>` | ⚠️ Limited                     | ⚠️ Limited         | ✅ Yes            | ❌ None           |
| **Architecture**      | ✅ Native MVCR in HTML           | ❌ Procedural                  | ❌ Procedural      | ⚠️ Ad-hoc         | ❌ Server-driven  |
| **Client Routing**    | ✅ Native `<kite-route>`         | ❌ Needs plugin                | ❌ None            | ⚠️ Router package | ⚠️ Hx-boost       |
| **Non-invasive**      | ✅ 100%                          | ⚠️ Custom prefixes             | ⚠️ Custom prefixes | ❌ Takes over DOM | ✅ 100%           |

---

## Backend Integration

### 5. Can I use Kite with Django, Laravel, Rails, or ASP.NET?

**Yes, absolutely.** Kite is a premier companion for server-side frameworks.

Because Kite uses standard HTML attributes, your server template engine (Blade, Jinja, ERB, Razor, Go Templates) can render standard HTML, and Kite immediately brings it to life on the client without conflicts:

```html
<!-- Example: Laravel Blade / Django template rendering Kite markup -->
<div
  kite-scope="{
  user: '{{ $user->name }}',
  notifications: {{ json_encode($notifications) }}
}"
>
  <h2 kite-text="'Welcome, ' + user"></h2>
  <ul>
    <li kite-for="n in notifications" kite-text="n.message"></li>
  </ul>
</div>
```

---

## Performance & Memory

### 6. Does Kite use a Virtual DOM?

**No.** Virtual DOM diffing requires allocating memory for two parallel representations of the entire DOM tree and comparing them recursively on every change.

Instead, Kite uses **fine-grained reactivity with native JavaScript Proxies**:

- When a property changes, only the specific DOM nodes subscribed to that exact property are scheduled for re-evaluation.
- Multiple updates within the same JavaScript execution cycle are batched into a single DOM repaint using `queueMicrotask`.
- Memory consumption is tiny, and UI repaints occur with zero layout thrashing.

---

### 7. Does Kite work with CSS frameworks like Tailwind CSS or Bootstrap?

**Yes.** Kite has zero opinion on styling and requires no CSS preprocessors.

All Kite custom elements (`<kite-component>`, `<kite-use>`, `<kite-model>`, `<kite-view>`, `<kite-outlet>`) use `display: contents;` in `kite.css`. This ensures they do not disrupt Flexbox, CSS Grid, or utility class layouts.

---

## Browser Support & Standards

### 8. Which browsers are supported?

Kite runs natively in all modern evergreen browsers supporting standard ES2020+ features:

- Google Chrome & Chromium-based browsers (Edge, Brave, Opera, Vivaldi)
- Mozilla Firefox
- Apple Safari (macOS & iOS)

---

## Related Documentation

- [Getting Started](../1-basics/getting-started.md)
- [The 13 Inviolable Design Laws](../README.md#🏛️-the-13-inviolable-design-laws)
- [Scope & Reactivity Model](../2-architecture/scope.md)
