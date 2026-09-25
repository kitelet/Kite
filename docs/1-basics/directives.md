# The Kite Directive Reference
> Comprehensive encyclopedia of all HTML directives, attributes, event modifiers, and syntax conventions in Kite.

---

## Directives at a Glance

| Directive | Syntax | Priority | Description |
| :--- | :--- | :---: | :--- |
| [`kite-scope`](#1-kite-scope) | `kite-scope="{ ... }"` | Scope | Declares a reactive state container for an element and its children. |
| [`kite-cloak`](#2-kite-cloak) | `kite-cloak` | Lifecycle | Hides uncompiled HTML until Kite completes initialization. |
| [`kite-skip`](#skip) | `kite-skip` | Pre-scan | Skips element and its children from compilation. |
| [`kite-html`](#13-kite-html--kite-htmltrusted) | `kite-html="expr"` | 900 | Renders sanitized HTML (or raw HTML via `.trusted`). |
| [`kite-if`](#3-kite-if--kite-else) | `kite-if="condition"` | 100 | Conditionally mounts or removes an element from the DOM. |
| [`kite-else`](#3-kite-if--kite-else) | `kite-else` | 100 | Fallback element rendered when preceding `kite-if` is falsy. |
| [`kite-for`](#4-kite-for) | `kite-for="item in list"` | 90 | Iterates over arrays or objects, cloning the element per item. |
| [`kite-view`](#5-kite-view) | `kite-view="modelName"` | 80 | Binds an element and its subtree to a named `<kite-model>`. |
| [`kite-model`](#6-kite-model) | `kite-model="prop"` | 20 | Two-way data binding for form inputs, checkboxes, and selects. |
| [`kite-bind`](#7-kite-bind) | `kite-bind:attr="expr"` | 10 | One-way binding from reactive state to HTML element attributes. |
| [`kite-class`](#8-kite-class) | `kite-class:name="expr"` | 10 | Toggles CSS classes based on truthiness of an expression. |
| [`kite-style`](#14-kite-style) | `kite-style:prop="expr"` | 10 | Dynamic inline CSS properties or style objects. |
| [`kite-show`](#9-kite-show) | `kite-show="expr"` | 10 | Toggles CSS `display: none` without unmounting the element. |
| [`kite-text`](#10-kite-text) | `kite-text="expr"` | 10 | Sets the element's `textContent` to the evaluated expression. |
| [`kite-computed`](#15-kite-computed) | `kite-computed="{ ... }"` | 10 | Reactive derived properties computed from scope state. |
| [`kite-watch`](#16-kite-watch) | `kite-watch:prop="expr"` | 10 | Executes an action whenever an observed property changes. |
| [`kite-persist`](#17-kite-persist) | `kite-persist="local"` | 10 | Automatically syncs scope state to browser storage. |
| [`kite-format`](#format) | `kite-format="type"` | 10 | Formats text content (uppercase, currency, date, json). |
| [`kite-shortcut`](#19-kite-shortcut) | `kite-shortcut:key="expr"` | 10 | Global hotkey keyboard listener. |
| [`kite-emit`](#20-kite-emit) | `kite-emit:name="detail"` | 10 | Dispatches a bubbling custom DOM event. |
| [`kite-copy`](#21-kite-copy) | `kite-copy="text"` | 10 | Copies text to clipboard on click with visual feedback. |
| [`kite-poll`](#22-kite-poll) | `kite-poll:1000="action()"` | 10 | Periodically triggers an expression or method on an interval. |
| [`kite-reset`](#18-kite-reset) | `kite-reset` | 10 | Resets enclosing form inputs and scope state to defaults. |
| [`kite-on-<event>`](#11-kite-on-event) | `kite-on-click="expr"` | 10 | Attaches DOM event listeners with support for modifiers. |
| [`kite-init`](#12-kite-init) | `kite-init="expr"` | 5 | Executes an expression once when the element is first mounted. |

---

## 1. `kite-scope`
> Declares an isolated, reactive state container using plain object syntax.

### Syntax
```html
<div kite-scope="{ key: value, ... }">...</div>
```

### Key Behaviors
- Variables inside `kite-scope` become reactive via JavaScript `Proxy`.
- Scopes can be nested. If a variable is not found in the local scope, Kite looks up through parent scopes to `Kite.state`.
- Writing to a property updates the nearest scope that originally defined it.

### Examples
```html
<!-- Simple scope -->
<div kite-scope="{ count: 0, title: 'Counter' }">
  <h3 kite-text="title"></h3>
  <span kite-text="count"></span>
</div>

<!-- Nested scopes -->
<div kite-scope="{ theme: 'dark' }">
  <div kite-scope="{ section: 'Dashboard' }">
    <!-- Reads section from child, theme from parent -->
    <span kite-text="section + ' (' + theme + ')'"></span>
  </div>
</div>
```

---

## 2. `kite-cloak`
> Prevents Flash of Unstyled Content (FOUC) while the page and script load.

### Syntax
```html
<div kite-cloak kite-scope="{ ... }">...</div>
```

### Key Behaviors
- Pair with `kite.css` (or `[kite-cloak] { display: none !important; }`).
- As soon as Kite compiles and binds the element, it automatically strips the `kite-cloak` attribute, smoothly revealing the DOM.

```html
<head>
  <style>[kite-cloak] { display: none !important; }</style>
  <script type="module" src="https://esm.sh/@kitelet/core"></script>
</head>
<body kite-cloak>
  <div kite-scope="{ user: 'Ada' }">
    <h1 kite-text="'Welcome, ' + user"></h1>
  </div>
</body>
```

---

## 3. `kite-if` & `kite-else`
> Conditionally adds or removes elements from the DOM tree based on expression truthiness.

### Syntax
```html
<div kite-if="condition">Content shown when truthy</div>
<div kite-else>Content shown when falsy</div>
```

### Key Behaviors
- When falsy, the element is completely detached from the DOM and replaced by an invisible comment anchor (`<!-- kite-if -->`). All listeners and child reactors are torn down.
- `kite-else` must immediately follow a `kite-if` element (whitespace and text nodes between them are permitted).

### Examples
```html
<div kite-scope="{ isLoggedIn: false, user: { name: 'Ada' } }">
  <div kite-if="isLoggedIn">
    <p>Welcome back, <strong kite-text="user.name"></strong>!</p>
    <button kite-on-click="isLoggedIn = false">Log out</button>
  </div>
  <div kite-else>
    <p>Please log in to continue.</p>
    <button kite-on-click="isLoggedIn = true">Log in</button>
  </div>
</div>
```

---

## 4. `kite-for`
> Renders a list of elements by iterating over an array or object.

### Syntax
```html
<li kite-for="item in collection">...</li>
<li kite-for="(item, index) in collection">...</li>
```

### Key Behaviors
- Kite automatically intercepts mutating array methods (`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`), updating the DOM immediately.
- Each iteration creates an isolated child scope containing `item` (and `index` if specified), with full fallback to parent variables.

### Examples
```html
<div kite-scope="{
  todos: [
    { id: 1, text: 'Clean desk', done: true },
    { id: 2, text: 'Write Kite docs', done: false }
  ]
}">
  <ul>
    <li kite-for="(todo, index) in todos" kite-class:completed="todo.done">
      <input type="checkbox" kite-model="todo.done">
      <span kite-text="(index + 1) + '. ' + todo.text"></span>
      <button kite-on-click="todos.splice(index, 1)">Delete</button>
    </li>
  </ul>
</div>
```

---

## 5. `kite-view`
> Binds an element and its children directly to a centralized `<kite-model>`.

### Syntax
```html
<!-- Attribute with explicit model name -->
<div kite-view="todos">...</div>

<!-- Or using the model attribute -->
<div kite-view model="todos">...</div>
```

### Key Behaviors
- Resolves the reactive scope of the specified model (registered via `<kite-model name="...">`).
- Allows any standard HTML element (such as `<main>`, `<section>`, or `<div>`) to act as a Model-View container.

### Examples
```html
<kite-model name="cart">
  { items: [], total: 0 }
</kite-model>

<section kite-view="cart">
  <h3>Shopping Cart</h3>
  <p kite-text="'Total items: ' + items.length"></p>
</section>
```

---

## 6. `kite-model`
> Creates two-way synchronization between HTML form controls and scope variables.

### Supported Elements
| Element | Type | Synced Scope Value |
| :--- | :--- | :--- |
| `<input>` | `text`, `email`, `password`, `search`, etc. | `string` |
| `<input>` | `number`, `range` | `number` (automatically parsed) |
| `<input>` | `checkbox` (single) | `boolean` (`true` / `false`) |
| `<input>` | `checkbox` (multiple with `value`) | `Array` (adds/removes value) |
| `<input>` | `radio` | Matches selected `value` |
| `<textarea>` | Any | `string` |
| `<select>` | Standard or multiple | Selected option value(s) |

### Examples
```html
<div kite-scope="{
  name: '',
  quantity: 1,
  newsletter: true,
  tier: 'silver',
  tags: ['frontend']
}">
  <!-- Text Input -->
  <input type="text" placeholder="Name" kite-model="name">

  <!-- Number Input -->
  <input type="number" min="1" kite-model="quantity">

  <!-- Single Boolean Checkbox -->
  <label><input type="checkbox" kite-model="newsletter"> Subscribed</label>

  <!-- Radio Group -->
  <label><input type="radio" name="tier" value="silver" kite-model="tier"> Silver</label>
  <label><input type="radio" name="tier" value="gold" kite-model="tier"> Gold</label>

  <!-- Checkbox Array -->
  <label><input type="checkbox" value="frontend" kite-model="tags"> Frontend</label>
  <label><input type="checkbox" value="backend" kite-model="tags"> Backend</label>
</div>
```

---

## 7. `kite-bind`
> One-way binding from scope expressions to element attributes or properties.

### Syntax
```html
<!-- Single attribute: kite-bind:<attribute> -->
<a kite-bind:href="user.profileUrl">Profile</a>
<img kite-bind:src="avatar" kite-bind:alt="username">
<button kite-bind:disabled="isSubmitting">Submit</button>

<!-- Multi-attribute object: kite-bind="{ ... }" -->
<div kite-bind="{ title: tooltip, role: 'status' }"></div>
```

### Boolean Attribute Handling
When binding attributes like `disabled`, `checked`, `readonly`, `required`, or `hidden`:
- If the expression is **truthy**, the attribute is set (`disabled=""`).
- If the expression is **falsy**, the attribute is completely removed.

---

## 8. `kite-class`
> Dynamically adds or removes CSS class names.

### Syntax
```html
<!-- Single class toggle: kite-class:<classname> -->
<div kite-class:active="isActive" kite-class:has-error="hasError"></div>

<!-- Multi-class object toggle -->
<div kite-class="{ active: isActive, 'text-danger': hasError, shadow: hasShadow }"></div>
```

### Examples
```html
<div kite-scope="{ isSelected: false }">
  <button
    kite-class:btn-primary="isSelected"
    kite-class:btn-secondary="!isSelected"
    kite-on-click="isSelected = !isSelected"
  >
    Toggle Style
  </button>
</div>
```

---

## 9. `kite-show`
> Toggles element visibility via CSS `display: none` without detaching it from the DOM.

### Syntax
```html
<div kite-show="expression">Content</div>
```

### Difference Between `kite-show` and `kite-if`
- **`kite-show`**: The element remains in the DOM tree, retaining its state, focus, scroll position, and input values. It simply toggles `style.display = 'none'` or restores its initial display.
- **`kite-if`**: The element is completely removed from the DOM and recreated when truthy.

```html
<div kite-scope="{ isOpen: false }">
  <button kite-on-click="isOpen = !isOpen">Toggle Details</button>
  <div kite-show="isOpen">
    <p>This content remains mounted in memory for maximum speed.</p>
  </div>
</div>
```

---

## 10. `kite-text`
> Sets the `textContent` of the element to the evaluated expression.

### Syntax
```html
<span kite-text="expression">Fallback Content</span>
```

### Key Behaviors
- Safely updates text without risk of XSS (uses native `textContent`, never `innerHTML`).
- Automatically handles numbers, strings, and expressions. Returns empty string for `null` or `undefined`.

```html
<div kite-scope="{ price: 49.99, tax: 0.08 }">
  <p>Total: $<span kite-text="(price * (1 + tax)).toFixed(2)"></span></p>
</div>
```

---

## 11. `kite-on-<event>`
> Listens to DOM events and evaluates an expression when triggered.

### Syntax
```html
<button kite-on-click="expression">Click Me</button>
<input kite-on-input="expression">
<form kite-on-submit.prevent="expression">Submit</form>
```

### Supported Event Modifiers
Modifiers can be chained in any order:

| Modifier | Target Events | Behavior |
| :--- | :--- | :--- |
| `.prevent` | Any (default on submit) | Calls `event.preventDefault()`. |
| `.stop` | Any | Calls `event.stopPropagation()`. |
| `.once` | Any | Removes listener after the first trigger. |
| `.enter` | Keyboard events | Fires only when the Enter key is pressed. |
| `.escape` | Keyboard events | Fires only when the Escape key is pressed. |
| `.space` | Keyboard events | Fires only when the Spacebar is pressed. |
| `.tab` | Keyboard events | Fires only when the Tab key is pressed. |

### Multi-Statement Sequences
In event expressions, you can chain multiple statements using standard semicolons:
```html
<button kite-on-click="display = '0'; prev = 0; op = null; clearOnNext = false">
  Clear All
</button>
```

---

## 12. `kite-init`
> Executes an expression once when the element is initially mounted into the DOM.

### Syntax
```html
<div kite-scope="{ data: null }" kite-init="data = 'Initialized!'">
  <p kite-text="data"></p>
</div>
```

---

## 13. `kite-html` & `kite-html.trusted`
> Sets the element's `innerHTML` to the evaluated expression result.

### Syntax
```html
<div kite-html="post.body"></div>
<div kite-html.trusted="rawSvgIcon"></div>
```

### Key Behaviors:
- **Sanitized by Default**: Automatically strips `<script>`, `<iframe>`, `javascript:` URLs, and inline event handlers (`onclick`, etc.) via Kite's built-in sanitizer.
- **`.trusted` Modifier**: Bypasses the HTML sanitizer when you explicitly trust the source markup (e.g. static SVGs or local templates).

---

## 14. `kite-style`
> Dynamically binds CSS inline style properties or style objects.

### Syntax
```html
<!-- Single property -->
<div kite-style:color="isActive ? 'red' : 'blue'"></div>
<div kite-style:font-size="size + 'px'"></div>

<!-- Style object -->
<div kite-style="{ color: textColor, opacity: isDimmed ? 0.5 : 1 }"></div>
```

---

## 15. `kite-computed`
> Declares reactive computed properties that automatically derive values from scope state.

### Syntax
```html
<div kite-scope="{ price: 100, qty: 2 }"
     kite-computed="{ total: 'price * qty', formatted: \"'$' + (price * qty).toFixed(2)\" }">
  <span kite-text="formatted"></span>
</div>
```

---

## 16. `kite-watch`
> Observes a property and runs an expression or action whenever that property mutates.

### Syntax
```html
<div kite-scope="{ page: 1 }" kite-watch:page="fetchPage(page)">
  <button kite-on-click="page++">Next Page</button>
</div>
```

---

## 17. `kite-persist`
> Automatically persists and synchronizes the element's scope to `localStorage` or `sessionStorage`.

### Syntax
```html
<div kite-scope="{ theme: 'dark', user: 'Ada' }"
     kite-persist="local"
     kite-persist-key="app.prefs"
     kite-persist-ttl="7d"
     kite-persist-exclude="tempToken">
  ...
</div>
```

### Options:
- `kite-persist="local"` or `kite-persist="session"`.
- `kite-persist-key="custom_name"`: Custom storage key (namespaced under `kite:`).
- `kite-persist-ttl="30s|15m|1h|7d"`: Auto-expires storage data after the TTL.
- `kite-persist-exclude="field1,field2"`: Omits sensitive fields from being saved.

---

## 18. `kite-reset`
> Resets all form inputs and reactive scope variables in the enclosing container back to their initial state.

### Syntax
```html
<form kite-scope="{ query: '', category: 'all' }">
  <input type="text" kite-model="query">
  <button type="button" kite-reset>Clear All</button>
</form>
```

---

## 19. `kite-shortcut`
> Registers a global keyboard shortcut hotkey that triggers an action.

### Syntax
```html
<div kite-shortcut:ctrl+s="save()"></div>
<button kite-shortcut:escape="closeModal()">Close</button>
<button kite-shortcut:ctrl+k="openSearch()">Search</button>
```

---

## 20. `kite-emit`
> Dispatches a bubbling custom DOM event (`CustomEvent`) with optional detail data.

### Syntax
```html
<button kite-emit:item-deleted="item.id">Delete</button>
```

---

## 21. `kite-copy`
> Copies the evaluated text to the system clipboard on click.

### Syntax
```html
<button kite-copy="shareUrl">Copy Link</button>
```

---

## 22. `kite-poll`
> Automatically triggers an action or method periodically on a timer interval.

### Syntax
```html
<!-- Poll every 5 seconds -->
<div kite-poll:5s="refreshData()"></div>

<!-- Millisecond interval -->
<div kite-poll:1000="tick()"></div>
```

---

## Execution Priority Order

When an element has multiple directives, Kite processes them in a deterministic order based on priority:

```text
Highest Priority
  ▲  1. HTML Injection (kite-html: 900)
  │  2. Structural Directives (kite-if: 100, kite-for: 90)
  │  3. Model Scope Binding (kite-view: 80, kite-model: 20)
  │  4. Attributes, Classes & Styles (kite-bind: 10, kite-class: 10, kite-style: 10)
  │  5. Visibility & Text Content (kite-show: 10, kite-text: 10)
  │  6. Reactivity & Storage (kite-computed: 10, kite-watch: 10, kite-persist: 10)
  │  7. Event Listeners & Hotkeys (kite-on-*: 10, kite-shortcut: 10, kite-poll: 10)
  ▼  8. Mount Initialization (kite-init: 5)
Lowest Priority
```

---

## Related Documentation
- [Declarative Components](../2-architecture/components.md)
- [MVCR Architecture](../2-architecture/mvcr.md)
- [Reactivity Model Deep Dive](../2-architecture/scope.md)
