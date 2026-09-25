# Getting Started with Kite
> Start building reactive web applications in under 5 minutes with zero build steps, zero configuration, and zero mandatory JavaScript.

---

## What is Kite?

Kite is a teaching toolkit for small, self-contained web apps, designed around an honest truth: **HTML is enough for small things.**

Instead of requiring complex Node.js build pipelines, JSX compilers, or virtual DOM trees, Kite brings reactivity directly to your native HTML through intuitive attributes (`kite-*`) and custom elements (`<kite-component>`, `<kite-model>`, `<kite-route>`). When projects outgrow Kite (~500 nodes), Kite provides a clear graduation path.

---

## Installation

Add the Kite script tag to the `<head>` of any HTML page. You are ready to go immediately:

### 1. Via CDN (Recommended for Prototypes & Demos)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kite App</title>
  <!-- Optional: Cloaking stylesheet to prevent initial layout flash -->
  <link rel="stylesheet" href="https://esm.sh/@kitelet/core/dist/kite.css">
  <!-- Kite runtime engine (ES Module) -->
  <script type="module" src="https://esm.sh/@kitelet/core"></script>
</head>
<body>
  <!-- Your reactive markup here -->
</body>
</html>
```

### 2. Local File / Self-Hosted
Clone or download the repository, copy the `src/` directory into your project, and import locally:
```html
<link rel="stylesheet" href="./src/styles/kite.css">
<script type="module" src="./src/kite.js"></script>
```

---

## The 3 Core Concepts

To build anything in Kite, you only need to understand three ideas:

| Concept | Attribute / Tag | Description |
| :--- | :--- | :--- |
| **1. The Scope** | `kite-scope="{ ... }"` | An isolated reactive state container holding data and properties. |
| **2. The Directive** | `kite-text`, `kite-bind`, `kite-on-*` | An attribute that connects DOM elements to variables in the scope. |
| **3. The Expression** | `"count + 1"`, `"user.name"` | A safe, zero-`eval` formula evaluated whenever state changes. |

---

## Step-by-Step Hands-on Tutorial

### Step 1: Your First Reactive Counter
Declare a reactive scope by placing `kite-scope` on a container element. Any child element can read or mutate its variables:

```html
<div kite-scope="{ count: 0 }">
  <button kite-on-click="count--">−</button>
  <span kite-text="count">0</span>
  <button kite-on-click="count++">+</button>
</div>
```

**How it works:**
- `kite-scope="{ count: 0 }"` creates a reactive JavaScript `Proxy` holding `count = 0`.
- `kite-text="count"` updates the inner text of the `<span>` whenever `count` changes.
- `kite-on-click="count++"` increments `count` on user click. Kite automatically batches the update and refreshes the DOM.

---

### Step 2: Two-Way Form Binding (`kite-model`)
Synchronize form inputs with scope state seamlessly using `kite-model`:

```html
<div kite-scope="{ name: 'Ada Lovelace', isSubscribed: true }">
  <label>
    Your Name:
    <input type="text" kite-model="name">
  </label>

  <label>
    <input type="checkbox" kite-model="isSubscribed">
    Receive monthly newsletter
  </label>

  <p>Hello, <strong kite-text="name"></strong>!</p>
  <p kite-show="isSubscribed">Thank you for subscribing!</p>
</div>
```

**How it works:**
- Typing into the `<input>` immediately updates `scope.name`.
- Toggling the `<input type="checkbox">` immediately updates `scope.isSubscribed`.
- `kite-show="isSubscribed"` toggles `display: none` based on truthiness.

---

### Step 3: Conditionals and Lists (`kite-if` & `kite-for`)
Render collections and conditional elements dynamically:

```html
<div kite-scope="{
  newItem: '',
  items: ['Learn Kite', 'Build a Widget', 'Ship to Production']
}">
  <form kite-on-submit.prevent="if (newItem.trim()) { items.push(newItem.trim()); newItem = ''; }">
    <input type="text" placeholder="Add new task..." kite-model="newItem">
    <button>Add</button>
  </form>

  <p kite-if="items.length === 0">No tasks remaining. Good job!</p>

  <ul kite-else>
    <li kite-for="(task, index) in items">
      <span kite-text="(index + 1) + '. ' + task"></span>
      <button kite-on-click="items.splice(index, 1)">✕</button>
    </li>
  </ul>
</div>
```

**How it works:**
- `items.push(...)` and `items.splice(...)` automatically trigger reactive updates.
- `kite-if` mounts or unmounts the `<p>` tag depending on array length.
- `kite-else` provides an automatic fallback when the preceding `kite-if` is falsy.
- `kite-for` stamps out an `<li>` for every element in `items`.

---

### Step 4: Preventing Flash of Unstyled Content (`kite-cloak`)
Before Kite finishes loading, browser HTML is visible in its raw state. To keep templates clean:

1. Include `kite.css` (or define `[kite-cloak] { display: none !important; }` in your stylesheet).
2. Add the `kite-cloak` attribute to your container:

```html
<div class="todo-widget" kite-cloak kite-scope="{ ready: true }">
  <p kite-text="'Application initialized: ' + ready"></p>
</div>
```

When Kite compiles the element, it automatically removes `kite-cloak`, smoothly revealing the initialized DOM.

---

## Safe Expressions: What You Can Write

Kite features a **zero-`eval` safe recursive-descent expression parser**. You can write standard JavaScript expressions safely:

| Feature | Example | Supported? |
| :--- | :--- | :---: |
| **Arithmetic & Precedence** | `10 + 5 * 2`, `(a + b) / 2` | ✅ |
| **Comparisons & Logic** | `age >= 18 && isVerified`, `!isDone` | ✅ |
| **Ternary Operator** | `isOpen ? 'Close' : 'Open'` | ✅ |
| **String Methods** | `email.trim().toLowerCase()`, `title.includes('Kite')` | ✅ |
| **Array Methods** | `items.filter(t => !t.done)`, `items.length` | ✅ |
| **Multiple Statements** | `display = '0'; op = null; clear = true` | ✅ |
| **Safe Built-in Globals** | `Number(val)`, `String(val)`, `Math.max(a, b)` | ✅ |
| **Arbitrary Code Injection** | `eval(...)`, `new Function(...)`, `window.location` | ❌ (Blocked for security) |

---

## Best Practices & Gotchas

> [!TIP]
> **Use Semicolons for Event Sequences**: In event handlers (`kite-on-click`), you can chain multiple statements using semicolons:
> ```html
> <button kite-on-click="count = 0; status = 'Reset'; isDone = false">Reset All</button>
> ```

> [!IMPORTANT]
> **Attribute Names are Always Lowercase**: HTML attribute parsing is case-insensitive. Write directive arguments and event names in lowercase kebab-case (e.g. `kite-on-click`, `kite-bind:aria-label`, `kite-class:is-active`).

> [!WARNING]
> **Do Not Wrap Scope in Extra JS**: Write plain JSON-style objects inside `kite-scope`. Do not write `var state = ...` or `return { ... }`.
> - **Correct**: `kite-scope="{ active: true, count: 0 }"`
> - **Incorrect**: `kite-scope="javascript:{ active: true }"`

---

## Where to Go Next

- Master all attributes in the [**Directives Reference**](./directives.md).
- Create reusable components with props and slots in [**Declarative Components**](../2-architecture/components.md).
- Organize larger applications using [**MVCR Architecture**](../2-architecture/mvcr.md).
- Implement multi-screen navigation with [**Declarative Routing**](../2-architecture/routing.md).
