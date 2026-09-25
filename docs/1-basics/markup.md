# HTML Markup & Attribute Ordering Convention

> **Recommended attribute ordering convention for team readability, code review consistency, and template maintenance.**

---

## 1. Overview

In professional front-end development, consistent formatting conventions (such as CSS property ordering or HTML attribute grouping) improve readability and reduce friction during code reviews. 

Kite defines a recommended **nine-category attribute order** for HTML templates. This order groups element attributes by functional responsibility: native identity, reactive state, input binding, rendering, control flow, event listeners, lifecycle timing, parser overrides, and element-level configuration.

This convention is:
- **Recommended, not runtime-enforced**: The Kite runtime parser evaluates directives correctly regardless of attribute order with zero performance impact.
- **Tool-assisted**: Available via the CLI formatter (`kite format --sort-attrs`) and opt-in static analysis (`eslint-plugin-kite`).

---

## 2. Standard Ordering Specification

Attributes on any element with Kite directives should ideally follow this sequence from left to right:

```html
<tag  [1. identity]  [2. state]  [3. data-in]  [4. render]  [5. control]  [6. events]  [7. lifecycle]  [8. escape]  [9. config]>
```

### Full Example
```html
<div id="user-profile"
     class="card card-active"
     kite-scope="{}"
     kite-model="user"
     kite-text="user.name"
     kite-if="user.isActive"
     kite-on-click="selectUser(user.id)"
     kite-on-mount="logImpression()"
     kite-skip
     kite-config:debounce="250">
</div>
```

---

## 3. Attribute Classification

| Slot | Category | Attributes | Functional Purpose |
| :--- | :--- | :--- | :--- |
| **1** | **Identity & Native** | `id`, `class`, `name`, `type`, `src`, `href`, `data-*` | Native HTML element identification and standard DOM properties. |
| **2** | **State Scope** | `kite-scope`, `kite-persist`, `kite-persist-key` | Declares reactive data boundaries and persistence keys. |
| **3** | **Data Input** | `kite-model`, `kite-bind:*` | Two-way form synchronization and dynamic attribute inputs. |
| **4** | **Rendering** | `kite-text`, `kite-html`, `kite-show`, `kite-class:*`, `kite-style:*`, `kite-number`, `kite-date`, `kite-money`, `kite-timeago` | Reactive DOM content outputs and styling transformations. |
| **5** | **Control Flow** | `kite-if`, `kite-elif`, `kite-else`, `kite-for`, `kite-when`, `kite-each` | Structural DOM branching and collection loops. |
| **6** | **Events** | `kite-on-*` (e.g., `kite-on-click`, `kite-on-submit`) | User interaction handlers and event dispatchers. |
| **7** | **Lifecycle** | `kite-on-mount`, `kite-on-unmount`, `kite-on-update`, `kite-lazy` | Component and element mount/teardown scheduling. |
| **8** | **Parser Escape** | `kite-skip` | Directs the DOM scanner to bypass the element and its children. |
| **9** | **Configuration** | `kite-config:*` | Element-specific engine configuration overrides. |

---

## 4. Engineering Rationale

1. **Native HTML First**: Keeping standard HTML attributes (`id`, `class`, `name`, `type`) at the front preserves semantic clarity and keeps standard element selectors immediately recognizable.
2. **State Before Behavior**: Establishing the reactive scope context before binding variables ensures the reader understands the data model in play.
3. **Inputs Precede Outputs**: Form models and data inputs appear before rendered text or dynamic class outputs.
4. **Structure Precedes Events**: Conditional logic (`kite-if`) and repetition (`kite-for`) dictate whether elements exist in the DOM tree prior to event listener attachment.
5. **Separation of Lifecycle**: Mount/unmount listeners and parser bypass directives sit at the end to avoid cluttering interactive logic.

---

## 5. Examples

### Counter Component
```html
<div class="counter"
     kite-scope="{ count: 0 }">
  <button class="btn btn-dec"
          kite-on-click="count--">−</button>
  <span class="value"
        kite-text="count"></span>
  <button class="btn btn-inc"
          kite-on-click="count++">+</button>
</div>
```

### Form Input with Validation
```html
<input type="email"
       id="user-email"
       name="email"
       kite-model="form.email"
       kite-rule="required|email"
       kite-on-input="validateField('email')">
```

### Collection Item with Conditional Styling
```html
<li class="list-item"
    kite-text="todo.text"
    kite-class:completed="todo.done"
    kite-for="(todo, index) in todos"
    kite-if="!todo.archived"
    kite-on-click="toggleTodo(index)">
</li>
```

---

## 6. Tooling & Automation

- **CLI Auto-formatting**:
  Format existing markup files using the Kite CLI:
  ```bash
  npx kite format --sort-attrs ./public/index.html
  ```
- **ESLint Rule (`eslint-plugin-kite`)**:
  Teams that wish to enforce attribute order across code reviews can enable the rule in `.eslintrc.json`:
  ```json
  {
    "rules": {
      "kite/prefer-attribute-order": "warn"
    }
  }
  ```
  *(Note: This rule is disabled by default in the recommended preset.)*
