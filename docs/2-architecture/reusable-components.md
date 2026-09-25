# Full-Stack Reusable Components

> **Kite components can carry four layers: markup, styles, behavior, and MVCR architecture.** Package them as lightweight HTML templates, universal Web Components, or full-stack mini-applications.

---

## 1. The Reusability Doctrine

In traditional web development, sharing UI often forces a choice between rigid JavaScript framework components and un-styled static HTML snippets. Kite provides a flexible spectrum of reusability across four distinct layers:

| Layer | Responsibility | Mechanism |
| :--- | :--- | :--- |
| **1. HTML** | Structural markup and accessibility semantics | `<template>`, `<slot>` |
| **2. Styling** | Visual design and layout encapsulation | Scoped `<style>`, utility classes, external CSS |
| **3. Functionality** | Local state, reactive directives, and event handlers | `kite-on-*`, `kite-bind`, component methods |
| **4. MVCR** | Domain data, business actions, views, and routing | `<kite-model>`, `<kite-controller>`, `<kite-view>`, `<kite-route>` |

All four layers can coexist within a single `.html` file, allowing you to distribute self-contained widgets or entire mini-applications with zero build tooling.

---

## 2. The Four Layers in One Component

Here is a complete, self-contained `user-panel` component demonstrating all four layers in a single document:

```html
<!-- user-panel.component.html -->

<!-- Layer 1, 2 & 3: Component Structure, Encapsulated Styling & Interaction -->
<kite-component name="user-panel" kite-shadow>
  <template>
    <style>
      :host {
        display: block;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .panel {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.5rem;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .panel-header {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: #0f172a;
      }
      .panel-bio {
        color: #475569;
        line-height: 1.5;
        margin: 0 0 1rem 0;
      }
      .panel-actions {
        display: flex;
        gap: 0.5rem;
      }
    </style>

    <div class="panel">
      <h2 class="panel-header" kite-text="user.name">User Name</h2>
      <p class="panel-bio" kite-text="user.bio">User biography placeholder...</p>
      <div class="panel-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </template>
</kite-component>

<!-- Layer 4a: Model (Domain State & Remote Operations) -->
<kite-model name="user-panel-model">
  {
    user: { name: "", bio: "" },
    loading: false,
    async load(id) {
      this.loading = true;
      try {
        const res = await fetch(`/api/users/${id}`);
        this.user = await res.json();
      } finally {
        this.loading = false;
      }
    }
  }
</kite-model>

<!-- Layer 4b: Controller (Action Orchestration) -->
<kite-controller model="user-panel-model">
  <kite-action name="load" run="load(id)"></kite-action>
</kite-controller>

<!-- Layer 4c: View (Composition & Lifecycle) -->
<kite-view name="user-panel-view" model="user-panel-model">
  <kite-use name="user-panel"
            user="user"
            kite-on-mount="load(route.params.id)">
    <button slot="actions" kite-on-click="load(route.params.id)">Refresh</button>
  </kite-use>
</kite-view>

<!-- Layer 4d: Route (Client-Side Navigation Mapping) -->
<kite-route path="/users/:id" view="user-panel-view"></kite-route>
```

---

## 3. The Three Reusability Levels

You choose the level of encapsulation and reusability appropriate for your use case:

| Level | Contents | Host Environment | Portability |
| :--- | :--- | :--- | :--- |
| **Level 1: Structural** | HTML `<template>` only | Any HTML page or framework | **Universal**: Pure markup, styled by parent page styles. |
| **Level 2: Web Component** | HTML + Scoped CSS + Behavior | Any web application (Vanilla, React, Vue, Svelte) | **Universal**: Custom Elements standard with Shadow DOM isolation. |
| **Level 3: Full MVCR Bundle** | HTML + CSS + State + Controller + Routing | Kite applications | **High**: Complete standalone feature slice or micro-app. |

### Level Matrix

| Capability | Level 1 (Structural) | Level 2 (Web Component) | Level 3 (Full MVCR Bundle) |
| :--- | :---: | :---: | :---: |
| Custom markup & slots | ✅ | ✅ | ✅ |
| Custom styling isolation | ❌ | ✅ (`kite-shadow`) | ✅ (`kite-shadow` or utility) |
| Local reactivity & events | ❌ | ✅ | ✅ |
| Central state model | ❌ | ❌ | ✅ (`<kite-model>`) |
| Action orchestration | ❌ | ❌ | ✅ (`<kite-controller>`) |
| Declarative routing | ❌ | ❌ | ✅ (`<kite-route>`) |

---

## 4. Packaging and Distributing Level 3 Components

A full MVCR bundle can be distributed via npm as a self-contained package.

### Recommended Directory Structure

```text
kite-user-panel/
├── package.json
├── index.js
├── user-panel.component.html
├── user-panel.styles.css
└── README.md
```

### `package.json`

```json
{
  "name": "kite-user-panel",
  "version": "1.0.0",
  "description": "Full-stack user panel component for Kite and standard web applications",
  "main": "index.js",
  "module": "index.js",
  "files": [
    "index.js",
    "user-panel.component.html",
    "user-panel.styles.css"
  ],
  "peerDependencies": {
    "kite": "^1.0.0"
  },
  "keywords": ["kite", "web-components", "mvcr", "ui"]
}
```

### `index.js` Entry Point

```javascript
import 'kite';

// Load markup and component definition into document head
const templatePath = new URL('./user-panel.component.html', import.meta.url).href;
fetch(templatePath)
  .then(res => res.text())
  .then(html => {
    const div = document.createElement('div');
    div.innerHTML = html;
    document.head.appendChild(div);
  });
```

### Consumption Examples

#### Inside a Kite Application
```html
<script type="module" src="/node_modules/kite-user-panel/index.js"></script>

<kite-view name="profile-view" model="user-panel-model">
  <kite-use name="user-panel" user="user"></kite-use>
</kite-view>
```

#### Inside a React Application (Level 2 Web Component)
```jsx
import 'kite-user-panel';

export function ProfileWidget({ user }) {
  return (
    <user-panel user={JSON.stringify(user)}>
      <button slot="actions" onClick={() => alert('Action triggered')}>Edit</button>
    </user-panel>
  );
}
```

#### Inside a Plain HTML Document
```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/node_modules/kite-user-panel/index.js"></script>
</head>
<body>
  <user-panel></user-panel>
</body>
</html>
```

---

## 5. Production Recipes

### 5.1 Reusable Form Field (HTML + Validation + Behavior)

A validated input component that handles labeling, data binding, and inline error messaging:

```html
<kite-component name="form-input">
  <template>
    <div class="field-group">
      <label class="field-label" kite-text="label">Label</label>
      <input class="field-control"
             kite-bind:type="type || 'text'"
             kite-bind:placeholder="placeholder || ''"
             kite-model="value"
             kite-on-input="validate()">
      <span class="field-error"
            kite-if="error"
            kite-text="error"></span>
    </div>
  </template>
</kite-component>

<!-- Usage -->
<kite-use name="form-input"
          label="Email Address"
          type="email"
          placeholder="you@domain.com"
          value="account.email"
          error="errors.email">
</kite-use>
```

### 5.2 Reusable Data Table (HTML + Scoped Styling + Dynamic Rows)

An encapsulated data table with built-in style isolation using `kite-shadow`:

```html
<kite-component name="data-table" kite-shadow>
  <template>
    <style>
      :host {
        display: block;
        width: 100%;
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-family: inherit;
        font-size: 0.875rem;
      }
      th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      th {
        background-color: #f9fafb;
        font-weight: 600;
        color: #374151;
      }
      tr:hover td {
        background-color: #f3f4f6;
      }
    </style>

    <table>
      <thead>
        <tr>
          <th kite-for="col in columns" kite-text="col.label"></th>
        </tr>
      </thead>
      <tbody>
        <tr kite-for="row in rows">
          <td kite-for="col in columns" kite-text="row[col.key]"></td>
        </tr>
      </tbody>
    </table>
  </template>
</kite-component>

<!-- Usage -->
<kite-use name="data-table"
          columns="[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }]"
          rows="users">
</kite-use>
```

### 5.3 Full MVCR Mini-App (Self-Contained Task Board)

A complete, zero-dependency task manager with data model, business logic, presentation view, and component definition:

```html
<!-- todo-app.html -->

<!-- Component Definition -->
<kite-component name="todo-board">
  <template>
    <div class="todo-board" kite-scope="{ filter: 'all' }">
      <form class="todo-header" kite-on-submit.prevent="add()">
        <input class="todo-input"
               kite-model="draft"
               placeholder="Add a new task..."
               required>
        <button class="todo-btn" type="submit">Add Task</button>
      </form>

      <div class="todo-filters">
        <button kite-class:active="filter === 'all'"
                kite-on-click="filter = 'all'">All</button>
        <button kite-class:active="filter === 'active'"
                kite-on-click="filter = 'active'">Active</button>
        <button kite-class:active="filter === 'done'"
                kite-on-click="filter = 'done'">Completed</button>
      </div>

      <ul class="todo-list">
        <li class="todo-item"
            kite-for="(item, index) in items"
            kite-if="filter === 'all' || (filter === 'active' && !item.done) || (filter === 'done' && item.done)">
          <input type="checkbox" kite-model="item.done">
          <span class="todo-text"
                kite-class:line-through="item.done"
                kite-text="item.title"></span>
          <button class="todo-remove"
                  type="button"
                  kite-on-click="remove(index)">✕</button>
        </li>
      </ul>
    </div>
  </template>
</kite-component>

<!-- Model: Data and Mutation Methods -->
<kite-model name="todo-model">
  {
    items: [
      { title: "Review architectural docs", done: true },
      { title: "Run test suite", done: false }
    ],
    draft: "",
    add() {
      if (!this.draft.trim()) return;
      this.items.push({ title: this.draft.trim(), done: false });
      this.draft = "";
    },
    remove(index) {
      this.items.splice(index, 1);
    }
  }
</kite-model>

<!-- Controller: Explicit Action Handlers -->
<kite-controller model="todo-model">
  <kite-action name="add" run="add()"></kite-action>
  <kite-action name="remove" run="remove(index)"></kite-action>
</kite-controller>

<!-- View: Presentation Mount -->
<kite-view name="todo-view" model="todo-model">
  <kite-use name="todo-board"></kite-use>
</kite-view>
```

---

## 6. CLI Scaffolding with `--styled`

When generating components with the Kite CLI, use the `--styled` (or `-s`) flag to scaffold a component template that includes encapsulated styles and opt-in Shadow DOM:

```bash
# Generate an unstyled component (default)
kite make:component user-badge

# Generate a component with scoped <style> and kite-shadow
kite make:component user-card --styled
```

The `--styled` flag generates:

```html
<kite-component name="user-card" kite-shadow>
  <template>
    <style>
      :host {
        display: block;
      }
      .user-card {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
      }
    </style>
    <div class="user-card">
      <h3 kite-text="name">User Card</h3>
      <slot></slot>
    </div>
  </template>
</kite-component>
```
