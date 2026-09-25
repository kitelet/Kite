# 🪁 Kite — Full Flexibility & Extension Surface

> **HTML is enough for small things** — but nothing is locked. Every layer is open.

Kite is an open **toolkit**, not a closed monolith. Every built-in is built with the exact same public API you get. Nothing is privileged. Nothing is off-limits. This document is the complete map of what a developer can extend, override, replace, or eject.

---

## 1. The Flexibility Doctrine

| # | Principle | Meaning |
|---|---|---|
| 1 | **Nothing is privileged** | Built-in directives and subsystems use the exact same APIs available to userland code. |
| 2 | **Everything is replaceable** | Any directive, helper, rule, adapter, or component can be overridden without monkey-patching. |
| 3 | **Everything is removable** | Disable what you don't need; the bundle is yours to trim dynamically. |
| 4 | **Everything is observable** | Every internal lifecycle transition and event is public via hooks. |
| 5 | **Everything is composable** | Small primitives combine naturally into complete design systems and toolkits. |
| 6 | **No hidden state** | Every internal registry is inspectable via `Kite.inspect()` and `Kite.registry`. |
| 7 | **Eject, don't lock in** | You can copy any built-in source into your app with `npx kite eject` and own it forever. |

---

## 2. The Seven Extension Points

Every customization in Kite flows through one of these seven APIs. Every registration function returns an **unregister cleanup function** `() => void`.

| # | API | What it adds | Difficulty |
|---|---|---|---|
| 1 | `Kite.directive(name, handler, opts)` | A new `kite-*` HTML attribute | Beginner |
| 2 | `Kite.helper(name, fn, opts)` | A function callable inside expressions | Beginner |
| 3 | `Kite.rule(name, fn)` | A sync or async form validation rule | Beginner |
| 4 | `Kite.adapter(name, fn)` | A backend network protocol | Intermediate |
| 5 | `Kite.middleware(name, fn)` | Network adapter pipeline middleware | Intermediate |
| 6 | `Kite.component(name, def)` | A reusable component defined in JS | Intermediate |
| 7 | `Kite.hook(name, fn)` | Toolkit lifecycle callbacks | Intermediate |
| 8 | `Kite.plugin(name, fn)` | A bundled package of the above | Advanced |

Plus three meta-APIs:

| API | Purpose |
|---|---|
| `Kite.config(opts \| key)` | Change or read toolkit behavior, selective loading (`only`) |
| `Kite.override(name, fn)` | Replace a built-in implementation with custom logic |
| `Kite.original(name)` | Retrieve the unmodified original implementation |
| `Kite.disable(name)` / `Kite.enable(name)` | Dynamically disable or re-enable built-ins |

---

## 3. `Kite.directive()` — Add New Attributes

### 3.1 The Contract

```javascript
/**
 * Register a Kite directive.
 *
 * @param {string}   name     - Attribute name (without 'kite-' prefix).
 * @param {Function} handler  - (el, expr, scope, arg, modifiers, scanElement, ctx) => cleanupFn
 * @param {Object}   [opts]   - { priority, isTerminal, once, events, watch, scopeOnly }
 * @returns {Function} Unregister function.
 */
const off = Kite.directive(name, handler, opts);
off(); // Unregisters directive
```

### 3.2 The Handler Signature

```javascript
function handler(el, expr, scope, arg, modifiers, scanElement, ctx) {
  // el          — the target DOM element
  // expr        — the attribute expression string
  // scope       — the reactive Scope Proxy
  // arg         — colon argument (e.g. 'src' from 'kite-bind:src')
  // modifiers   — array of dot modifiers (e.g. ['prevent'] from 'kite-on-click.prevent')
  // scanElement — recursive DOM scanner for structural directives
  // ctx         — { attr, name, config, warn, error, arg, modifiers }

  return () => {
    // Teardown logic invoked on unmount or re-scan
  };
}
```

### 3.3 Examples

**Static Tooltip Directive:**
```javascript
Kite.directive('tooltip', (el, expr, scope) => {
  el.title = scope[expr] || expr;
  return () => { el.title = ''; };
});
```
```html
<button kite-tooltip="helpText">Hover me</button>
```

**Re-running on Custom DOM Events (`opts.events`):**
```javascript
Kite.directive('debounced', (el, expr, scope) => {
  let timer;
  const handler = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { scope[expr](); }, 300);
  };
  el.addEventListener('input', handler);
  return () => {
    clearTimeout(timer);
    el.removeEventListener('input', handler);
  };
}, { events: ['input'] });
```

---

## 4. `Kite.helper()` — Add Expression Functions

### 4.1 Contract & Namespacing

```javascript
// Register standard helper
Kite.helper('formatMoney', (n, currency = 'USD') =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).format(n));

// Dot-namespaced helpers
Kite.helper('date.format', (d) => new Date(d).toLocaleDateString());
Kite.helper('date.relative', (d) => /* relative time string */);

// Scoped helper (visible only to views/models in that scope)
Kite.helper('adminAction', fn, { scope: 'admin' });
```

```html
<span kite-text="formatMoney(total)"></span>
<time kite-text="date.format(createdAt)"></time>
```

---

## 5. `Kite.rule()` — Add Validation Rules

```javascript
// Sync rule
Kite.rule('strongPassword', (v) => {
  if (v.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(v)) return 'Must include an uppercase letter';
  if (!/[0-9]/.test(v)) return 'Must include a number';
  return true;
});

// Async rule (Kite tracks form.validating while pending)
Kite.rule('uniqueEmail', async (v, arg, ctx) => {
  const taken = await ctx.api.get('/users/exists', { email: v });
  return !taken || 'Email is already registered';
});
```

```html
<input kite-model="password" kite-rule="strongPassword">
<input kite-model="email" kite-rule="uniqueEmail">
<span kite-error="email"></span>
<span kite-if="form.validating">Checking availability...</span>
```

---

## 6. `Kite.adapter()` & `Kite.middleware()` — Network Layer

### 6.1 Custom Protocol Adapter

```javascript
Kite.adapter('graphql', async (opts, ctx) => {
  const res = await fetch(ctx.config.base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: opts.body.query,
      variables: opts.body.variables,
    }),
  });
  return res.json();
});
```

### 6.2 Adapter Middleware Pipeline

```javascript
// Add authentication bearer token
Kite.middleware('auth', async (opts, ctx, next) => {
  opts.headers['Authorization'] = `Bearer ${sessionStorage.getItem('token')}`;
  return next(opts, ctx);
});

// Request logger
Kite.middleware('logger', async (opts, ctx, next) => {
  console.log(`[API] ${opts.method} ${opts.path}`);
  const start = performance.now();
  const res = await next(opts, ctx);
  console.log(`[API] Completed in ${(performance.now() - start).toFixed(1)}ms`);
  return res;
});
```

---

## 7. `Kite.component()` — Programmatic JS Components

Define components in JavaScript with typed props, `setup()` functions, and scoped CSS:

```javascript
Kite.component('user-card', {
  props: {
    user:    { type: 'object', required: true },
    showBio: { type: 'boolean', default: false }
  },

  template: `
    <div class="card">
      <h3 kite-text="user.name"></h3>
      <p kite-if="showBio" kite-text="user.bio"></p>
      <slot name="actions"></slot>
    </div>
  `,

  setup(props, { emit, scope }) {
    const follow = () => emit('follow', props.user.id);
    return { follow };
  },

  style: `.card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }`
});
```

```html
<kite-use name="user-card" user="{ name: 'Ada', bio: 'Programmer' }" show-bio="true">
  <button slot="actions" kite-on-click="follow()">Follow</button>
</kite-use>
```

---

## 8. `Kite.hook()` — Lifecycle Callbacks

Kite provides 12 granular lifecycle hooks:

| Hook | Invoked When | Arguments |
|---|---|---|
| `before:scan` | Before scanning a DOM tree | `(root)` |
| `after:scan` | After scanning a DOM tree completes | `(root)` |
| `before:mount` | Before a component mounts | `(hostEl, componentName)` |
| `after:mount` | After a component mounts and binds | `(hostEl, componentName)` |
| `before:unmount`| Before tearing down a component | `(hostEl, componentName)` |
| `after:unmount` | After component unbinders run | `(hostEl, componentName)` |
| `before:fetch` | Immediately before dispatching API request | `(requestOpts)` |
| `after:fetch` | After receiving API response | `(response, requestOpts)` |
| `on:error` | When any Kite runtime or network error occurs | `(error)` |
| `on:route` | When client-side route changes | `(routeMatch)` |

```javascript
const off = Kite.hook('before:fetch', (opts) => {
  opts.headers['X-Request-Id'] = crypto.randomUUID();
});
off(); // Unregisters hook
```

---

## 9. Meta-APIs: `override()`, `original()`, `disable()`, `enable()`

### 9.1 Replacing Built-ins

Replace any built-in subsystem while retaining access to the original:

```javascript
// Capture the original text directive
const originalText = Kite.original('directives.text');

// Replace with a capitalized transformer
Kite.override('directives.text', (el, expr, scope) => {
  el.classList.add('custom-text');
  return originalText(el, expr, scope);
});

// Override the HTML sanitizer
Kite.override('sanitize', (dirty) => myDomPurify(dirty));
```

### 9.2 Disabling and Re-enabling Directives

Trim unused directives dynamically:

```javascript
// Disable unused directives
Kite.disable(['for', 'if', 'html']);

// Re-enable when needed
Kite.enable('if');
```

---

## 10. Selective Loading (`only: [...]`) & Per-Element Config

### 10.1 Selective Registration

For minimal-bundle applications, instruct Kite to only process designated directives:

```javascript
Kite.config({ only: ['text', 'on', 'model'] });
```

### 10.2 Per-Element Config Overrides

Override configuration on specific subtrees directly in HTML:

```html
<div kite-config:sanitize="loose">
  <!-- Looser sanitization applied only inside this element -->
  <div kite-html="richMarkup"></div>
</div>
```

---

## 11. Ejecting — Own the Source (`npx kite eject`)

If you want to diverge from built-in implementations, eject the source code directly into your local workspace with zero lock-in:

```bash
npx kite eject directives.for
```

This copies `src/directives/for.js` into `./kite-extensions/for.js` and provides an override snippet:

```javascript
import myCustomFor from './kite-extensions/for.js';
Kite.override('directives.for', myCustomFor);
```

---

## 12. Introspection & State

```javascript
// 1. Inspect entire toolkit registry
Kite.inspect();

// 2. Inspect all directives
Kite.inspect('directives');

// 3. Inspect specific directive
Kite.inspect('text');

// 4. Inspect element's active directives and scope
Kite.inspect(document.querySelector('#profile-card'));

// 5. Read state across models, stores, or nested paths
Kite.state();             // entire reactive tree
Kite.state('todos');      // 'todos' model
Kite.state('todos.items') // items array on 'todos' model
```

---

## 13. Practical Extension Recipes

### 13.1 Click to Copy (`kite-clipboard`)

Copies text to the system clipboard and temporarily changes button text:

```javascript
Kite.directive('clipboard', (el, expr, scope) => {
  const handler = async () => {
    const text = String(Kite.evaluate(expr, scope));
    await navigator.clipboard.writeText(text);

    const original = el.textContent;
    el.textContent = 'Copied! ✓';
    setTimeout(() => {
      el.textContent = original;
    }, 1500);
  };

  el.addEventListener('click', handler);
  return () => el.removeEventListener('click', handler);
});
```

```html
<div kite-scope="{ shareUrl: 'https://getkite.netlify.app/' }">
  <button kite-clipboard="shareUrl">Copy Share Link</button>
</div>
```

### 13.2 Conditional Focus (`kite-focus-when`)

Automatically focuses an input element when a scope condition evaluates to true:

```javascript
Kite.directive('focus-when', (el, expr, scope) => {
  return Kite.watch(scope, () => {
    if (Boolean(Kite.evaluate(expr, scope))) {
      setTimeout(() => el.focus(), 50);
    }
  });
});
```

```html
<div kite-scope="{ isEditing: false }">
  <button kite-on-click="isEditing = true">Edit Name</button>
  <input type="text" kite-if="isEditing" kite-focus-when="isEditing" placeholder="Enter name...">
</div>
```

---

## 14. Related Documentation
- [JavaScript API Reference](./api.md)
- [Safe Expressions & Grammar](./expressions.md)
- [Enterprise Security & CSP](./security.md)
- [Scaffolding & CLI Guide](./cli.md)

