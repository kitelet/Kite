# Declarative Components in Kite
> Reusable, isolated HTML blocks with props and content projection slots — defined and used directly in native markup without build steps.

---

## The Philosophy: Components Without Complex Toolchains

In traditional JavaScript frameworks, components require specialized compilers, JSX transformations, complex build setups, and separate file imports.

In Kite, **components are pure HTML**:
- **Define once** using `<kite-component name="...">` wrapping a standard `<template>`.
- **Use anywhere** using `<kite-use name="...">`.
- **Pass data** directly via HTML attributes as reactive props.
- **Fill content gaps** using native `<slot>` elements.

---

## The Component Primitives

Kite uses two custom HTML tags to manage component lifecycles:

| Tag | Responsibility | Location |
| :--- | :--- | :--- |
| `<kite-component name="...">` | Holds the blueprint `<template>` and registers the component globally. | Anywhere in HTML (typically `<head>` or top of `<body>`). |
| `<kite-use name="...">` | Instantiates the component, creates an isolated child scope, resolves slots, and mounts into the DOM. | Anywhere in the page body where the component is displayed. |

---

## Syntax & Structure

### 1. Defining a Component
Wrap your markup inside a standard HTML `<template>`. Variables written inside the template reference props passed to the component:

```html
<kite-component name="user-card">
  <template>
    <div class="user-card">
      <h3 kite-text="username">Default Name</h3>
      <p class="role" kite-text="role">Member</p>
      <div class="bio">
        <!-- Default slot for body content -->
        <slot>No biography provided.</slot>
      </div>
      <div class="actions">
        <!-- Named slot for buttons or links -->
        <slot name="footer"></slot>
      </div>
    </div>
  </template>
</kite-component>
```

---

### 2. Using a Component
Instantiate your component by name with `<kite-use>`. Any attributes on `<kite-use>` become reactive props in the component's scope:

```html
<!-- Basic usage with props and projected slot content -->
<kite-use name="user-card" username="Ada Lovelace" role="Chief Mathematician">
  <p>Pioneering English mathematician and writer known for her work on the Analytical Engine.</p>
  <button slot="footer">Send Message</button>
</kite-use>
```

---

## Content Projection with Slots

Slots allow parent elements to inject arbitrary HTML into pre-defined locations inside a component.

### Default Slot (`<slot>`)
Any children placed inside `<kite-use>` that do **not** have a `slot` attribute are projected into the default `<slot>`:

```html
<!-- Component Template -->
<kite-component name="alert-box">
  <template>
    <div class="alert">
      <strong>Notice:</strong>
      <slot>Default alert message.</slot>
    </div>
  </template>
</kite-component>

<!-- Usage -->
<kite-use name="alert-box">
  <span>Your profile has been saved successfully!</span>
</kite-use>
```

---

### Named Slots (`<slot name="...">`)
For structured layouts (such as modal headers, card footers, or action bars), give slots unique names:

```html
<!-- Component Template -->
<kite-component name="modal-dialog">
  <template>
    <div class="modal-backdrop">
      <div class="modal-window">
        <header class="modal-header">
          <slot name="title"><h3>Dialog</h3></slot>
        </header>
        <div class="modal-body">
          <slot>Modal body text.</slot>
        </div>
        <footer class="modal-footer">
          <slot name="actions">
            <button>Close</button>
          </slot>
        </footer>
      </div>
    </div>
  </template>
</kite-component>

<!-- Usage -->
<kite-use name="modal-dialog">
  <h2 slot="title">Confirm Delete</h2>
  <p>Are you sure you want to delete this repository? This action cannot be undone.</p>
  <div slot="actions">
    <button class="btn-cancel">Cancel</button>
    <button class="btn-danger">Yes, Delete</button>
  </div>
</kite-use>
```

---

### Fallback Slot Content
If the consumer of a component does not provide content for a slot, Kite automatically renders whatever content was defined inside the `<slot>` tag in the component template.

---

## Using Components in Loops (`kite-for`)

Components work seamlessly with `kite-for`. You can stamp out reusable components dynamically across collections:

```html
<kite-component name="product-item">
  <template>
    <div class="product-tile">
      <h4 kite-text="item.name"></h4>
      <p kite-text="'Price: $' + item.price"></p>
      <button kite-on-click="addToCart(item)">Buy</button>
    </div>
  </template>
</kite-component>

<div kite-scope="{
  catalog: [
    { id: 1, name: 'Mechanical Keyboard', price: 120 },
    { id: 2, name: 'Wireless Mouse', price: 65 },
    { id: 3, name: 'Desk Pad', price: 25 }
  ],
  cart: [],
  addToCart(product) {
    this.cart.push(product);
  }
}">
  <h2>Store Catalog</h2>
  <div class="grid">
    <!-- Stamp out product-item components for each catalog entry -->
    <kite-use name="product-item" kite-for="item in catalog"></kite-use>
  </div>

  <p kite-text="'Items in cart: ' + cart.length"></p>
</div>
```

---

## Scope Boundaries & Data Flow

Understanding how data moves into and out of components is straightforward:

1. **Props In**: Attributes on `<kite-use>` are copied into the component's isolated child scope.
2. **Parent Fallback**: If an expression inside the component looks up a variable not defined in its props, it falls back to the parent scope.
3. **Events Out**: Event handlers inside the component (`kite-on-click="addToCart(item)"`) invoke methods available on the parent scope or model.

---

## Practical Examples

### Example 1: Stat Metric Card (Dashboard Widget)
```html
<kite-component name="metric-card">
  <template>
    <div class="stat-card">
      <div class="stat-label" kite-text="label">Metric</div>
      <div class="stat-value" kite-text="value">0</div>
      <div class="stat-trend">
        <slot name="trend"></slot>
      </div>
    </div>
  </template>
</kite-component>

<div class="dashboard-grid">
  <kite-use name="metric-card" label="Active Users" value="14,230">
    <span slot="trend" class="positive">↑ 12% vs last week</span>
  </kite-use>

  <kite-use name="metric-card" label="Server Load" value="42%">
    <span slot="trend" class="neutral">Normal</span>
  </kite-use>
</div>
```

---

## Component Error Boundaries (`<kite-try>` & `<kite-catch>`)

Kite provides native declarative error boundaries to prevent runtime rendering errors from crashing the page or breaking sibling components:

```html
<kite-try>
  <!-- Risky component or remote widget -->
  <kite-use name="external-widget"></kite-use>

  <!-- Fallback rendered only if an exception is thrown inside <kite-try> -->
  <kite-catch>
    <div class="error-notice">
      <p>⚠️ Unable to load widget. Please try refreshing.</p>
    </div>
  </kite-catch>
</kite-try>
```

### Key Behaviors:
- If any directive, expression, or child component inside `<kite-try>` throws an error, Kite automatically hides the failed subtree and reveals `<kite-catch>`.
- Dispatches a `kite:error` event on `window` containing the error details for telemetry and debugging.

---

## Gotchas & Best Practices

> [!TIP]
> **Component Names are Case-Insensitive**: `<kite-component name="UserCard">` can be invoked as `<kite-use name="usercard">` or `<kite-use name="user-card">`. Using lowercase kebab-case (e.g. `user-card`) is standard best practice.

> [!IMPORTANT]
> **Always Wrap Inside `<template>`**: The body of `<kite-component>` must be wrapped in a native `<template>` tag so the browser does not execute scripts or load images before the component is instantiated.

> [!NOTE]
> **No CSS Encapsulation Required**: Kite components use standard DOM elements (`display: contents;` on custom tags), allowing you to style components using standard global CSS classes or utility classes like Tailwind CSS effortlessly.

---

## Related Documentation
- [MVCR Architecture](./mvcr.md)
- [Directive Reference](../1-basics/directives.md)
- [Scope & Reactivity Model](./scope.md)
