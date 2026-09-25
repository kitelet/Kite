# Scope & Reactivity Model
> How Kite turns plain JavaScript objects into fine-grained reactive DOM bindings using native Proxies and microtask batching.

---

## The Reactivity Pipeline

Unlike virtual DOM frameworks (React, Preact) that diff entire tree snapshots, or compiler-driven frameworks (Svelte) that require build-time code transformations, Kite achieves reactivity at runtime using native browser APIs:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. State Mutation (e.g. `count++` or `items.push(...)`)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. JavaScript Proxy Trap (`set`)                            │
│    - Intercepts property writes and array mutations         │
│    - Gathers registered DOM reaction listeners for property │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Microtask Scheduler (`queueJob` via `queueMicrotask`)    │
│    - Deduplicates redundant reactions                       │
│    - Batches synchronous mutations into a single DOM update │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Targeted DOM Updates                                     │
│    - Re-evaluates exact expression and updates DOM nodes    │
│    - Zero layout thrashing, zero virtual DOM overhead       │
└─────────────────────────────────────────────────────────────┘
```

---

## The Scope Hierarchy & Lookup Chain

Kite scopes form a prototype-like hierarchical tree mirroring the DOM structure:

```text
       ┌────────────────────────┐
       │   Kite.state (Global)  │
       └───────────▲────────────┘
                   │
       ┌───────────┴────────────┐
       │ Parent Scope (Page)    │
       │ e.g. { theme: 'dark' } │
       └───────────▲────────────┘
                   │
       ┌───────────┴────────────┐
       │ Child Scope (Widget)   │
       │ e.g. { count: 10 }     │
       └────────────────────────┘
```

### Rule for Reads:
When an expression requests a property (e.g. `theme`):
1. **Child Scope**: Checks if the property exists locally (e.g. in `kite-scope`, component props, or `kite-for` variables).
2. **Parent Scope**: If not found, walks up enclosing parent scopes in the DOM tree.
3. **Global State**: Falls back to properties defined on `Kite.state`.

### Rule for Writes:
When an expression assigns to a property (e.g. `theme = 'light'`):
- Kite searches the chain and writes to the **nearest scope that already owns that property**.
- If the property does not exist in any ancestor, it is created directly on the local scope.

---

## Deep Array Mutation Interceptors

In modern JavaScript, simply setting `array.push(...)` on an object array does not trigger a standard `set` trap on the parent property.

Kite solves this by automatically wrapping nested arrays in an interceptor proxy that tracks all seven mutating Array methods:

| Method | Behavior in Kite |
| :--- | :--- |
| `push(...)` | Appends elements and notifies subscribers (`length` + items). |
| `pop()` | Removes last element and updates list rendering. |
| `shift()` | Removes first element and updates indices. |
| `unshift(...)` | Prepends elements and updates indices. |
| `splice(...)` | Removes/inserts items at any index reactively. |
| `sort(...)` | Reorders array in place and refreshes DOM list. |
| `reverse()` | Reverses elements and refreshes DOM list. |

```html
<div kite-scope="{ items: ['Task A', 'Task B'] }">
  <!-- Mutating methods trigger immediate DOM updates -->
  <button kite-on-click="items.push('Task C')">Append</button>
  <button kite-on-click="items.splice(0, 1)">Remove First</button>
  <button kite-on-click="items.reverse()">Reverse Order</button>

  <ul>
    <li kite-for="item in items" kite-text="item"></li>
  </ul>
</div>
```

---

## Microtask Batching via the Reactor

If you mutate state five times in a single event handler:
```html
<button kite-on-click="a++; b++; c++; a++; b++">Update</button>
```

A naive reactive framework might update the DOM 5 separate times, causing browser recalculations and layout jitter.

Kite includes a microtask batch scheduler (`reactor.js`):
1. Each modified property marks its subscribed reaction jobs.
2. Reaction jobs are deduplicated using a `Set`.
3. Execution is deferred to the end of the current JavaScript turn via native `queueMicrotask`.
4. The DOM updates **exactly once** with all final values applied simultaneously.

---

## Programmatic Scope API

You can create and manage reactive scopes programmatically in JavaScript:

```javascript
import Kite from './kite.js';

// 1. Create a reactive scope
const scope = Kite.createScope({ count: 0, title: 'My App' });

// 2. Subscribe to property changes
const unsubscribe = scope.$subscribe('count', (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// 3. Mutate reactively
scope.count++; // Console: "Count changed from 0 to 1"

// 4. Clean up listener
unsubscribe();
```

---

## Global Shared Stores (`<kite-store>` & `Kite.store`)

When multiple disjoint widgets, components, or screens need to share the same reactive state without manual prop passing, use a **Global Store**:

### Declarative Markup (`<kite-store>`)
Declare a named store anywhere in HTML:

```html
<kite-store name="app">
  {
    theme: 'dark',
    user: { name: 'Guest', loggedIn: false },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
    }
  }
</kite-store>
```

Values in stores are accessible to any component or directive across the entire page:

```html
<!-- Access anywhere via $store.<name> or directly in expressions -->
<div kite-class:theme-dark="app.theme === 'dark'">
  <button kite-on-click="app.toggleTheme()">Toggle Theme</button>
</div>
```

### Programmatic API (`Kite.store`)
```javascript
// Register or update programmatically
const store = Kite.store('cart', { items: [], total: 0 });

// Access existing store
const cart = Kite.store('cart');
cart.items.push({ id: 1, name: 'Widget' });
```

---

## Inspecting Scopes in Browser DevTools

To inspect or debug a scope directly in your browser console:

1. Select any element in the Chrome/Firefox DevTools Elements panel.
2. In the console, access its scope via Kite's global state or evaluate expressions directly:

```javascript
// Evaluate an expression against Kite's global runtime
Kite.evaluate('uppercase("hello")', Kite.state);
// => "HELLO"

// View global state
console.log(Kite.state);
```

---

## Gotchas & Best Practices

> [!TIP]
> **Initialize Properties in Initial State**: For optimal performance and clear code, declare all properties (even if initialized to `null`, `""`, or `false`) in your initial `kite-scope` definition. This ensures proxies register dependency listeners immediately on first render.

> [!NOTE]
> **No Magic Keywords**: Unlike frameworks that invent custom prefixes (`$state`, `$ref`), Kite scopes are plain JavaScript objects. Standard operations (`delete`, `for...in`, `Object.keys`) work as expected.

---

## Related Documentation
- [Directives Reference](../1-basics/directives.md)
- [MVCR Architecture](./mvcr.md)
- [Flexibility & Extensions Guide](../3-internals/extending.md)
