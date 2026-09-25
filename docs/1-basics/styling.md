# Universal Styling Compatibility

> **Kite has zero styling opinions. Zero style conflicts. Zero overrides. Zero assumptions.**

---

## 1. The Styling Doctrine

Kite is designed to bring reactivity and architecture to standard HTML without interfering with your visual design layer.

| # | Invariant | Description |
|---|---|---|
| 1 | **Kite ships no styles by default** | `kite.css` is strictly optional and minimal. |
| 2 | **Kite never touches your classes** | `class="..."` passes through unmodified to the DOM. |
| 3 | **Kite never injects global CSS** | No global resets, no un-scoped root variables, and no `*` selectors. |
| 4 | **Kite never overrides utility classes** | Framework utility classes (Tailwind, Bootstrap, Bulma) operate without competition. |
| 5 | **Kite assumes no CSS methodology** | BEM, OOCSS, utility-first, CSS Modules, or vanilla CSS all work identically. |
| 6 | **State modifications are explicit** | `kite-class:<name>` toggles only the exact class you designate. |
| 7 | **Inline style bindings are scoped** | `kite-style:<property>` touches only the designated CSS property. |
| 8 | **Opt-in Shadow DOM isolation** | Use `kite-shadow` on `<kite-component>` when you want true style encapsulation. |

---

## 2. Framework Compatibility Matrix

Because Kite processes standard HTML attributes and renders standard DOM elements, any styling tool that targets HTML works seamlessly.

| Styling Tool | Compatibility | Notes |
| :--- | :---: | :--- |
| **Vanilla CSS** | ✅ Native | Full native support with standard `<link>` or `<style>` tags. |
| **Tailwind CSS** | ✅ Native | Works via standalone CLI, CDN script, or PostCSS build. Zero config needed. |
| **Bootstrap (v5+)** | ✅ Native | Grid, utilities, and components work. `data-bs-*` attributes pass untouched. |
| **Pico.css / Water.css** | ✅ Native | Classless and semantic CSS frameworks apply cleanly to native tags. |
| **Bulma / Foundation** | ✅ Native | Standard class names and responsive grids function out of the box. |
| **UnoCSS / WindiCSS** | ✅ Native | Atomic and on-demand utility engines compile standard class attributes. |
| **CSS Modules** | ✅ Native | Scoped class identifiers pass through attributes without restriction. |
| **Sass / SCSS / Less** | ✅ Native | Compiles to standard CSS; Kite requires no loader plugins. |
| **Shadow DOM Styling** | ✅ Native | Scoped `<style>` blocks inside `<kite-component kite-shadow>`. |
| **CSS Custom Properties** | ✅ Native | Fully responsive to dynamic property binding via `kite-style:*`. |

---

## 3. Integration Examples

### A. Tailwind CSS Integration
Tailwind utility classes apply directly to elements containing Kite reactive directives:

```html
<div class="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md border border-slate-100"
     kite-scope="{ count: 0 }">
  <button class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition"
          kite-on-click="count--">−</button>
  <span class="text-2xl font-bold text-indigo-600"
        kite-text="count"></span>
  <button class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition shadow"
          kite-on-click="count++">+</button>
</div>
```

### B. Bootstrap 5 Integration
Bootstrap classes, grid systems, and data attributes coexist without event collision:

```html
<div class="card shadow-sm"
     kite-scope="{ count: 0 }">
  <div class="card-body d-flex align-items-center gap-3">
    <button class="btn btn-outline-primary"
            kite-on-click="count--">−</button>
    <span class="fs-4 fw-bold text-primary"
          kite-text="count"></span>
    <button class="btn btn-primary"
            kite-on-click="count++">+</button>
  </div>
</div>
```

### C. Vanilla CSS with Dynamic State Classes
Toggle dedicated state classes using `kite-class:<name>`:

```html
<style>
  .counter-box { display: flex; gap: 1rem; align-items: center; padding: 1rem; }
  .counter-val { font-size: 1.5rem; font-weight: bold; }
  .counter-val.is-limit { color: #dc2626; }
</style>

<div class="counter-box"
     kite-scope="{ count: 0 }">
  <button kite-on-click="count--">−</button>
  <span class="counter-val"
        kite-class:is-limit="count >= 10"
        kite-text="count"></span>
  <button kite-on-click="count++">+</button>
</div>
```

### D. Multi-Framework / Mixed Styling
Because Kite never renames classes or wraps elements in extra containers, different styling approaches can coexist across components:

```html
<!-- Outer layout with Tailwind -->
<div class="container mx-auto py-8">
  <!-- Interactive card using Bootstrap -->
  <div class="card p-4"
       kite-scope="{ isOpen: false }">
    <h2 class="custom-brand-heading">Account Status</h2>
    <button class="btn btn-primary mt-3"
            kite-on-click="isOpen = !isOpen">Toggle Details</button>
    
    <div class="mt-3 p-3 bg-light rounded"
         kite-show="isOpen">
      <p class="mb-0 text-muted">All services operational.</p>
    </div>
  </div>
</div>
```

---

## 4. What Kite Never Does

| Operation | Why Kite Avoids It |
|---|---|
| **Injecting a CSS Reset** | A global reset could conflict with your existing typography, margins, or CSS resets. |
| **Injecting Global CSS Variables** | Un-scoped variables risk polluting the `:root` namespace of host pages. |
| **Using `!important` in Runtime Code** | Would disrupt standard CSS cascade hierarchy and specificity rules. |
| **Injecting Wrapper `<div>` Elements** | Preserves layout trees so CSS Grid, Flexbox, and `:nth-child` selectors work as authored. |
| **Renaming or Mangling Classes** | Ensures utility frameworks and external stylesheets match your markup exactly. |

---

## 5. Dynamic Styling Directives

### Single Class Toggle: `kite-class:<name>="expr"`
Toggles a single class name based on expression truthiness:

```html
<button class="tab-button"
        kite-class:active="currentTab === 'profile'"
        kite-on-click="currentTab = 'profile'">
  Profile
</button>
```

### Multi-Class Object Syntax: `kite-class="{ ... }"`
Toggles multiple classes from an object map:

```html
<span class="badge"
      kite-class="{
        'bg-warning text-dark': status === 'pending',
        'bg-success text-white': status === 'active',
        'bg-danger text-white': status === 'suspended'
      }">
</span>
```

### Dynamic Inline Style Property: `kite-style:<property>="expr"`
Safely mutates only the specified inline CSS property:

```html
<div class="progress-bar-fill"
     kite-style:width="progressPercent + '%'"
     kite-style:background-color="progressColor">
</div>
```

---

## 6. Cloaking (`kite-cloak`)

To prevent Flash of Unstyled Content (FOUC) while the browser downloads and initializes scripts:

1. Add the rule to your stylesheet:
   ```css
   [kite-cloak] { display: none !important; }
   ```
2. Attach `kite-cloak` to your template container:
   ```html
   <body kite-cloak>
     <main kite-scope="{ ready: true }">
       <h1 kite-text="'Loaded'"></h1>
     </main>
   </body>
   ```
When Kite finishes compiling the DOM tree, it automatically strips `kite-cloak`, smoothly revealing the interface.

---

## 7. Component Styling Patterns

### Pattern A: External Stylesheet (Recommended)
Define styles in standard CSS files and link them in `<head>`:
```html
<kite-component name="metric-card">
  <template>
    <div class="metric-card">
      <span class="metric-label" kite-text="label"></span>
      <span class="metric-value" kite-text="value"></span>
    </div>
  </template>
</kite-component>
```

### Pattern B: Scoped Styles via Shadow DOM (`kite-shadow`)
Use `kite-shadow` on `<kite-component>` for complete style encapsulation:
```html
<kite-component name="metric-card" kite-shadow>
  <template>
    <style>
      :host { display: block; }
      .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
      .value { font-size: 1.5rem; font-weight: bold; }
    </style>
    <div class="card">
      <div class="value" kite-text="value"></div>
    </div>
  </template>
</kite-component>
```

### Pattern C: Utility Classes inside Templates
Inline framework utility classes directly inside component templates:
```html
<kite-component name="metric-card">
  <template>
    <div class="p-4 rounded-lg border border-slate-200 shadow-sm bg-white">
      <div class="text-2xl font-bold text-slate-800" kite-text="value"></div>
    </div>
  </template>
</kite-component>
```

---

## 8. The Optional `kite.css`

Kite distributes an optional stylesheet (`dist/kite.css`, ~1 KB gzipped). It provides default reset styling strictly for Kite custom tags:

```css
kite-component,
kite-use,
kite-model,
kite-view,
kite-controller,
kite-outlet {
  display: contents;
}
```

Because it uses `display: contents;`, Kite's structural tags disappear from the browser's layout box tree, allowing your Flexbox and Grid parents to align children without interference.
