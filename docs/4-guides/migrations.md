# Kite — Migration Guides

> **HTML is enough for small things.** Step-by-step guides for transitioning from Alpine.js, HTMX, Vue, or React to Kite's native HTML toolkit architecture. For migrating _out_ of Kite, see [graduating.md](./graduating.md).

---

## 1. Migrating from Alpine.js to Kite

Alpine.js and Kite share a lightweight, in-markup philosophy, but Kite provides **three critical upgrades**:

1. **Zero `eval()` / Strict CSP**: Kite does not use `new Function()`, so it never violates Content Security Policy.
2. **First-Class Components & Slots**: Reusable `<kite-component>` and `<slot>` without extra plugins.
3. **Built-in MVCR**: Native `<kite-model>`, `<kite-view>`, and `<kite-route>` tags.

### Syntax Translation Table

| Feature                | Alpine.js Syntax                                          | Kite Syntax                                                     |
| ---------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| **Define State**       | `x-data="{ count: 0 }"`                                   | `kite-scope="{ count: 0 }"`                                     |
| **Interpolate Text**   | `x-text="count"`                                          | `kite-text="count"`                                             |
| **Interpolate HTML**   | `x-html="content"`                                        | `kite-html="content"` _(auto-sanitized)_                        |
| **Attribute Binding**  | `:disabled="isLoading"` or `x-bind:disabled`              | `kite-bind:disabled="isLoading"`                                |
| **Toggle Class**       | `:class="{ 'active': on }"`                               | `kite-class:active="on"` or `kite-class="{ active: on }"`       |
| **Toggle Style**       | `:style="{ color: 'red' }"`                               | `kite-style:color="'red'"` or `kite-style="{ color: 'red' }"`   |
| **Event Listener**     | `@click="count++"` or `x-on:click`                        | `kite-on-click="count++"`                                       |
| **Conditional Render** | `<template x-if="open"><div>...</div></template>`         | `<div kite-if="open">...</div>` _(no wrapper required)_         |
| **Show / Hide**        | `x-show="open"`                                           | `kite-show="open"`                                              |
| **Loops**              | `<template x-for="item in items"><li>...</li></template>` | `<li kite-for="item in items">...</li>` _(no wrapper required)_ |
| **Two-Way Binding**    | `x-model="search"`                                        | `kite-model="search"`                                           |
| **Lifecycle Init**     | `x-init="fetch()"`                                        | `kite-init="fetch()"`                                           |
| **Cloak (FOUC)**       | `x-cloak`                                                 | `kite-cloak`                                                    |

### Key Improvements When Moving from Alpine:

- **No `<template>` wrappers required**: In Alpine, `x-if` and `x-for` require `<template>` tags. In Kite, directives apply directly to standard elements (`<div kite-if="...">`, `<li kite-for="...">`).
- **Loop Filtering**: Kite supports inline `where` filtering: `<li kite-for="t in todos where !t.done">`.
- **Reusable Web Components**: `<kite-component name="card">` replaces complex Alpine component workarounds.

---

## 2. Migrating from HTMX to Kite

HTMX focuses on swapping HTML fragments from the server, while Kite focuses on **client-side state reactivity with optional REST/GraphQL connections**.

### Conceptual Differences

| Concern                | HTMX                                      | Kite                                                    |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------- |
| **Data Format**        | Server returns HTML fragments             | Server returns plain JSON (or client uses local state)  |
| **State Management**   | State lives on the server                 | State lives in reactive client Proxies                  |
| **Offline Capability** | Requires connection for every interaction | Works 100% offline via `kite-persist` & `local` adapter |
| **Components**         | Reusable server templates                 | Declarative `<kite-component>` with `<slot>`            |
| **Client Routing**     | Server-side redirects / pushURL           | Built-in `<kite-route>` hash navigation                 |

### Combining Kite and HTMX (Coexistence)

Kite and HTMX can coexist peacefully in the same project! Use HTMX for server-heavy HTML swapping, and Kite for instant client-side micro-interactions:

```html
<!-- HTMX loads server HTML; Kite handles client-side toggling & arithmetic -->
<div hx-get="/api/comments" hx-trigger="load" hx-swap="innerHTML">
  <!-- Content arrives and Kite auto-scans it via MutationObserver -->
</div>

<!-- Instant client-side counter with zero network requests -->
<div kite-scope="{ count: 0 }">
  <button kite-on-click="count++">+</button>
  <span kite-text="count"></span>
</div>
```

---

## 3. Migrating from React or Vue to Kite

If your team is suffering from **JavaScript build fatigue**, Kite allows you to write components and reactive state with **zero toolchain**:

| Feature                 | React                                | Vue                       | Kite                                                |
| ----------------------- | ------------------------------------ | ------------------------- | --------------------------------------------------- |
| **Build Step**          | Mandatory (Vite / Webpack / Next.js) | Recommended (Vite)        | **None** (Native browser ES module)                 |
| **Virtual DOM**         | Yes (Varying diffing overhead)       | Yes                       | **None** (Direct targeted DOM updates)              |
| **Component Template**  | JSX / TSX                            | SFC (`.vue` files)        | Native `<kite-component>` in HTML                   |
| **Component Insertion** | `<UserCard name="Ada" />`            | `<UserCard name="Ada" />` | `<kite-use name="user-card" name="Ada"></kite-use>` |
| **Content Projection**  | `{props.children}`                   | `<slot />`                | Standard native `<slot></slot>`                     |
| **Routing**             | React Router (heavy bundle)          | Vue Router                | Native `<kite-route>` & `<kite-outlet>`             |
| **Bundle Size**         | ~40 KB+ runtime                      | ~35 KB+ runtime           | **~12 KB** total runtime                            |

### Quick Example: Simple React Component vs Kite

**React:**

```jsx
// Requires bundler, babel, React runtime
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="card">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

**Kite:**

```html
<!-- Native HTML, works directly in any browser -->
<div class="card" kite-scope="{ count: 0 }">
  <p>Count: <span kite-text="count"></span></p>
  <button kite-on-click="count++">+</button>
</div>
```
