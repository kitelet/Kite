# 🪁 Kite — 1-Page Syntax Cheat Sheet

> **HTML is enough for small things.** Everything Kite can do in a single quick-reference card.  
> CDN: `<script type="module" src="https://esm.sh/@kitelet/core"></script>`  
> CSS: `<link rel="stylesheet" href="https://esm.sh/@kitelet/core/dist/kite.css">`

---

## 1. Core Directives

| Directive | Syntax | Description | Example |
|---|---|---|---|
| **Scope** | `kite-scope="{ ... }"` | Declares reactive state on element | `<div kite-scope="{ count: 0 }">` |
| **Text** | `kite-text="expr"` | Safe text content interpolation | `<span kite-text="count"></span>` |
| **HTML** | `kite-html="expr"` | Sanitized HTML content | `<div kite-html="bio"></div>` |
| **Trusted HTML** | `kite-html.trusted="expr"` | Bypasses HTML sanitizer | `<div kite-html.trusted="rawSvg"></div>` |
| **Bind Attribute** | `kite-bind:attr="expr"` | Dynamic HTML attribute binding | `<button kite-bind:disabled="isLoading">` |
| **Boolean Class** | `kite-class:name="expr"` | Toggles CSS class on truthy expression | `<div kite-class:active="isActive">` |
| **Class Object** | `kite-class="{ ... }"` | Toggles multiple classes via object | `<div kite-class="{ active: on, dim: !on }">` |
| **Style Property** | `kite-style:prop="expr"` | Dynamic inline CSS property | `<div kite-style:color="textColor">` |
| **Style Object** | `kite-style="{ ... }"` | Dynamic inline CSS rules | `<div kite-style="{ opacity: alpha }">` |
| **Conditional** | `kite-if="expr"` | Conditionally renders element in DOM | `<p kite-if="items.length > 0">` |
| **Else If** | `kite-elif="expr"` | Alternative conditional branch | `<p kite-elif="isLoading">Loading...</p>` |
| **Else** | `kite-else` | Fallback conditional branch | `<p kite-else>Empty list</p>` |
| **Show / Hide** | `kite-show="expr"` | Toggles CSS `display: none` | `<div kite-show="isOpen">Menu</div>` |
| **List Loop** | `kite-for="item in items"` | Repeats element for array items | `<li kite-for="item in items">` |
| **Loop with Index** | `kite-for="(item, i) in items"` | Loop with zero-based index | `<li kite-for="(item, i) in items">` |
| **Range Loop** | `kite-for="n in 1..10"` | Repeats element over numeric range | `<span kite-for="n in 1..5">★</span>` |
| **Filtered Loop** | `kite-for="t in items where !t.done"` | Inline condition filter | `<li kite-for="t in todos where !t.done">` |
| **Event Listener** | `kite-on-event="expr"` | Listens for DOM events | `<button kite-on-click="count++">` |
| **Two-Way Model** | `kite-model="prop"` | Two-way input/textarea/select sync | `<input type="text" kite-model="name">` |
| **Init Hook** | `kite-init="expr"` | Runs once when element initializes | `<div kite-init="fetchData()">` |
| **Computed** | `kite-computed="{ double: 'n * 2' }"` | Reactive derived properties | `<div kite-computed="{ total: 'qty * price' }">` |
| **Watch** | `kite-watch:prop="expr"` | Executes action when property changes | `<div kite-watch:page="fetchPage()">` |
| **Persistence** | `kite-persist="local\|session"` | Auto-syncs scope to browser storage | `<div kite-scope="{ ... }" kite-persist="local">` |
| **Reset** | `kite-reset` | Resets enclosing scope/form to defaults | `<button type="button" kite-reset>Clear</button>` |
| **Copy Clipboard** | `kite-copy="expr"` | Copies text to clipboard on click | `<button kite-copy="shareUrl">Copy</button>` |
| **Global Hotkey** | `kite-shortcut:key="expr"` | Global keyboard shortcut | `<div kite-shortcut:ctrl+s="save()">` |
| **Custom Event** | `kite-emit:name="detail"` | Dispatches bubbling custom DOM event | `<button kite-emit:deleted="item.id">` |
| **Cloak** | `kite-cloak` | Hides element until Kite finishes compile | `<body kite-cloak>` |
| **Skip** | `kite-skip` | Completely skips element & its children | `<div kite-skip><!-- Uncompiled --></div>` |

---

## 2. Event & Input Modifiers

```html
<!-- Event Modifiers -->
<form kite-on-submit.prevent="save()">        <!-- event.preventDefault() -->
<div kite-on-click.stop="handle()">           <!-- event.stopPropagation() -->
<button kite-on-click.once="submit()">        <!-- fires only once -->
<div kite-on-click.self="close()">            <!-- only if target === currentTarget -->
<input kite-on-input.debounce="300"="search()"> <!-- 300ms debounce -->
<input kite-on-scroll.throttle="100"="onScroll()"> <!-- 100ms throttle -->

<!-- Keyboard Key Filters -->
<input kite-on-keydown.enter="add()">         <!-- Enter key -->
<input kite-on-keydown.escape="cancel()">      <!-- Escape key -->
<input kite-on-keydown.tab="next()">          <!-- Tab key -->
<input kite-on-keydown.space="toggle()">       <!-- Space key -->
<input kite-on-keydown.up="prevItem()">       <!-- Arrow Up -->
<input kite-on-keydown.down="nextItem()">     <!-- Arrow Down -->

<!-- Form Model Modifiers -->
<input type="text" kite-model.trim="name">    <!-- Automatically trims whitespace -->
<input type="text" kite-model.number="age">   <!-- Casts input value to Number -->
<input type="text" kite-model.lazy="bio">     <!-- Syncs on 'change' instead of 'input' -->
```

---

## 3. Declarative MVCR & Components

```html
<!-- Component Definition -->
<kite-component name="user-badge">
  <div class="badge">
    <strong kite-text="name"></strong>
    <slot></slot>
  </div>
</kite-component>

<!-- Component Instantiation -->
<kite-use name="user-badge" name="Ada">
  <span class="role">Admin</span>
</kite-use>

<!-- Named Model with State -->
<kite-model name="todos">
  {
    items: [],
    add(text) {
      if (text.trim()) this.items.push({ id: Date.now(), text, done: false });
    },
    remove(id) {
      this.items = this.items.filter(it => it.id !== id);
    }
  }
</kite-model>

<!-- Named View Bound to Model -->
<kite-view name="todos-view" model="todos">
  <ul>
    <li kite-for="item in items">
      <span kite-text="item.text"></span>
      <button kite-on-click="remove(item.id)">×</button>
    </li>
  </ul>
</kite-view>

<!-- Declarative Hash Router & Outlet -->
<kite-route path="/" view="home-view"></kite-route>
<kite-route path="/todos" view="todos-view"></kite-route>
<kite-route path="/users/:id" view="user-detail" guard="auth.isLoggedIn" redirect="/login"></kite-route>
<kite-route path="*" view="not-found-view"></kite-route>

<kite-outlet></kite-outlet>

<!-- Active Link Helper -->
<a href="#/todos" kite-link kite-active-class="active-nav">Todos</a>

<!-- External HTML Fragment Loading -->
<kite-include src="/app/models/todos.model.html"></kite-include>
```

---

## 4. API Client & Backend Connection

```html
<!-- Declarative API Client -->
<kite-api base="https://api.example.com" adapter="rest">
  <kite-header name="Authorization" value="Bearer eyJhbGci..."></kite-header>
</kite-api>

<!-- Pluggable Adapters: 'rest' | 'json' | 'graphql' | 'local' -->
<kite-model name="todos" api="todos">
  <!-- Automatically injects this.api with:
       this.api.get(), post(), put(), patch(), delete()
       and reactive state flags: loading, error, empty -->
</kite-model>

<!-- Periodic Polling -->
<div kite-poll:5s="fetchData()"></div>
```

---

## 5. Form Validation Rules

| Attribute | Meaning | Example |
|---|---|---|
| `kite-validate` | Enables form-level tracking (`form.valid`, `form.dirty`) | `<form kite-validate>` |
| `kite-required` | Field cannot be empty | `<input kite-required>` |
| `kite-pattern="regex"` | Value must match pattern | `<input kite-pattern="^[0-9]{5}$">` |
| `kite-min="n"` / `kite-max="n"` | Numeric bounds | `<input type="number" kite-min="18">` |
| `kite-error:field="expr"` | Inline error display | `<span kite-error:email="errors.email"></span>` |

---

## 6. Programmatic JavaScript API

```javascript
import Kite from 'https://esm.sh/@kitelet/core';

// State Inspection & Mutation
Kite.get('todos', 'items');            // Read model property
Kite.set('todos', 'items', []);        // Write model property
Kite.call('todos', 'add', 'Buy milk'); // Invoke model method
Kite.state('todos.items');             // Dot-path lookup across models & stores
Kite.dumpState();                      // Debug snapshot of all active scopes

// Extension Points
Kite.directive('focus', (el) => el.focus());
Kite.helper('currency', (n) => `$${Number(n).toFixed(2)}`);
Kite.rule('strongpass', (val) => val.length >= 8);
Kite.component('custom-card', { template: '...', setup(props) { ... } });
Kite.adapter('websocket', { request(config) { ... } });
Kite.hook('after:scan', (root) => console.log('DOM scanned!'));
Kite.use((Kite) => { /* custom plugin */ });

// Introspection & Meta-APIs
Kite.inspect();              // Lists all registered directives, helpers, etc.
Kite.override('text', fn);   // Replaces built-in directive
Kite.original('text');       // Returns original built-in directive
Kite.disable('cloak');       // Disables directive
Kite.enable('cloak');        // Re-enables directive
```

---

## 7. CLI Quick Reference

```bash
# Project Creation & Dev
kite new my-app                    # Scaffold starter project (or: kite create)
kite new my-app --template full    # Scaffold full MVCR project
kite dev                           # Start dev server with SSE live-reload (port 3000)
kite dev --port 8080 --open        # Custom port and auto-open browser
kite build                         # Compile production bundle with inlined includes
kite preview                       # Preview compiled dist/ locally (port 4000)
kite clean                         # Remove dist/ and build caches
kite doctor                        # Diagnose project health and missing files
kite eject directives.for          # Eject built-in directive to kite-extensions/

# Generators & Shortcuts
kite make:component card           # Create app/components/card.component.html
kite g:c card                      # Shortcut alias for make:component
kite g:v user                      # Shortcut alias for make:view
kite g:m todos                     # Shortcut alias for make:model
kite g:ct items                    # Shortcut alias for make:controller
kite g:r /dashboard                # Shortcut alias for make:route
kite g:p auth                      # Shortcut alias for make:plugin
kite make:action logout            # Add action to controller
kite make                          # Interactive generator prompt menu

# Generator Flags
kite make:model items --force      # Overwrite existing file
kite make:view modal --no-include  # Create file without registering in index.html
kite make:component btn --no-comment # Create file without header comments
kite make:view user --path custom/ # Custom output directory

# Project Management & Inspection
kite list                          # List all components, views, models, routes
kite find todos                    # Search files and routes matching query
kite rename todos tasks            # Rename piece across files and includes
kite remove card                   # Remove piece and clean up includes (or: rm)
kite info                          # Inspect project structure, counts, dependencies
```

